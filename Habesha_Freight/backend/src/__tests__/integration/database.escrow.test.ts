import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';

describe('Database Escrow Tests', () => {
  let testDriverId: string;
  let testShipperId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    const [driver] = await db('users')
      .insert({
        full_name: 'Test Escrow Driver',
        phone_number: `+2519${runId}1`,
        email: `testescrowdriver${runId}@test.et`,
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
        full_name: 'Test Escrow Shipper',
        phone_number: `+2519${runId}2`,
        email: `testescrowshipper${runId}@test.et`,
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

  it('Escrow: net_payout = gross_amount - commission', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Calculation Load',
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

    const gross = 50000;
    const commission = gross * 0.05;
    const net = gross - commission;

    const [escrow] = await db('escrow_ledger')
      .insert({
        shipment_id: shipment.id,
        payer_id: testShipperId,
        beneficiary_id: testDriverId,
        gross_amount_etb: gross,
        commission_amount_etb: commission,
        net_payout_amount_etb: net,
        idempotency_key: `ESCROW-CALC-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.strictEqual(Number(escrow.net_payout_amount_etb), net);
    assert.strictEqual(Number(escrow.gross_amount_etb) - Number(escrow.commission_amount_etb), Number(escrow.net_payout_amount_etb));

    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Escrow: Idempotency key prevents duplicate transactions', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Idempotent Load',
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

    const idempotencyKey = `ESCROW-IDEMPOTENT-${Date.now()}`;

    const [escrow1] = await db('escrow_ledger')
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

    await db('escrow_ledger').where('id', escrow1.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Escrow: Multiple escrow entries for same shipment are allowed', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Multiple Load',
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

    const [escrow1] = await db('escrow_ledger')
      .insert({
        shipment_id: shipment.id,
        payer_id: testShipperId,
        beneficiary_id: testDriverId,
        gross_amount_etb: 30000,
        commission_amount_etb: 1500,
        net_payout_amount_etb: 28500,
        idempotency_key: `ESCROW-MULTI-1-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    const [escrow2] = await db('escrow_ledger')
      .insert({
        shipment_id: shipment.id,
        payer_id: testShipperId,
        beneficiary_id: testDriverId,
        gross_amount_etb: 20000,
        commission_amount_etb: 1000,
        net_payout_amount_etb: 19000,
        idempotency_key: `ESCROW-MULTI-2-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.ok(escrow1);
    assert.ok(escrow2);
    assert.strictEqual(escrow1.shipment_id, shipment.id);
    assert.strictEqual(escrow2.shipment_id, shipment.id);

    await db('escrow_ledger').where('id', escrow1.id).del();
    await db('escrow_ledger').where('id', escrow2.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });
});
