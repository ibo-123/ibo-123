import db from '../config/db';

export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  updatedAt: Date;
}

export interface TelemetryPoint {
  id?: string;
  shipmentId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  altitude?: number | null;
  recordedAt: Date;
}

export class DriverLocationService {
  /**
   * Record real-time telemetry update broadcasted by active driver during transit.
   * Updates last known position on user record and stores breadcrumb in history.
   */
  static async recordTelemetry(
    driverId: string,
    shipmentId: string,
    latitude: number,
    longitude: number,
    speed: number = 0,
    heading: number = 0,
    altitude: number = 0
  ): Promise<TelemetryPoint> {
    const recordedAt = new Date();

    // 1. Update driver's last known location
    await this.updateLocation(driverId, latitude, longitude, speed, heading);

    // 2. Persist location breadcrumb point for active shipment
    const hasBreadcrumbsTable = await db.schema.hasTable('location_breadcrumbs');

    if (hasBreadcrumbsTable) {
      const [crumb] = await db('location_breadcrumbs')
        .insert({
          shipment_id: shipmentId,
          driver_id: driverId,
          latitude: parseFloat(String(latitude)),
          longitude: parseFloat(String(longitude)),
          speed: parseFloat(String(speed)),
          recorded_at: recordedAt,
        })
        .returning('*');

      return {
        id: crumb?.id,
        shipmentId,
        driverId,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        recordedAt: crumb?.recorded_at || recordedAt,
      };
    }

    return {
      shipmentId,
      driverId,
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      recordedAt,
    };
  }

  /**
   * Update a driver's last known location
   */
  static async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    speed?: number,
    heading?: number
  ): Promise<DriverLocation | null> {
    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');

    if (!hasLocation) {
      await db('users')
        .where('id', driverId)
        .where('role', 'DRIVER')
        .update({
          last_lat: latitude,
          last_lng: longitude,
          updated_at: db.fn.now(),
        });

      return {
        driverId,
        latitude,
        longitude,
        speed,
        heading,
        updatedAt: new Date(),
      };
    }

    // PostGIS update
    await db.raw(
      `UPDATE users 
       SET last_known_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
           updated_at = NOW()
       WHERE id = ? AND role = 'DRIVER'`,
      [longitude, latitude, driverId]
    );

    return {
      driverId,
      latitude,
      longitude,
      speed,
      heading,
      updatedAt: new Date(),
    };
  }

  /**
   * Get a driver's last known location
   */
  static async getLocation(driverId: string): Promise<DriverLocation | null> {
    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');

    if (!hasLocation) {
      const result = await db('users')
        .select('last_lat as latitude', 'last_lng as longitude', 'updated_at as updatedAt')
        .where('id', driverId)
        .where('role', 'DRIVER')
        .first();

      if (!result || result.latitude === null || result.longitude === null) {
        return null;
      }

      return {
        driverId,
        latitude: parseFloat(result.latitude),
        longitude: parseFloat(result.longitude),
        updatedAt: result.updatedAt,
      };
    }

    const result = await db.raw(
      `SELECT 
        ST_Y(last_known_location::geometry) as latitude,
        ST_X(last_known_location::geometry) as longitude,
        updated_at as "updatedAt"
       FROM users 
       WHERE id = ? AND role = 'DRIVER'`,
      [driverId]
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    if (row.latitude === null || row.longitude === null) {
      return null;
    }

    return {
      driverId,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Get historical telemetry breadcrumbs trail for a shipment
   */
  static async getDriverTrail(shipmentId: string, limit: number = 100): Promise<TelemetryPoint[]> {
    const hasBreadcrumbsTable = await db.schema.hasTable('location_breadcrumbs');
    if (!hasBreadcrumbsTable) {
      return [];
    }

    const rows = await db('location_breadcrumbs')
      .where({ shipment_id: shipmentId })
      .orderBy('recorded_at', 'asc')
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      shipmentId: r.shipment_id,
      driverId: r.driver_id,
      latitude: parseFloat(r.latitude),
      longitude: parseFloat(r.longitude),
      speed: r.speed ? parseFloat(r.speed) : 0,
      recordedAt: r.recorded_at,
    }));
  }

  /**
   * Find drivers within a radius (using PostGIS)
   */
  static async findDriversWithinRadius(
    latitude: number,
    longitude: number,
    radiusKm: number
  ): Promise<Array<{ driverId: string; distance: number }>> {
    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');
    const radiusMeters = radiusKm * 1000;

    if (!hasLocation) {
      return [];
    }

    const result = await db.raw(
      `SELECT 
        id as "driverId",
        ROUND((ST_Distance(last_known_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) / 1000)::numeric, 2) as distance
       FROM users
       WHERE role = 'DRIVER'
         AND is_verified = true
         AND status = 'ACTIVE'
         AND last_known_location IS NOT NULL
         AND ST_DWithin(last_known_location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
       ORDER BY distance ASC
       LIMIT 100`,
      [longitude, latitude, longitude, latitude, radiusMeters]
    );

    return result.rows || [];
  }

  /**
   * Utility method to calculate distance in KM and ETA between two lat/lng coordinates
   */
  static calculateDistanceAndETA(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    currentSpeedKmh: number = 60
  ): { distanceKm: number; etaMinutes: number } {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c * 10) / 10;
    const speed = currentSpeedKmh > 5 ? currentSpeedKmh : 60; // default to 60km/h if static
    const etaMinutes = Math.round((distanceKm / speed) * 60);

    return { distanceKm, etaMinutes };
  }
}