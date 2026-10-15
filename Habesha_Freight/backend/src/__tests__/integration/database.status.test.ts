import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';

describe('Database Status Flow Tests', () => {
  let testDriverId: string;
  let testShipperId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    
    // Create test driver
    const [driver] = await db('users')
      .insert({
        full_name: 'Test Status Driver',
        phone_number: `+2519${runId}1`,
        email: `teststatusdriver${runId}@test.et`,
        password_hash: 'hashed_password',
        role: 'DRIVER',
        is_verified: true,
        status: 'ACTIVE',
        kyc_status: 'APPROVED',
      })
      .returning('*');
    testDriverId = driver.id;

    // Create test shipper
    const [shipper] = await db('users')
      .insert({
        full_name: 'Test Status Shipper',
        phone_number: `+2519${runId}2`,
        email: `teststatusshipper${runId}@test.et`,
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

  it('Load: POSTED -> MATCHED -> DISPATCHED -> IN_TRANSIT -> DELIVERED', async () => {
    // Create a load
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Status Flow Load',
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

    assert.strictEqual(load.status, 'POSTED');

    // Update to MATCHED
    const [matched] = await db('loads')
      .where('id', load.id)
      .update({ status: 'MATCHED' })
      .returning('*');
    assert.strictEqual(matched.status, 'MATCHED');

    // Update to DISPATCHED
    const [dispatched] = await db('loads')
      .where('id', load.id)
      .update({ status: 'DISPATCHED' })
      .returning('*');
    assert.strictEqual(dispatched.status, 'DISPATCHED');

    // Update to IN_TRANSIT
    const [inTransit] = await db('loads')
      .where('id', load.id)
      .update({ status: 'IN_TRANSIT' })
      .returning('*');
    assert.strictEqual(inTransit.status, 'IN_TRANSIT');

    // Update to DELIVERED
    const [delivered] = await db('loads')
      .where('id', load.id)
      .update({ status: 'DELIVERED' })
      .returning('*');
    assert.strictEqual(delivered.status, 'DELIVERED');

    await db('loads').where('id', load.id).del();
  });

  it('Load: POSTED -> CANCELLED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Cancel Load',
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

    assert.strictEqual(load.status, 'POSTED');

    const [cancelled] = await db('loads')
      .where('id', load.id)
      .update({ status: 'CANCELLED' })
      .returning('*');
    assert.strictEqual(cancelled.status, 'CANCELLED');

    await db('loads').where('id', load.id).del();
  });

  it('Shipment: ASSIGNED -> DISPATCHED -> IN_TRANSIT -> DELIVERED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Shipment Flow Load',
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

    assert.strictEqual(shipment.status, 'ASSIGNED');

    const [dispatched] = await db('shipments')
      .where('id', shipment.id)
      .update({ status: 'DISPATCHED' })
      .returning('*');
    assert.strictEqual(dispatched.status, 'DISPATCHED');

    const [inTransit] = await db('shipments')
      .where('id', shipment.id)
      .update({ status: 'IN_TRANSIT' })
      .returning('*');
    assert.strictEqual(inTransit.status, 'IN_TRANSIT');

    const [delivered] = await db('shipments')
      .where('id', shipment.id)
      .update({ status: 'DELIVERED' })
      .returning('*');
    assert.strictEqual(delivered.status, 'DELIVERED');

    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Shipment: Any status -> DISPUTED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Dispute Flow Load',
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
        status: 'IN_TRANSIT',
        pickup_otp_hash: 'hashed_pickup_otp',
        delivery_otp_hash: 'hashed_delivery_otp',
      })
      .returning('*');

    assert.strictEqual(shipment.status, 'IN_TRANSIT');

    const [disputed] = await db('shipments')
      .where('id', shipment.id)
      .update({ status: 'DISPUTED' })
      .returning('*');
    assert.strictEqual(disputed.status, 'DISPUTED');

    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Bid: PENDING -> ACCEPTED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Bid Accept Load',
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

    assert.strictEqual(bid.status, 'PENDING');

    const [accepted] = await db('bids')
      .where('id', bid.id)
      .update({ status: 'ACCEPTED' })
      .returning('*');
    assert.strictEqual(accepted.status, 'ACCEPTED');

    await db('bids').where('id', bid.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Bid: PENDING -> REJECTED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Bid Reject Load',
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

    assert.strictEqual(bid.status, 'PENDING');

    const [rejected] = await db('bids')
      .where('id', bid.id)
      .update({ status: 'REJECTED' })
      .returning('*');
    assert.strictEqual(rejected.status, 'REJECTED');

    await db('bids').where('id', bid.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Dispute: OPEN -> UNDER_REVIEW -> RESOLVED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Dispute Resolve Load',
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

    assert.strictEqual(dispute.status, 'OPEN');

    const [review] = await db('disputes')
      .where('id', dispute.id)
      .update({ status: 'UNDER_REVIEW' })
      .returning('*');
    assert.strictEqual(review.status, 'UNDER_REVIEW');

    const [resolved] = await db('disputes')
      .where('id', dispute.id)
      .update({ 
        status: 'RESOLVED',
        resolution_notes: 'Resolved by admin',
        resolved_by_id: testDriverId
      })
      .returning('*');
    assert.strictEqual(resolved.status, 'RESOLVED');

    await db('disputes').where('id', dispute.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Dispute: OPEN -> UNDER_REVIEW -> REJECTED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Dispute Reject Load',
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
        reason: 'Test dispute reject',
        status: 'OPEN',
      })
      .returning('*');

    assert.strictEqual(dispute.status, 'OPEN');

    const [review] = await db('disputes')
      .where('id', dispute.id)
      .update({ status: 'UNDER_REVIEW' })
      .returning('*');
    assert.strictEqual(review.status, 'UNDER_REVIEW');

    const [rejected] = await db('disputes')
      .where('id', dispute.id)
      .update({ 
        status: 'REJECTED',
        resolution_notes: 'Rejected by admin',
        resolved_by_id: testDriverId
      })
      .returning('*');
    assert.strictEqual(rejected.status, 'REJECTED');

    await db('disputes').where('id', dispute.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Escrow: PENDING -> LOCKED -> RELEASED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Release Load',
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
        idempotency_key: `ESCROW-RELEASE-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.strictEqual(escrow.status, 'PENDING');

    const [locked] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'LOCKED' })
      .returning('*');
    assert.strictEqual(locked.status, 'LOCKED');

    const [released] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'RELEASED' })
      .returning('*');
    assert.strictEqual(released.status, 'RELEASED');

    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Escrow: PENDING -> LOCKED -> REFUNDED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Refund Load',
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
        idempotency_key: `ESCROW-REFUND-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.strictEqual(escrow.status, 'PENDING');

    const [locked] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'LOCKED' })
      .returning('*');
    assert.strictEqual(locked.status, 'LOCKED');

    const [refunded] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'REFUNDED' })
      .returning('*');
    assert.strictEqual(refunded.status, 'REFUNDED');

    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });

  it('Escrow: PENDING -> LOCKED -> DISPUTED', async () => {
    const [load] = await db('loads')
      .insert({
        shipper_id: testShipperId,
        cargo_description: 'Test Escrow Dispute Load',
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
        idempotency_key: `ESCROW-DISPUTE-${Date.now()}`,
        status: 'PENDING',
      })
      .returning('*');

    assert.strictEqual(escrow.status, 'PENDING');

    const [locked] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'LOCKED' })
      .returning('*');
    assert.strictEqual(locked.status, 'LOCKED');

    const [disputed] = await db('escrow_ledger')
      .where('id', escrow.id)
      .update({ status: 'DISPUTED' })
      .returning('*');
    assert.strictEqual(disputed.status, 'DISPUTED');

    await db('escrow_ledger').where('id', escrow.id).del();
    await db('shipments').where('id', shipment.id).del();
    await db('loads').where('id', load.id).del();
  });
});
