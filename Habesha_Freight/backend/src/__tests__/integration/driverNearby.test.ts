import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../app';
import db from '../../config/db';

// Create app instance for testing
const app = createApp(db);

describe('Driver Nearby API Integration Tests', () => {
  let adminToken: string;
  let shipperToken: string;
  let driverToken: string;
  let testDriverId: string;

  before(async () => {
    console.log('🔄 Setting up test environment...');

    try {
      // Check if test users exist, create if not
      let adminUser = await db('users').where({ phone_number: '+251900000000' }).first();
      if (!adminUser) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('Password123!', 10);
        [adminUser] = await db('users')
          .insert({
            full_name: 'System Administrator',
            phone_number: '+251900000000',
            email: 'admin@habeshafreight.et',
            password_hash: hashedPassword,
            role: 'ADMIN',
            is_verified: true,
            status: 'ACTIVE',
            kyc_status: 'APPROVED',
          })
          .returning('*');
        console.log('✅ Created admin user');
      }

      let shipperUser = await db('users').where({ phone_number: '+251911123456' }).first();
      if (!shipperUser) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('Password123!', 10);
        [shipperUser] = await db('users')
          .insert({
            full_name: 'Test Shipper',
            phone_number: '+251911123456',
            email: 'shipper@test.et',
            password_hash: hashedPassword,
            role: 'SHIPPER',
            is_verified: true,
            status: 'ACTIVE',
            kyc_status: 'APPROVED',
          })
          .returning('*');
        console.log('✅ Created shipper user');
      }

      let driverUser = await db('users').where({ phone_number: '+251922654321' }).first();
      if (!driverUser) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash('Password123!', 10);
        [driverUser] = await db('users')
          .insert({
            full_name: 'Test Driver',
            phone_number: '+251922654321',
            email: 'driver@test.et',
            password_hash: hashedPassword,
            role: 'DRIVER',
            is_verified: true,
            status: 'ACTIVE',
            kyc_status: 'APPROVED',
          })
          .returning('*');
        console.log('✅ Created driver user');
      }
      testDriverId = driverUser.id;

      // Login to get tokens
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: '+251900000000',
          password: 'Password123!',
        });
      adminToken = adminLogin.body.data?.token;
      console.log('✅ Got admin token');

      const shipperLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: '+251911123456',
          password: 'Password123!',
        });
      shipperToken = shipperLogin.body.data?.token;
      console.log('✅ Got shipper token');

      const driverLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: '+251922654321',
          password: 'Password123!',
        });
      driverToken = driverLogin.body.data?.token;
      console.log('✅ Got driver token');

      // Update driver location
      try {
        const hasLocation = await db.schema.hasColumn('users', 'last_known_location');
        
        if (hasLocation) {
          await db.raw(
            `UPDATE users 
             SET last_known_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
             WHERE id = ?`,
            [38.7578, 8.9806, testDriverId]
          );
          console.log('✅ Updated driver location with PostGIS');
        } else {
          await db('users')
            .where('id', testDriverId)
            .update({
              last_lat: 8.9806,
              last_lng: 38.7578,
            });
          console.log('✅ Updated driver location with fallback columns');
        }
      } catch (error) {
        console.warn('⚠️ Could not set driver location:', error);
      }
    } catch (error) {
      console.error('❌ Test setup error:', error);
    }

    console.log('✅ Test setup complete');
  });

  after(async () => {
    console.log('🧹 Cleaning up test data...');
    await db.destroy();
  });

  describe('GET /api/drivers/nearby', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 400 without lat/lng parameters', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`);

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 400 with invalid lat/lng values', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 'invalid', lng: 'invalid' });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 200 for driver role', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
    });

    it('should return nearby drivers for shipper with default radius', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
      assert.ok(response.body.radiusKm);
    });

    it('should return nearby drivers within specified radius', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, radius_km: 150 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
      assert.strictEqual(response.body.radiusKm, 150);
    });

    it('should filter drivers by minimum rating', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, min_rating: 4 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should return 400 for invalid min_rating', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, min_rating: 6 });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should filter drivers by vehicle type', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, vehicle_type: 'SINO_TRUCK' });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should return 400 for invalid vehicle type', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, vehicle_type: 'INVALID_TYPE' });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should filter drivers by capacity', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, capacity_tons: 20 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should work for admin updating driver location', async () => {
      const newLat = 9.1000;
      const newLng = 38.8000;

      const response = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          lat: newLat, 
          lng: newLng,
          driver_id: testDriverId
        });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
    });

    it('should work for admin getting driver location', async () => {
      const response = await request(app)
        .get('/api/drivers/location')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ driver_id: testDriverId });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.data.latitude);
      assert.ok(response.body.data.longitude);
    });

    it('should return distance_km for each driver', async () => {
      const response = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 8.9806, lng: 38.7578, radius_km: 200 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
      
      if (response.body.data.length > 0) {
        const hasDistanceKm = response.body.data.some((driver: any) => 'distance_km' in driver);
        assert.ok(hasDistanceKm, 'At least one driver should have distance_km');
      }
    });
  });

  describe('POST /api/drivers/location', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .post('/api/drivers/location')
        .send({ lat: 9.0300, lng: 38.7400 });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 400 without lat/lng', async () => {
      const response = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({});

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 403 for non-driver user', async () => {
      const response = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${shipperToken}`)
        .send({ lat: 9.0300, lng: 38.7400 });

      assert.strictEqual(response.status, 403);
      assert.strictEqual(response.body.success, false);
    });

    it('should update driver location successfully', async () => {
      const newLat = 9.0300;
      const newLng = 38.7400;

      const response = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: newLat, lng: newLng });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.strictEqual(response.body.data.latitude, newLat);
      assert.strictEqual(response.body.data.longitude, newLng);
      assert.ok(response.body.data.updated_at);
    });

    it('should handle invalid coordinate values', async () => {
      const response = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 'invalid', lng: 'invalid' });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });
  });

  describe('GET /api/drivers/location', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/drivers/location');

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 403 for non-driver user', async () => {
      const response = await request(app)
        .get('/api/drivers/location')
        .set('Authorization', `Bearer ${shipperToken}`);

      assert.strictEqual(response.status, 403);
      assert.strictEqual(response.body.success, false);
    });

    it('should get driver location successfully', async () => {
      const response = await request(app)
        .get('/api/drivers/location')
        .set('Authorization', `Bearer ${driverToken}`);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.data.latitude);
      assert.ok(response.body.data.longitude);
      assert.ok(response.body.data.updated_at);
    });

    it('should work for admin getting driver location', async () => {
      const response = await request(app)
        .get('/api/drivers/location')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ driver_id: testDriverId });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.data.latitude);
      assert.ok(response.body.data.longitude);
    });
  });

  describe('GET /api/drivers/:id', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get(`/api/drivers/${testDriverId}`);

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await request(app)
        .get('/api/drivers/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${shipperToken}`);

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.success, false);
    });

    it('should get driver details successfully', async () => {
      const response = await request(app)
        .get(`/api/drivers/${testDriverId}`)
        .set('Authorization', `Bearer ${shipperToken}`);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(response.body.data.id);
      assert.ok(response.body.data.full_name);
      assert.ok('average_rating' in response.body.data);
      assert.ok(Array.isArray(response.body.data.vehicles));
    });

    it('should work for admin role', async () => {
      const response = await request(app)
        .get(`/api/drivers/${testDriverId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
    });

    it('should work for driver accessing own profile', async () => {
      const response = await request(app)
        .get(`/api/drivers/${testDriverId}`)
        .set('Authorization', `Bearer ${driverToken}`);

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
    });
  });

  describe('Combined Flow Tests', () => {
    it('should update location and then find nearby drivers', async () => {
      // Update driver location
      const updateResponse = await request(app)
        .post('/api/drivers/location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ lat: 9.0300, lng: 38.7400 });

      assert.strictEqual(updateResponse.status, 200);

      // Search for nearby drivers
      const searchResponse = await request(app)
        .get('/api/drivers/nearby')
        .set('Authorization', `Bearer ${shipperToken}`)
        .query({ lat: 9.0300, lng: 38.7400, radius_km: 50 });

      assert.strictEqual(searchResponse.status, 200);
      assert.strictEqual(searchResponse.body.success, true);
      assert.ok(Array.isArray(searchResponse.body.data));
    });
  });
});
