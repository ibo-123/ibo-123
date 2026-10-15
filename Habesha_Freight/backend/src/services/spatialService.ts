import db from '../config/db';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface NearbyLoadQuery {
  originLat: number;
  originLng: number;
  radiusKm: number;
  minCapacityTons?: number;
}

export interface NearbyVehicleQuery {
  originLat: number;
  originLng: number;
  radiusKm: number;
  minCapacityTons?: number;
  vehicleType?: string;
}

export interface NearbyDriverQuery {
  originLat: number;
  originLng: number;
  radiusKm: number;
  minRating?: number;
  vehicleType?: string;
  capacityTons?: number;
}

export class SpatialService {
  static async findLoadsWithinRadius(query: NearbyLoadQuery) {
    const { originLat, originLng, radiusKm, minCapacityTons } = query;

    let sqlQuery = db('loads')
      .select(
        'id',
        'shipper_id',
        'cargo_description',
        'weight_tons',
        'origin_city',
        'destination_city',
        'offered_price_etb',
        'status',
        'origin_lat',
        'origin_lng',
        'destination_lat',
        'destination_lng'
      )
      .where('status', 'POSTED')
      .whereNotNull('origin_lat')
      .whereNotNull('origin_lng');

    if (minCapacityTons) {
      sqlQuery = sqlQuery.where('weight_tons', '<=', minCapacityTons);
    }

    const loads = await sqlQuery;
    
    const filtered = loads.filter(load => {
      const distance = this.haversineDistance(
        originLat,
        originLng,
        load.origin_lat,
        load.origin_lng
      );
      return distance <= radiusKm;
    });

    return filtered.map(load => ({
      ...load,
      distance_km: this.haversineDistance(
        originLat,
        originLng,
        load.origin_lat,
        load.origin_lng
      )
    })).sort((a, b) => a.distance_km - b.distance_km);
  }

  static async findVehiclesWithinRadius(query: NearbyVehicleQuery) {
    const { originLat, originLng, radiusKm, minCapacityTons, vehicleType } = query;

    let sqlQuery = db('vehicles')
      .select(
        'vehicles.id',
        'vehicles.driver_id',
        'vehicles.plate_number',
        'vehicles.vehicle_type',
        'vehicles.capacity_tons',
        'vehicles.is_active',
        'vehicles.verification_status',
        'vehicles.origin_lat',
        'vehicles.origin_lng',
        'users.full_name as owner_name',
        'users.phone_number as owner_phone',
        'users.email as owner_email'
      )
      .join('users', 'vehicles.driver_id', 'users.id')
      .where('vehicles.is_active', true)
      .where('vehicles.verification_status', 'VERIFIED')
      .where('users.is_verified', true)
      .where('users.status', 'ACTIVE')
      .whereNotNull('vehicles.origin_lat')
      .whereNotNull('vehicles.origin_lng');

    if (minCapacityTons) {
      sqlQuery = sqlQuery.where('vehicles.capacity_tons', '>=', minCapacityTons);
    }

    if (vehicleType) {
      sqlQuery = sqlQuery.where('vehicles.vehicle_type', vehicleType);
    }

    const vehicles = await sqlQuery;
    
    const filtered = vehicles.filter(vehicle => {
      const distance = this.haversineDistance(
        originLat,
        originLng,
        vehicle.origin_lat,
        vehicle.origin_lng
      );
      return distance <= radiusKm;
    });

    return filtered.map(vehicle => ({
      ...vehicle,
      distance_km: this.haversineDistance(
        originLat,
        originLng,
        vehicle.origin_lat,
        vehicle.origin_lng
      )
    })).sort((a, b) => a.distance_km - b.distance_km);
  }

  static async findDriversWithinRadius(query: NearbyDriverQuery) {
    const { originLat, originLng, radiusKm, minRating, vehicleType, capacityTons } = query;

    const hasRatingsTable = await db.schema.hasTable('ratings');
    const hasLastLat = await db.schema.hasColumn('users', 'last_lat');
    const hasLastLng = await db.schema.hasColumn('users', 'last_lng');

    let sqlQuery = db('users')
      .select(
        'users.id',
        'users.full_name',
        'users.phone_number',
        'users.email',
        'users.kyc_status',
        'users.is_verified',
        'users.status'
      )
      .where('users.role', 'DRIVER')
      .where('users.is_verified', true)
      .where('users.status', 'ACTIVE')
      .where('users.kyc_status', 'APPROVED');

    if (hasLastLat && hasLastLng) {
      sqlQuery = sqlQuery
        .whereNotNull('last_lat')
        .whereNotNull('last_lng');
    } else {
      const hasLocation = await db.schema.hasColumn('users', 'last_known_location');
      if (hasLocation) {
        sqlQuery = sqlQuery.whereNotNull('last_known_location');
      } else {
        return [];
      }
    }

    // Always include average_rating and total_ratings with defaults
    if (hasRatingsTable) {
      sqlQuery = sqlQuery
        .select(
          db.raw('COALESCE(AVG(ratings.rating), 0) as average_rating'),
          db.raw('COUNT(ratings.id) as total_ratings')
        )
        .leftJoin('ratings', function() {
          this.on('users.id', '=', 'ratings.reviewee_id')
            .andOnVal('ratings.target_type', 'DRIVER');
        })
        .groupBy('users.id');
    } else {
      sqlQuery = sqlQuery
        .select(
          db.raw('0 as average_rating'),
          db.raw('0 as total_ratings')
        );
    }

    if (vehicleType || capacityTons) {
      sqlQuery = sqlQuery
        .join('vehicles', 'users.id', 'vehicles.driver_id')
        .where('vehicles.is_active', true)
        .where('vehicles.verification_status', 'VERIFIED');
      
      if (vehicleType) {
        sqlQuery = sqlQuery.where('vehicles.vehicle_type', vehicleType);
      }
      
      if (capacityTons) {
        sqlQuery = sqlQuery.where('vehicles.capacity_tons', '>=', capacityTons);
      }
    }

    const drivers = await sqlQuery;

    // Calculate distance for each driver
    const filtered = drivers.filter((driver: any) => {
      let distance = 0;
      if (hasLastLat && hasLastLng && driver.last_lat !== null && driver.last_lng !== null) {
        distance = this.haversineDistance(
          originLat,
          originLng,
          parseFloat(driver.last_lat),
          parseFloat(driver.last_lng)
        );
      }
      return distance <= radiusKm && (!minRating || (parseFloat(driver.average_rating) || 0) >= minRating);
    });

    return filtered.map((driver: any) => {
      let distance = 0;
      if (hasLastLat && hasLastLng && driver.last_lat !== null && driver.last_lng !== null) {
        distance = this.haversineDistance(
          originLat,
          originLng,
          parseFloat(driver.last_lat),
          parseFloat(driver.last_lng)
        );
      }
      return {
        ...driver,
        average_rating: parseFloat(driver.average_rating) || 0,
        total_ratings: parseInt(driver.total_ratings) || 0,
        distance_km: distance
      };
    }).sort((a, b) => a.distance_km - b.distance_km);
  }

  static async calculateDistanceKm(
    pointA: LocationPoint,
    pointB: LocationPoint
  ): Promise<number> {
    return this.haversineDistance(
      pointA.latitude,
      pointA.longitude,
      pointB.latitude,
      pointB.longitude
    );
  }

  static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
