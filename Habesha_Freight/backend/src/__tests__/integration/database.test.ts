import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';

describe('Database CRUD Operations', () => {
  let testDriverId: string;
  let testShipperId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    const [driver] = await db('users')
      .insert({
        full_name: 'Test CRUD Driver',
        phone_number: `+2519${runId}1`,
        email: `testcruddriver${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'DRIVER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testDriverId = driver.id;

    const [shipper] = await db('users')
      .insert({
        full_name: 'Test CRUD Shipper',
        phone_number: `+2519${runId}2`,
        email: `testcrudshipper${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testShipperId = shipper.id;
  });

  after(async () => {
    await db('users').where('id', testDriverId).del();
    await db('users').where('id', testShipperId).del();
    await db.destroy();
  });

  it('Database connection works', async () => {
    const result = await db.raw('SELECT 1 as connected');
    assert.strictEqual(result.rows[0].connected, 1);
  });

  it('All expected tables exist', async () => {
    const tables = ['users', 'vehicles', 'loads', 'bids', 'shipments', 
                    'escrow_ledger', 'location_breadcrumbs', 'disputes', 
                    'reviews', 'audit_logs'];
    
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      assert.ok(exists, `Table ${table} should exist`);
    }
  });

  it('Can create a user', async () => {
    const [user] = await db('users')
      .insert({
        full_name: 'Test User',
        phone_number: `+2519${Date.now()}3`,
        email: `testuser${Date.now()}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');

    assert.ok(user);
    assert.ok(user.id);
    assert.strictEqual(user.full_name, 'Test User');
    
    await db('users').where('id', user.id).del();
  });

  it('Can create a vehicle', async () => {
    const plateNumber = `TEST-CRUD-${Date.now()}`;
    const [vehicle] = await db('vehicles')
      .insert({
        driver_id: testDriverId,
        plate_number: plateNumber,
        vehicle_type: 'SINO_TRUCK',
        capacity_tons: 25,
        is_active: true,
        verification_status: 'VERIFIED',
      })
      .returning('*');

    assert.ok(vehicle);
    assert.ok(vehicle.id);
    assert.strictEqual(vehicle.driver_id, testDriverId);
    assert.strictEqual(vehicle.plate_number, plateNumber);
    
    await db('vehicles').where('id', vehicle.id).del();
  });

  it('Can create a load', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test CRUD Load',
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

    assert.ok(load);
    assert.ok(load.id);
    assert.strictEqual(load.shipper_id, testShipperId);
    
    await db('loads').where('id', load.id).del();
  });

  it('Can create a shipment', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Shipment Load',
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

    assert.ok(shipment);
    assert.ok(shipment.id);
    assert.strictEqual(shipment.load_id, load.id);
    
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Can create a bid', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Bid Load',
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

    assert.ok(bid);
    assert.ok(bid.id);
    assert.strictEqual(bid.load_id, load.id);
    
    await db('bids').where('id', bid.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Can create a dispute', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Dispute Load',
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

    const [dispute] = await db('disputes')
      .insert({
        shipment_id: shipment.id,
        raised_by_id: testShipperId,
        category: 'DELAY',
        reason: 'Test dispute',
        status: 'OPEN',
      })
      .returning('*');

    assert.ok(dispute);
    assert.ok(dispute.id);
    assert.strictEqual(dispute.shipment_id, shipment.id);
    
    await db('disputes').where('id', dispute.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Can create a review', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Review Load',
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

    const [review] = await db('reviews')
      .insert({
        shipment_id: shipment.id,
        reviewer_id: testShipperId,
        reviewee_id: testDriverId,
        rating: 5,
      })
      .returning('*');

    assert.ok(review);
    assert.ok(review.id);
    assert.strictEqual(review.shipment_id, shipment.id);
    
    await db('reviews').where('id', review.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Can create an escrow entry', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Load',
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
        idempotency_key: `ESCROW-TEST-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.ok(escrow);
    assert.ok(escrow.id);
    assert.strictEqual(escrow.shipment_id, shipment.id);
    
    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Can create a location breadcrumb', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Location Load',
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

    const [location] = await db('location_breadcrumbs')
      .insert({
        shipment_id: shipment.id,
        driver_id: testDriverId,
        latitude: 8.9806,
        longitude: 38.7578,
      })
      .returning('*');

    assert.ok(location);
    assert.ok(location.id);
    assert.strictEqual(location.shipment_id, shipment.id);
    
    await db('location_breadcrumbs').where('id', location.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });
});
