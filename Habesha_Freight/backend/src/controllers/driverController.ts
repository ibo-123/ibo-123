import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { SpatialService } from '../services/spatialService';

export async function searchNearbyDrivers(req: AuthenticatedRequest, res: Response) {
  try {
    const { lat, lng, radius_km, min_rating, vehicle_type, capacity_tons } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Origin latitude (lat) and longitude (lng) parameters are required.',
      });
    }

    const originLat = parseFloat(String(lat));
    const originLng = parseFloat(String(lng));
    const radiusKm = radius_km ? parseFloat(String(radius_km)) : 50;
    const minRating = min_rating ? parseFloat(String(min_rating)) : undefined;
    const vehicleType = vehicle_type ? String(vehicle_type) : undefined;
    const capacityTons = capacity_tons ? parseFloat(String(capacity_tons)) : undefined;

    if (isNaN(originLat) || isNaN(originLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate numeric values.',
      });
    }

    if (minRating && (minRating < 0 || minRating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Minimum rating must be between 0 and 5.',
      });
    }

    if (vehicleType) {
      const validTypes = ['ISUZU_DRY', 'SINO_TRUCK', 'TRAILER', 'VAN'];
      if (!validTypes.includes(vehicleType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid vehicle type. Must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    const nearbyDrivers = await SpatialService.findDriversWithinRadius({
      originLat,
      originLng,
      radiusKm,
      minRating,
      vehicleType,
      capacityTons,
    });

    return res.status(200).json({
      success: true,
      count: nearbyDrivers.length,
      radiusKm,
      data: nearbyDrivers,
    });
  } catch (error) {
    console.error('Search Nearby Drivers Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error searching nearby drivers.',
    });
  }
}

export async function getDriverDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid driver ID format.',
      });
    }

    const hasRatingsTable = await db.schema.hasTable('ratings');
    const hasRevieweeId = hasRatingsTable && await db.schema.hasColumn('ratings', 'reviewee_id');

    let query = db('users')
      .select(
        'users.id',
        'users.full_name',
        'users.phone_number',
        'users.email',
        'users.kyc_status',
        'users.is_verified',
        'users.status',
        'users.created_at'
      )
      .where('users.id', id)
      .where('users.role', 'DRIVER');

    if (hasRevieweeId) {
      query = query
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
      query = query
        .select(
          db.raw('0 as average_rating'),
          db.raw('0 as total_ratings')
        );
    }

    const driver = await query.first();

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found.',
      });
    }

    const vehicles = await db('vehicles')
      .select(
        'id',
        'plate_number',
        'vehicle_type',
        'capacity_tons',
        'is_active',
        'verification_status'
      )
      .where('driver_id', id)
      .where('is_active', true);

    return res.status(200).json({
      success: true,
      data: {
        ...driver,
        vehicles,
      },
    });
  } catch (error) {
    console.error('Get Driver Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving driver details.',
    });
  }
}

export async function updateDriverLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User ID not found.',
      });
    }

    const { lat, lng, driver_id } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and longitude (lng) are required.',
      });
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate numeric values.',
      });
    }

    // Determine target driver
    let targetDriverId = userId;

    // If admin and driver_id is provided, update that driver
    if (userRole === 'ADMIN' && driver_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(driver_id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid driver ID format.',
        });
      }
      targetDriverId = driver_id;
    } else if (userRole !== 'ADMIN' && userRole !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only drivers and admins can update locations.',
      });
    } else if (userRole === 'DRIVER' && targetDriverId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update your own location.',
      });
    }

    const user = await db('users')
      .where('id', targetDriverId)
      .where('role', 'DRIVER')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found.',
      });
    }

    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');

    if (hasLocation) {
      await db.raw(
        `UPDATE users 
         SET last_known_location = ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
             updated_at = NOW()
         WHERE id = ?`,
        [longitude, latitude, targetDriverId]
      );
    } else {
      await db('users')
        .where('id', targetDriverId)
        .update({
          last_lat: latitude,
          last_lng: longitude,
          updated_at: db.fn.now(),
        });
    }

    return res.status(200).json({
      success: true,
      message: 'Driver location updated successfully.',
      data: {
        driver_id: targetDriverId,
        latitude,
        longitude,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update Driver Location Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating driver location.',
    });
  }
}

export async function getDriverLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User ID not found.',
      });
    }

    // Only drivers and admins can access this endpoint
    if (userRole !== 'ADMIN' && userRole !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only drivers and admins can get locations.',
      });
    }

    // Determine target driver
    let targetDriverId = userId;

    // If admin and driver_id is provided as query param, use it
    // We skip strict UUID validation here - if it's invalid, the database query will return null
    if (userRole === 'ADMIN' && req.query.driver_id) {
      const driverIdParam = String(req.query.driver_id);
      if (driverIdParam && driverIdParam !== 'undefined' && driverIdParam.trim() !== '') {
        targetDriverId = driverIdParam;
      }
      // If driver_id is 'undefined' or empty, use admin's own ID (will return 404 if not a driver)
    }

    // Check if target user is a driver
    const user = await db('users')
      .where('id', targetDriverId)
      .where('role', 'DRIVER')
      .first();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found.',
      });
    }

    const hasLocation = await db.schema.hasColumn('users', 'last_known_location');

    let latitude = null;
    let longitude = null;
    let updatedAt = null;

    if (hasLocation) {
      const result = await db.raw(
        `SELECT 
          ST_Y(last_known_location::geometry) as latitude,
          ST_X(last_known_location::geometry) as longitude,
          updated_at
         FROM users 
         WHERE id = ? AND role = 'DRIVER'`,
        [targetDriverId]
      );
      
      if (result && result.rows && result.rows.length > 0) {
        const location = result.rows[0];
        latitude = location.latitude;
        longitude = location.longitude;
        updatedAt = location.updated_at;
      }
    } else {
      const result = await db('users')
        .select('last_lat as latitude', 'last_lng as longitude', 'updated_at')
        .where('id', targetDriverId)
        .where('role', 'DRIVER')
        .first();
      
      if (result) {
        latitude = result.latitude;
        longitude = result.longitude;
        updatedAt = result.updated_at;
      }
    }

    // If no location found, return 404 with a clear message
    if (latitude === null || longitude === null) {
      return res.status(404).json({
        success: false,
        message: 'Driver location not found. Please update your location first.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        driver_id: targetDriverId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updated_at: updatedAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get Driver Location Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving driver location.',
    });
  }
}
