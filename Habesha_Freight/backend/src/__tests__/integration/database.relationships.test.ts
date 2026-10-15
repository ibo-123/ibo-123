import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';

describe('Database Relationship Tests', () => {
  let testDriverId: string;
  let testShipperId: string;
  let testLoadId: string;
  let testShipmentId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    // Create test driver with unique phone
    const [driver] = await db('users')
      .insert({
        full_name: 'Test Driver',
        phone_number: `+2519${runId}1`,
        email: `testdriver${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'DRIVER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testDriverId = driver.id;

    // Create test shipper with unique phone
    const [shipper] = await db('users')
      .insert({
        full_name: 'Test Shipper',
        phone_number: `+2519${runId}2`,
        email: `testshipper${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testShipperId = shipper.id;

    // Create test load
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Cargo',
        weight_tons: 10,
        origin_city: 'Addis Ababa',
        destination_city: 'Hawassa',
        origin_lat: 8.9806,
        origin_lng: 38.7578,
        destination_lat: 7.0621,
        destination_lng: 38.4763,
        offered_price_etb: 50000,
        status: 'POSTED',
      })
      .returning('*');
    testLoadId = load.id;

    // Create test shipment
    const [shipment] = await db('shipments')
      .insert({
        load_id: testLoadId,
        carrier_id: testDriverId,
        status: 'ASSIGNED',
        pickup_otp_hash: 'hashed_pickup_otp',
        delivery_otp_hash: 'hashed_delivery_otp',
      })
      .returning('*');
    testShipmentId = shipment.id;
  });

  after(async () => {
    // Clean up in reverse order
    await db('shipments').where('id', testShipmentId).del();
    await db('loads').where('id', testLoadId).del();
    await db('users').where('id', testDriverId).del();
    await db('users').where('id', testShipperId).del();
    await db.destroy();
  });

  describe('Foreign Key Constraints', () => {
    it('All foreign keys exist as expected', async () => {
      const fkConstraints = await db.raw(`
        SELECT 
          conname as constraint_name,
          conrelid::regclass as table_name,
          a.attname as column_name,
          confrelid::regclass as references_table
        FROM pg_constraint 
        JOIN pg_attribute a ON a.attnum = ANY(conkey) AND a.attrelid = conrelid
        WHERE contype = 'f'
      `);
      
      assert.ok(fkConstraints.rows.length > 0);
    });

    it('Valid foreign key insertion succeeds', async () => {
      const [vehicle] = await db('vehicles')
        .insert({
          driver_id: testDriverId,
          plate_number: `TEST-${Date.now()}`,
          vehicle_type: 'SINO_TRUCK',
          capacity_tons: 25,
          is_active: true,
          verification_status: 'VERIFIED',
        })
        .returning('*');

      assert.ok(vehicle);
      assert.strictEqual(vehicle.driver_id, testDriverId);
      await db('vehicles').where('id', vehicle.id).del();
    });

    it('Invalid foreign key insertion fails', async () => {
      const invalidDriverId = uuidv4();
      
      try {
        await db('vehicles')
          .insert({
            driver_id: invalidDriverId,
            plate_number: `TEST-${Date.now()}`,
            vehicle_type: 'SINO_TRUCK',
            capacity_tons: 25,
            is_active: true,
            verification_status: 'VERIFIED',
          })
          .returning('*');
        assert.fail('Should have thrown foreign key violation');
      } catch (error: any) {
        assert.ok(error.message.includes('foreign key constraint'));
      }
    });

    it('CASCADE delete on users -> loads', async () => {
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Cargo Cascade',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      await db('users').where('id', testShipperId).del();
      
      const deletedLoad = await db('loads').where('id', load.id).first();
      assert.ok(!deletedLoad);
      
      // Recreate shipper with unique phone
      const newRunId = Date.now();
      const [newShipper] = await db('users')
        .insert({
          full_name: 'Test Shipper',
          phone_number: `+2519${newRunId}3`,
          email: `testshipper${newRunId}@test.et`,
          password_hash: 'hashed_password',
          role: 'SHIPPER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');
      testShipperId = newShipper.id;
    });

    it('CASCADE delete on loads -> bids', async () => {
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Cargo Bids',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [bid] = await db('bids')
        .insert({
          load_id: load.id,
          driver_id: testDriverId,
          bid_amount_etb: 45000,
          status: 'PENDING',
        })
        .returning('*');

      await db('loads').where('id', load.id).del();
      
      const deletedBid = await db('bids').where('id', bid.id).first();
      assert.ok(!deletedBid);
    });

    it('CASCADE delete on loads -> shipments', async () => {
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Cargo Shipments',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: testDriverId,
          status: 'ASSIGNED',
          pickup_otp_hash: 'hashed_pickup_otp',
          delivery_otp_hash: 'hashed_delivery_otp',
        })
        .returning('*');

      await db('loads').where('id', load.id).del();
      
      const deletedShipment = await db('shipments').where('id', shipment.id).first();
      assert.ok(!deletedShipment);
    });

    it('CASCADE delete on shipments -> escrow, locations, disputes, reviews', async () => {
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Cargo Cascade All',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: testDriverId,
          status: 'ASSIGNED',
          pickup_otp_hash: 'hashed_pickup_otp',
          delivery_otp_hash: 'hashed_delivery_otp',
        })
        .returning('*');

      const [escrow] = await db('escrow_ledger')
        .insert({
          shipment_id: shipment.id,
          payer_id: testShipperId,
          beneficiary_id: testDriverId,
          gross_amount_etb: 50000,
          commission_amount_etb: 2500,
          net_payout_amount_etb: 47500,
          idempotency_key: `ESCROW-${shipment.id}`,
          status: 'PENDING',
        })
        .returning('*');

      const [location] = await db('location_breadcrumbs')
        .insert({
          shipment_id: shipment.id,
          driver_id: testDriverId,
          latitude: 8.9806,
          longitude: 38.7578,
        })
        .returning('*');

      const [dispute] = await db('disputes')
        .insert({
          shipment_id: shipment.id,
          raised_by_id: testShipperId,
          category: 'DELAY',
          reason: 'Test dispute',
          status: 'OPEN',
        })
        .returning('*');

      const [review] = await db('reviews')
        .insert({
          shipment_id: shipment.id,
          reviewer_id: testShipperId,
          reviewee_id: testDriverId,
          rating: 5,
        })
        .returning('*');

      await db('shipments').where('id', shipment.id).del();
      
      const deletedEscrow = await db('escrow_ledger').where('id', escrow.id).first();
      const deletedLocation = await db('location_breadcrumbs').where('id', location.id).first();
      const deletedDispute = await db('disputes').where('id', dispute.id).first();
      const deletedReview = await db('reviews').where('id', review.id).first();
      
      assert.ok(!deletedEscrow);
      assert.ok(!deletedLocation);
      assert.ok(!deletedDispute);
      assert.ok(!deletedReview);
    });

    it('RESTRICT delete on users -> shipments (carrier)', async () => {
      const newRunId = Date.now();
      const [newDriver] = await db('users')
        .insert({
          full_name: 'Test Driver Restrict',
          phone_number: `+2519${newRunId}4`,
          email: `testdriverrestrict${newRunId}@test.et`,
          password_hash: 'hashed_password',
          role: 'DRIVER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');

      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Restrict',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: newDriver.id,
          status: 'ASSIGNED',
          pickup_otp_hash: 'hashed_pickup_otp',
          delivery_otp_hash: 'hashed_delivery_otp',
        })
        .returning('*');

      try {
        await db('users').where('id', newDriver.id).del();
        assert.fail('Should have thrown restrict violation');
      } catch (error: any) {
        assert.ok(error.message.includes('foreign key constraint'));
      }

      await db('shipments').where('id', shipment.id).del();
      await db('loads').where('id', load.id).del();
      await db('users').where('id', newDriver.id).del();
    });

    it('SET NULL delete on shipments -> vehicles', async () => {
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Set Null',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [vehicle] = await db('vehicles')
        .insert({
          driver_id: testDriverId,
          plate_number: `TEST-SETNULL-${Date.now()}`,
          vehicle_type: 'SINO_TRUCK',
          capacity_tons: 25,
          is_active: true,
          verification_status: 'VERIFIED',
        })
        .returning('*');

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: testDriverId,
          vehicle_id: vehicle.id,
          status: 'ASSIGNED',
          pickup_otp_hash: 'hashed_pickup_otp',
          delivery_otp_hash: 'hashed_delivery_otp',
        })
        .returning('*');

      await db('vehicles').where('id', vehicle.id).del();
      
      const updatedShipment = await db('shipments').where('id', shipment.id).first();
      assert.strictEqual(updatedShipment.vehicle_id, null);

      await db('shipments').where('id', shipment.id).del();
      await db('loads').where('id', load.id).del();
    });

    it('SET NULL delete on disputes -> resolved_by', async () => {
      // Create a dedicated driver ONLY for this test - no shipments referencing it
      const newRunId = Date.now();
      const [resolverDriver] = await db('users')
        .insert({
          full_name: 'Test Resolver Driver',
          phone_number: `+2519${newRunId}5`,
          email: `testresolver${newRunId}@test.et`,
          password_hash: 'hashed_password',
          role: 'DRIVER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');

      // Create a shipment for the dispute - using testDriverId (existing driver) as carrier
      // so resolverDriver is ONLY referenced by disputes.resolved_by_id
      const [load] = await db('loads')
        .insert({
          shipper_id: testShipperId,
          cargo_description: 'Test Dispute Set Null',
          weight_tons: 10,
          origin_city: 'Addis Ababa',
          destination_city: 'Hawassa',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
          destination_lat: 7.0621,
          destination_lng: 38.4763,
          offered_price_etb: 50000,
          status: 'POSTED',
        })
        .returning('*');

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: testDriverId,  // Use existing testDriverId, not resolverDriver
          status: 'ASSIGNED',
          pickup_otp_hash: 'hashed_pickup_otp',
          delivery_otp_hash: 'hashed_delivery_otp',
        })
        .returning('*');

      // Create a dispute with resolved_by_id set to resolverDriver
      // This is the ONLY reference to resolverDriver
      const [dispute] = await db('disputes')
        .insert({
          shipment_id: shipment.id,
          raised_by_id: testShipperId,
          category: 'DELAY',
          reason: 'Test dispute for set null',
          status: 'RESOLVED',
          resolved_by_id: resolverDriver.id,
        })
        .returning('*');

      // Verify the dispute has resolved_by_id set
      const initialDispute = await db('disputes').where('id', dispute.id).first();
      assert.strictEqual(initialDispute.resolved_by_id, resolverDriver.id);

      // Delete the resolver driver - should set NULL on disputes.resolved_by_id
      await db('users').where('id', resolverDriver.id).del();
      
      const updatedDispute = await db('disputes').where('id', dispute.id).first();
      assert.strictEqual(updatedDispute.resolved_by_id, null);

      // Clean up
      await db('disputes').where('id', dispute.id).del();
      await db('shipments').where('id', shipment.id).del();
      await db('loads').where('id', load.id).del();
    });
  });
});
