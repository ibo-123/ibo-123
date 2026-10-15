import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';

describe('Database Constraint Tests', () => {
  let testDriverId: string;
  let testShipperId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    const [driver] = await db('users')
      .insert({
        full_name: 'Test Constraint Driver',
        phone_number: `+2519${runId}1`,
        email: `testconstraintdriver${runId}@test.et`,
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
        full_name: 'Test Constraint Shipper',
        phone_number: `+2519${runId}2`,
        email: `testconstraintshipper${runId}@test.et`,
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

  it('users.phone_number has UNIQUE constraint', async () => {
    const [user] = await db('users')
      .insert({
        full_name: 'Test Unique Phone',
        phone_number: `+2519${Date.now()}3`,
        email: `testunique${Date.now()}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');

    try {
      await db('users')
        .insert({
          full_name: 'Duplicate Phone',
          phone_number: user.phone_number,
          email: `duplicate${Date.now()}@test.et`,
          password_hash: 'hashed_password',
          role: 'SHIPPER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');
      assert.fail('Should have thrown unique constraint violation');
    } catch (error: any) {
      assert.ok(error.message.includes('unique constraint'));
    }

    await db('users').where('id', user.id).del();
  });

  it('users.email has UNIQUE constraint', async () => {
    const [user] = await db('users')
      .insert({
        full_name: 'Test Unique Email',
        phone_number: `+2519${Date.now()}4`,
        email: `testuniqueemail${Date.now()}@test.et`,
        password_hash: 'hashed_password',
        role: 'SHIPPER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');

    try {
      await db('users')
        .insert({
          full_name: 'Duplicate Email',
          phone_number: `+2519${Date.now()}5`,
          email: user.email,
          password_hash: 'hashed_password',
          role: 'SHIPPER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');
      assert.fail('Should have thrown unique constraint violation');
    } catch (error: any) {
      assert.ok(error.message.includes('unique constraint'));
    }

    await db('users').where('id', user.id).del();
  });

  it('vehicles.plate_number has UNIQUE constraint', async () => {
    const plateNumber = `TEST-UNIQUE-${Date.now()}`;
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

    try {
      await db('vehicles')
        .insert({
          driver_id: testDriverId,
          plate_number: plateNumber,
          vehicle_type: 'TRAILER',
          capacity_tons: 35,
          is_active: true,
          verification_status: 'VERIFIED',
        })
        .returning('*');
      assert.fail('Should have thrown unique constraint violation');
    } catch (error: any) {
      assert.ok(error.message.includes('unique constraint'));
    }

    await db('vehicles').where('id', vehicle.id).del();
  });

  it('escrow_ledger.idempotency_key has UNIQUE constraint', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Constraint Load',
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

    const idempotencyKey = `ESCROW-UNIQUE-${Date.now()}`;
    const [escrow] = await db('escrow_ledger')
      .insert({
        shipment_id: shipment.id,
        payer_id: testShipperId,
        beneficiary_id: testDriverId,
        gross_amount_etb: 50000,
        commission_amount_etb: 2500,
        net_payout_amount_etb: 47500,
        idempotency_key: idempotencyKey,
        status: 'PENDING',
      })
      .returning('*');

    try {
      await db('escrow_ledger')
        .insert({
          shipment_id: shipment.id,
          payer_id: testShipperId,
          beneficiary_id: testDriverId,
          gross_amount_etb: 50000,
          commission_amount_etb: 2500,
          net_payout_amount_etb: 47500,
          idempotency_key: idempotencyKey,
          status: 'PENDING',
        })
        .returning('*');
      assert.fail('Should have thrown unique constraint violation');
    } catch (error: any) {
      assert.ok(error.message.includes('unique constraint'));
    }

    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('NOT NULL constraints exist on required fields', async () => {
    // Check the actual NOT NULL constraints from the schema
    const columns = await db.raw(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('full_name', 'phone_number', 'password_hash', 'role')
    `);

    const columnMap: Record<string, string> = {};
    columns.rows.forEach((row: any) => {
      columnMap[row.column_name] = row.is_nullable;
    });

    // These columns should be NOT NULL (is_nullable = 'NO')
    assert.strictEqual(columnMap['full_name'], 'NO', 'full_name should be NOT NULL');
    assert.strictEqual(columnMap['phone_number'], 'NO', 'phone_number should be NOT NULL');
    assert.strictEqual(columnMap['password_hash'], 'NO', 'password_hash should be NOT NULL');
    assert.strictEqual(columnMap['role'], 'NO', 'role should be NOT NULL');
  });
});
