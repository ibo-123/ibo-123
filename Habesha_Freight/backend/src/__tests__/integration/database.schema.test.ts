import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import db from '../../config/db';

describe('Database Schema Tests', () => {
  let runId: number;

  before(async () => {
    runId = Date.now();
  });

  after(async () => {
    await db.destroy();
  });

  it('Database has all expected tables', async () => {
    const expectedTables = [
      'users',
      'vehicles', 
      'loads',
      'bids',
      'shipments',
      'escrow_ledger',
      'location_breadcrumbs',
      'disputes',
      'reviews',
      'audit_logs'
    ];
    
    const actualTables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    
    const tableNames = actualTables.rows.map((row: any) => row.table_name);
    
    for (const expected of expectedTables) {
      assert.ok(tableNames.includes(expected), `Table '${expected}' should exist`);
    }
  });

  it('users table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'full_name', 'phone_number', 'email', 'password_hash',
      'role', 'is_verified', 'otp_code', 'otp_expires_at',
      'created_at', 'updated_at', 'status', 'kyc_status',
      'kyc_rejection_reason', 'kyc_reviewed_by', 'kyc_reviewed_at',
      'deleted_at', 'profile_photo_url', 'license_number',
      'license_photo_url', 'settings', 'company_logo_url',
      'company_registration_number', 'company_description',
      'fayda_number', 'fayda_verified', 'license_status',
      'last_known_location'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in users table`);
    }
  });

  it('vehicles table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'driver_id', 'plate_number', 'vehicle_type',
      'capacity_tons', 'is_active', 'created_at', 'updated_at',
      'verification_status', 'verification_reason', 'verified_by',
      'verified_at', 'documents', 'origin_lat', 'origin_lng',
      'origin_geom', 'assigned_driver_id'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in vehicles table`);
    }
  });

  it('loads table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'loads'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'shipper_id', 'cargo_description', 'weight_tons',
      'origin_city', 'destination_city', 'origin_lat', 'origin_lng',
      'destination_lat', 'destination_lng', 'status',
      'offered_price_etb', 'created_at', 'updated_at',
      'origin_geom', 'destination_geom'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in loads table`);
    }
  });

  it('bids table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bids'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'load_id', 'driver_id', 'bid_amount_etb',
      'status', 'created_at', 'updated_at', 'vehicle_id',
      'is_counter_offer', 'original_bid_id', 'is_auto_accept'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in bids table`);
    }
  });

  it('shipments table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shipments'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'load_id', 'carrier_id', 'vehicle_id',
      'status', 'pickup_otp_hash', 'delivery_otp_hash',
      'pickup_verified_at', 'delivery_verified_at',
      'created_at', 'updated_at'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in shipments table`);
    }
  });

  it('escrow_ledger table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'escrow_ledger'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'shipment_id', 'payer_id', 'beneficiary_id',
      'gross_amount_etb', 'commission_amount_etb',
      'net_payout_amount_etb', 'gateway_reference',
      'idempotency_key', 'status', 'locked_at',
      'released_at', 'created_at', 'updated_at'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in escrow_ledger table`);
    }
  });

  it('location_breadcrumbs table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'location_breadcrumbs'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'shipment_id', 'driver_id', 'latitude',
      'longitude', 'speed', 'recorded_at', 'created_at'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in location_breadcrumbs table`);
    }
  });

  it('disputes table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'disputes'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'shipment_id', 'raised_by_id', 'category',
      'reason', 'status', 'resolution_notes',
      'resolved_by_id', 'created_at', 'updated_at'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in disputes table`);
    }
  });

  it('reviews table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reviews'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'shipment_id', 'reviewer_id', 'reviewee_id',
      'rating', 'comment', 'created_at'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in reviews table`);
    }
  });

  it('audit_logs table has correct columns', async () => {
    const columns = await db.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'audit_logs'
    `);
    
    const columnNames = columns.rows.map((c: any) => c.column_name);
    
    const expectedColumns = [
      'id', 'user_id', 'action', 'ip_address',
      'details', 'created_at', 'target_type', 'target_id'
    ];
    
    for (const expected of expectedColumns) {
      assert.ok(columnNames.includes(expected), `Column '${expected}' should exist in audit_logs table`);
    }
  });
});
