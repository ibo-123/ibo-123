import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { SpatialService } from '../services/spatialService';

// Helper to parse numeric values from PostgreSQL
function parseNumeric(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? null : parsed;
}

// Helper to normalize vehicle response - convert strings to numbers
function normalizeVehicle(vehicle: any) {
  if (!vehicle) return vehicle;
  return {
    ...vehicle,
    origin_lat: parseNumeric(vehicle.origin_lat),
    origin_lng: parseNumeric(vehicle.origin_lng),
    capacity_tons: parseNumeric(vehicle.capacity_tons),
  };
}

export async function registerVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { plate_number, vehicle_type, capacity_tons, origin_lat, origin_lng } = req.body;

    if (!plate_number || !vehicle_type || !capacity_tons) {
      return res.status(400).json({
        success: false,
        message: 'Plate number, vehicle type, and capacity tons are required.',
      });
    }

    const existing = await db('vehicles').where({ plate_number }).first();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this plate number is already registered.',
      });
    }

    const insertData: any = {
      driver_id: driverId,
      plate_number,
      vehicle_type,
      capacity_tons: parseNumeric(capacity_tons),
      is_active: true,
      verification_status: 'PENDING',
    };

    if (origin_lat !== undefined && origin_lng !== undefined) {
      insertData.origin_lat = parseNumeric(origin_lat);
      insertData.origin_lng = parseNumeric(origin_lng);
    }

    const [newVehicle] = await db('vehicles')
      .insert(insertData)
      .returning(['id', 'driver_id', 'plate_number', 'vehicle_type', 'capacity_tons', 'is_active', 'verification_status', 'created_at', 'origin_lat', 'origin_lng']);

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: normalizeVehicle(newVehicle),
    });
  } catch (error) {
    console.error('Register Vehicle Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error registering vehicle.',
    });
  }
}

export async function listVehicles(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let query = db('vehicles')
      .join('users', 'vehicles.driver_id', 'users.id')
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
        'users.full_name as driver_name',
        'users.phone_number as driver_phone'
      );

    if (role === 'DRIVER') {
      query = query.where('vehicles.driver_id', userId);
    }

    const vehicles = await query.orderBy('vehicles.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles.map(normalizeVehicle),
    });
  } catch (error) {
    console.error('List Vehicles Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error listing vehicles.',
    });
  }
}

export async function searchNearbyVehicles(req: AuthenticatedRequest, res: Response) {
  try {
    const { lat, lng, radius_km, min_capacity, vehicle_type } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Origin latitude (lat) and longitude (lng) parameters are required.',
      });
    }

    const originLat = parseFloat(String(lat));
    const originLng = parseFloat(String(lng));
    const radiusKm = radius_km ? parseFloat(String(radius_km)) : 50;
    const minCapacityTons = min_capacity ? parseFloat(String(min_capacity)) : undefined;
    const vehicleType = vehicle_type ? String(vehicle_type) : undefined;

    if (isNaN(originLat) || isNaN(originLng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate numeric values.',
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

    const nearbyVehicles = await SpatialService.findVehiclesWithinRadius({
      originLat,
      originLng,
      radiusKm,
      minCapacityTons,
      vehicleType,
    });

    return res.status(200).json({
      success: true,
      count: nearbyVehicles.length,
      radiusKm,
      data: nearbyVehicles.map(normalizeVehicle),
    });
  } catch (error) {
    console.error('Search Nearby Vehicles Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error searching nearby vehicles.',
    });
  }
}

export async function getVehicleDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const vehicle = await db('vehicles')
      .join('users', 'vehicles.driver_id', 'users.id')
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
        'vehicles.created_at',
        'users.full_name as driver_name',
        'users.phone_number as driver_phone'
      )
      .where('vehicles.id', id)
      .first();

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: normalizeVehicle(vehicle),
    });
  } catch (error) {
    console.error('Get Vehicle Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving vehicle details.',
    });
  }
}

export async function updateVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;
    const { vehicle_type, capacity_tons, is_active, origin_lat, origin_lng } = req.body;

    const vehicle = await db('vehicles').where({ id }).first();
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (role === 'DRIVER' && vehicle.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update your own vehicles.',
      });
    }

    const updateData: Record<string, any> = {};
    if (vehicle_type) updateData.vehicle_type = vehicle_type;
    if (capacity_tons) updateData.capacity_tons = parseNumeric(capacity_tons);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (origin_lat !== undefined) updateData.origin_lat = parseNumeric(origin_lat);
    if (origin_lng !== undefined) updateData.origin_lng = parseNumeric(origin_lng);

    const [updated] = await db('vehicles')
      .where({ id })
      .update(updateData)
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: normalizeVehicle(updated),
    });
  } catch (error) {
    console.error('Update Vehicle Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating vehicle.',
    });
  }
}

export async function deleteVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const vehicle = await db('vehicles').where({ id }).first();
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    if (role === 'DRIVER' && vehicle.driver_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete your own vehicles.',
      });
    }

    await db('vehicles').where({ id }).del();

    return res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully.',
    });
  } catch (error) {
    console.error('Delete Vehicle Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error deleting vehicle.',
    });
  }
}
