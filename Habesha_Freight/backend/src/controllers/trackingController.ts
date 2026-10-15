import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { DriverLocationService } from '../services/driverLocationService';

/**
 * Record a location update point from driver (POST /api/tracking/location)
 */
export async function recordLocationPoint(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { shipment_id, latitude, longitude, speed } = req.body;

    if (!shipment_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Shipment ID, latitude, and longitude are required.',
      });
    }

    const shipment = await db('shipments').where({ id: shipment_id }).first();
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    if (shipment.carrier_id !== driverId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not assigned to this active shipment.',
      });
    }

    if (!['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT'].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: `Location updates can only be recorded for active shipments. Current status is ${shipment.status}.`,
      });
    }

    const locationPoint = await DriverLocationService.recordTelemetry(
      driverId!,
      shipment_id,
      parseFloat(String(latitude)),
      parseFloat(String(longitude)),
      speed !== undefined ? parseFloat(String(speed)) : 0
    );

    return res.status(201).json({
      success: true,
      message: 'Location point recorded successfully.',
      data: locationPoint,
    });
  } catch (error) {
    console.error('Record Location Point Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error recording location point.',
    });
  }
}

/**
 * Get tracking breadcrumbs for a shipment (GET /api/tracking/:shipment_id)
 */
export async function getShipmentTracking(req: AuthenticatedRequest, res: Response) {
  try {
    const { shipment_id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const shipment = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .join('users as carrier', 'shipments.carrier_id', 'carrier.id')
      .select(
        'shipments.*',
        'loads.origin_city',
        'loads.destination_city',
        'loads.origin_lat',
        'loads.origin_lng',
        'loads.destination_lat',
        'loads.destination_lng',
        'loads.cargo_description',
        'loads.shipper_id',
        'carrier.full_name as carrier_name'
      )
      .where('shipments.id', shipment_id)
      .first();

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const isParticipant =
      role === 'ADMIN' ||
      shipment.carrier_id === userId ||
      shipment.shipper_id === userId;

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to view this shipment tracking.',
      });
    }

    const breadcrumbRows = await db('location_breadcrumbs')
      .where({ shipment_id })
      .orderBy('recorded_at', 'asc');

    const breadcrumbs = breadcrumbRows.map((b) => ({
      id: b.id,
      lat: Number(b.latitude),
      lng: Number(b.longitude),
      speed: b.speed != null ? Number(b.speed) : null,
      recorded_at: b.recorded_at,
    }));

    const latestPoint = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1] : null;

    return res.status(200).json({
      success: true,
      data: {
        shipment_id,
        status: shipment.status,
        carrier_name: shipment.carrier_name,
        origin: {
          lat: Number(shipment.origin_lat),
          lng: Number(shipment.origin_lng),
          label: shipment.origin_city,
        },
        destination: {
          lat: Number(shipment.destination_lat),
          lng: Number(shipment.destination_lng),
          label: shipment.destination_city,
        },
        cargo_description: shipment.cargo_description,
        latestPoint,
        breadcrumbs,
      },
    });
  } catch (error) {
    console.error('Get Shipment Tracking Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving shipment tracking.',
    });
  }
}
