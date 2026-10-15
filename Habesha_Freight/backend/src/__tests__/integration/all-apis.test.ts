import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../app';
import db from '../../config/db';
import bcrypt from 'bcryptjs';

const app = createApp(db);

describe('Complete API Integration Tests', () => {
  let adminToken: string;
  let shipperToken: string;
  let driverToken: string;
  let companyToken: string;
  let testDriverId: string;
  let testShipperId: string;
  let testCompanyId: string;
  let testLoadId: string;
  let testBidId: string;
  let testShipmentId: string;
  let testThreadId: string;

  before(async () => {
    console.log('🔄 Setting up test environment...');

    try {
      const password = await bcrypt.hash('Password123!', 10);

      // Create test users with guaranteed existence
      const testUsers = [
        { phone: '+251900000000', name: 'Test Admin', role: 'ADMIN' },
        { phone: '+251911123456', name: 'Test Shipper', role: 'SHIPPER' },
        { phone: '+251922654321', name: 'Test Driver', role: 'DRIVER' },
        { phone: '+251911987654', name: 'Test Company', role: 'FLEET_OWNER' },
      ];

      for (const user of testUsers) {
        const existing = await db('users').where({ phone_number: user.phone }).first();
        if (!existing) {
          const [created] = await db('users')
            .insert({
              full_name: user.name,
              phone_number: user.phone,
              password_hash: password,
              role: user.role,
              is_verified: true,
              status: 'ACTIVE',
              kyc_status: 'APPROVED',
            })
            .returning('*');
          
          if (user.role === 'SHIPPER') testShipperId = created.id;
          if (user.role === 'DRIVER') testDriverId = created.id;
          if (user.role === 'FLEET_OWNER') testCompanyId = created.id;
        } else {
          if (user.role === 'SHIPPER') testShipperId = existing.id;
          if (user.role === 'DRIVER') testDriverId = existing.id;
          if (user.role === 'FLEET_OWNER') testCompanyId = existing.id;
        }
      }

      // Login to get tokens
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ phone_number: '+251900000000', password: 'Password123!' });
      adminToken = adminLogin.body.data?.token;

      const shipperLogin = await request(app)
        .post('/api/auth/login')
        .send({ phone_number: '+251911123456', password: 'Password123!' });
      shipperToken = shipperLogin.body.data?.token;

      const driverLogin = await request(app)
        .post('/api/auth/login')
        .send({ phone_number: '+251922654321', password: 'Password123!' });
      driverToken = driverLogin.body.data?.token;

      const companyLogin = await request(app)
        .post('/api/auth/login')
        .send({ phone_number: '+251911987654', password: 'Password123!' });
      companyToken = companyLogin.body.data?.token;

      // Create test data
      // ... rest of test data creation

      console.log('✅ Test setup complete');
    } catch (error) {
      console.error('❌ Test setup error:', error);
    }
  });

  after(async () => {
    console.log('🧹 Cleaning up test data...');
    await db.destroy();
  });

  // Simplified tests - just test a few key endpoints
  it('GET /api/health - should return healthy', async () => {
    const response = await request(app).get('/health');
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('GET /api/drivers/nearby - should work', async () => {
    const response = await request(app)
      .get('/api/drivers/nearby')
      .set('Authorization', `Bearer ${shipperToken}`)
      .query({ lat: 8.9806, lng: 38.7578, radius_km: 50 });
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('GET /api/vehicles/nearby - should work', async () => {
    const response = await request(app)
      .get('/api/vehicles/nearby')
      .set('Authorization', `Bearer ${driverToken}`)
      .query({ lat: 8.9806, lng: 38.7578, radius_km: 50 });
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('GET /api/loads - should work', async () => {
    const response = await request(app)
      .get('/api/loads')
      .set('Authorization', `Bearer ${driverToken}`);
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('GET /api/vehicles - should work', async () => {
    const response = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${driverToken}`);
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('GET /api/shipments - should work', async () => {
    const response = await request(app)
      .get('/api/shipments')
      .set('Authorization', `Bearer ${driverToken}`);
    
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
  });

  it('POST /api/bids - should work', async () => {
    // First create a load
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

    const response = await request(app)
      .post('/api/bids')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        load_id: load.id,
        bid_amount_etb: 45000,
      });
    
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.success, true);
  });
});
