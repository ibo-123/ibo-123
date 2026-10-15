import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../app';
import db from '../../config/db';

const app = createApp(db);

describe('Vehicle Nearby API Integration Tests', () => {
  let adminToken: string;
  let driverToken: string;
  let fleetOwnerToken: string;
  let testDriverId: string;
  let testVehicleId: string;
  let runId: number;

  before(async () => {
    runId = Date.now();
    console.log('🔄 Setting up test environment...');

    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('Password123!', 10);

      // Create admin
      let adminUser = await db('users').where({ phone_number: '+251900000000' }).first();
      if (!adminUser) {
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
      }

      // Create driver
      let driverUser = await db('users').where({ phone_number: `+2519${runId}3` }).first();
      if (!driverUser) {
        [driverUser] = await db('users')
          .insert({
            full_name: 'Test Vehicle Driver',
            phone_number: `+2519${runId}3`,
            email: `testvehicledriver${runId}@test.et`,
            password_hash: hashedPassword,
            role: 'DRIVER',
            is_verified: true,
            status: 'ACTIVE',
            kyc_status: 'APPROVED',
          })
          .returning('*');
      }
      testDriverId = driverUser.id;

      // Create fleet owner
      let fleetUser = await db('users').where({ phone_number: `+2519${runId}4` }).first();
      if (!fleetUser) {
        [fleetUser] = await db('users')
          .insert({
            full_name: 'Test Fleet Owner',
            phone_number: `+2519${runId}4`,
            email: `testfleet${runId}@test.et`,
            password_hash: hashedPassword,
            role: 'FLEET_OWNER',
            is_verified: true,
            status: 'ACTIVE',
            kyc_status: 'APPROVED',
          })
          .returning('*');
      }

      // Login to get tokens
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: '+251900000000',
          password: 'Password123!',
        });
      adminToken = adminLogin.body.data?.token;

      const driverLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: `+2519${runId}3`,
          password: 'Password123!',
        });
      driverToken = driverLogin.body.data?.token;

      const fleetLogin = await request(app)
        .post('/api/auth/login')
        .send({
          phone_number: `+2519${runId}4`,
          password: 'Password123!',
        });
      fleetOwnerToken = fleetLogin.body.data?.token;

      // Create a test vehicle
      const [vehicle] = await db('vehicles')
        .insert({
          driver_id: testDriverId,
          plate_number: `VEHICLE-${runId}`,
          vehicle_type: 'SINO_TRUCK',
          capacity_tons: 25,
          is_active: true,
          verification_status: 'VERIFIED',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
        })
        .returning('*');
      testVehicleId = vehicle.id;

    } catch (error) {
      console.error('❌ Test setup error:', error);
    }

    console.log('✅ Test setup complete');
  });

  after(async () => {
    console.log('🧹 Cleaning up test data...');
    await db('vehicles').where('id', testVehicleId).del();
    await db('users').where('id', testDriverId).del();
    await db.destroy();
  });

  describe('GET /api/vehicles/nearby', () => {
    it('should return 401 without authentication token', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 400 without lat/lng parameters', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`);

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should return 400 with invalid lat/lng values', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 'invalid', lng: 'invalid' });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should return nearby vehicles for driver with default radius', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
      assert.ok(response.body.radiusKm);
    });

    it('should return nearby vehicles within specified radius', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578, radius_km: 100 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
      assert.strictEqual(response.body.radiusKm, 100);
    });

    it('should return nearby vehicles for fleet owner', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${fleetOwnerToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should return nearby vehicles for admin', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should filter vehicles by minimum capacity', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578, min_capacity: 20 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should filter vehicles by vehicle type', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578, vehicle_type: 'SINO_TRUCK' });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should return 400 for invalid vehicle type', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578, vehicle_type: 'INVALID_TYPE' });

      assert.strictEqual(response.status, 400);
      assert.strictEqual(response.body.success, false);
    });

    it('should filter by multiple criteria', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ 
          lat: 8.9806, 
          lng: 38.7578, 
          radius_km: 50,
          min_capacity: 20,
          vehicle_type: 'SINO_TRUCK'
        });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      assert.ok(Array.isArray(response.body.data));
    });

    it('should return vehicle owner information', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      
      if (response.body.data.length > 0) {
        const vehicle = response.body.data[0];
        assert.ok('owner_name' in vehicle);
        assert.ok('owner_phone' in vehicle);
      }
    });

    it('should return distance_km for each vehicle', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.body.success, true);
      
      if (response.body.data.length > 0) {
        assert.ok('distance_km' in response.body.data[0]);
        assert.ok(typeof response.body.data[0].distance_km === 'number');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });

    it('should handle invalid token', async () => {
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', 'Bearer invalid-token')
        .query({ lat: 8.9806, lng: 38.7578 });

      assert.strictEqual(response.status, 401);
      assert.strictEqual(response.body.success, false);
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time (under 500ms)', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: 8.9806, lng: 38.7578, radius_km: 50 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      assert.strictEqual(response.status, 200);
      assert.ok(responseTime < 500, `Response took ${responseTime}ms, expected < 500ms`);
    });
  });

  describe('Combined Flow Tests', () => {
    it('should register vehicle and then find it nearby', async () => {
      const newPlate = `TEST-${Date.now()}`;
      
      // Register a new vehicle
      const registerResponse = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          plate_number: newPlate,
          vehicle_type: 'ISUZU_DRY',
          capacity_tons: 15,
          origin_lat: 8.9806,
          origin_lng: 38.7578,
        });

      assert.strictEqual(registerResponse.status, 201);
      const newVehicleId = registerResponse.body.data.id;

      // Verify the vehicle was created with the location data
      const vehicle = await db('vehicles').where('id', newVehicleId).first();
      assert.ok(vehicle, 'Vehicle should exist in database');
      assert.strictEqual(vehicle.origin_lat, 8.9806);
      assert.strictEqual(vehicle.origin_lng, 38.7578);

      // Search for nearby vehicles with a generous radius
      const searchResponse = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ 
          lat: 8.9806, 
          lng: 38.7578, 
          radius_km: 200  // Large radius to ensure we find it
        });

      assert.strictEqual(searchResponse.status, 200);
      assert.strictEqual(searchResponse.body.success, true);
      
      const found = searchResponse.body.data.some((v: any) => v.id === newVehicleId);
      assert.ok(found, 'Newly registered vehicle should be found in nearby search');

      await db('vehicles').where('id', newVehicleId).del();
    });

    it('should update vehicle location and find it in new location', async () => {
      const newLat = 9.1000;
      const newLng = 38.8000;
      
      await db('vehicles')
        .where('id', testVehicleId)
        .update({
          origin_lat: newLat,
          origin_lng: newLng,
        });

      const searchResponse = await request(app)
        .get('/api/vehicles/nearby')
        .set('Authorization', `Bearer ${driverToken}`)
        .query({ lat: newLat, lng: newLng, radius_km: 50 });

      assert.strictEqual(searchResponse.status, 200);
      assert.strictEqual(searchResponse.body.success, true);
      
      const found = searchResponse.body.data.some((v: any) => v.id === testVehicleId);
      assert.ok(found, 'Vehicle should be found in new location');
    });
  });
});
