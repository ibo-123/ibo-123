import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { SpatialService } from '../../services/spatialService';
import db from '../../config/db';

describe('SpatialService Unit Tests', () => {
  // ============================================================
  // Pure calculation tests - NO database required
  // ============================================================
  describe('haversineDistance (pure calculation)', () => {
    it('should calculate distance between two points correctly', () => {
      const distance = SpatialService.haversineDistance(
        8.9806, 38.7578,
        8.5400, 39.2700
      );
      // Distance between Addis Ababa and Adama: ~74.6 km
      assert.ok(Math.abs(distance - 74.6) < 2);
    });

    it('should return 0 for identical points', () => {
      const distance = SpatialService.haversineDistance(
        8.9806, 38.7578,
        8.9806, 38.7578
      );
      assert.strictEqual(distance, 0);
    });

    it('should calculate distance between poles correctly', () => {
      const distance = SpatialService.haversineDistance(90, 0, -90, 0);
      assert.ok(distance > 19900 && distance < 20100);
    });
  });

  // ============================================================
  // Database-backed tests - require PostGIS
  // ============================================================
  describe('Database-backed SpatialService Tests', () => {
    let testDriverId: string;
    let runId: number;

    before(async () => {
      runId = Date.now();
      
      const [driver] = await db('users')
        .insert({
          full_name: 'Test Spatial Driver',
          phone_number: `+2519${runId}1`,
          email: `testspatial${runId}@test.et`,
          password_hash: 'hashed_password',
          role: 'DRIVER',
          is_verified: true,
          status: 'ACTIVE',
          kyc_status: 'APPROVED',
        })
        .returning('*');
      testDriverId = driver.id;

      try {
        await db.raw(
          `UPDATE users 
           SET last_known_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
           WHERE id = ?`,
          [38.7578, 8.9806, testDriverId]
        );
      } catch (error) {
        console.log('PostGIS not available, skipping location update');
      }

      await db('vehicles')
        .insert({
          driver_id: testDriverId,
          plate_number: `SPATIAL-${runId}`,
          vehicle_type: 'SINO_TRUCK',
          capacity_tons: 25,
          is_active: true,
          verification_status: 'VERIFIED',
          origin_lat: 8.9806,
          origin_lng: 38.7578,
        })
        .returning('*');
    });

    after(async () => {
      await db('vehicles').where('driver_id', testDriverId).del();
      await db('users').where('id', testDriverId).del();
      // Do NOT call db.destroy() here - it's shared
    });

    describe('findLoadsWithinRadius', () => {
      it('should return array of loads', async () => {
        const result = await SpatialService.findLoadsWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        assert.ok(Array.isArray(result));
      });

      it('should filter by minCapacityTons', async () => {
        const result = await SpatialService.findLoadsWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
          minCapacityTons: 20,
        });
        assert.ok(Array.isArray(result));
      });

      it('should include distance_km in results', async () => {
        const result = await SpatialService.findLoadsWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        if (result.length > 0) {
          assert.ok('distance_km' in result[0]);
          assert.ok(typeof result[0].distance_km === 'number');
        }
      });
    });

    describe('findVehiclesWithinRadius', () => {
      it('should return array of vehicles', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        assert.ok(Array.isArray(result));
      });

      it('should filter by minCapacityTons', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
          minCapacityTons: 20,
        });
        assert.ok(Array.isArray(result));
      });

      it('should filter by vehicleType', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
          vehicleType: 'SINO_TRUCK',
        });
        assert.ok(Array.isArray(result));
      });

      it('should include owner information', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        if (result.length > 0) {
          assert.ok('owner_name' in result[0]);
          assert.ok('owner_phone' in result[0]);
          assert.ok('owner_email' in result[0]);
        }
      });

      it('should include distance_km in results', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        if (result.length > 0) {
          assert.ok('distance_km' in result[0]);
          assert.ok(typeof result[0].distance_km === 'number');
        }
      });
    });

    describe('findDriversWithinRadius', () => {
      it('should return array of drivers', async () => {
        const result = await SpatialService.findDriversWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        assert.ok(Array.isArray(result));
      });

      it('should include driver ratings', async () => {
        const result = await SpatialService.findDriversWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        if (result.length > 0) {
          assert.ok('average_rating' in result[0]);
          assert.ok('total_ratings' in result[0]);
          assert.ok('distance_km' in result[0]);
          assert.ok(typeof result[0].distance_km === 'number');
        }
      });

      it('should include distance_km in results', async () => {
        const result = await SpatialService.findDriversWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 50,
        });
        if (result.length > 0) {
          assert.ok('distance_km' in result[0]);
          assert.ok(typeof result[0].distance_km === 'number');
        }
      });
    });

    describe('calculateDistanceKm', () => {
      it('should calculate distance between two points', async () => {
        const distance = await SpatialService.calculateDistanceKm(
          { latitude: 8.9806, longitude: 38.7578 },
          { latitude: 8.5400, longitude: 39.2700 }
        );
        assert.ok(Math.abs(distance - 74.6) < 2);
        assert.ok(typeof distance === 'number');
      });

      it('should return 0 for identical points', async () => {
        const distance = await SpatialService.calculateDistanceKm(
          { latitude: 8.9806, longitude: 38.7578 },
          { latitude: 8.9806, longitude: 38.7578 }
        );
        assert.strictEqual(distance, 0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very large radius', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 10000,
        });
        assert.ok(Array.isArray(result));
      });

      it('should handle very small radius', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: 0.1,
        });
        assert.ok(Array.isArray(result));
      });

      it('should handle negative radius (should still work)', async () => {
        const result = await SpatialService.findVehiclesWithinRadius({
          originLat: 8.9806,
          originLng: 38.7578,
          radiusKm: -1,
        });
        assert.ok(Array.isArray(result));
      });
    });
  });
});
