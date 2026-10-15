import { Response } from 'express';
import crypto from 'crypto';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * List shipments for the authenticated user (GET /api/shipments)
 */
export async function listShipments(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let query = db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .join('users as carrier', 'shipments.carrier_id', 'carrier.id')
      .join('users as shipper', 'loads.shipper_id', 'shipper.id')
      .select(
        'shipments.*',
        'loads.cargo_description',
        'loads.weight_tons',
        'loads.origin_city',
        'loads.destination_city',
        'loads.origin_lat',
        'loads.origin_lng',
        'loads.destination_lat',
        'loads.destination_lng',
        'loads.offered_price_etb',
        'shipper.full_name as shipper_name',
        'carrier.full_name as carrier_name'
      );

    if (role === 'SHIPPER') {
      query = query.where('loads.shipper_id', userId);
    } else if (role === 'DRIVER' || role === 'FLEET_OWNER') {
      query = query.where('shipments.carrier_id', userId);
    }

    const shipments = await query.orderBy('shipments.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    console.error('List Shipments Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error listing shipments.',
    });
  }
}

/**
 * Get detailed shipment info by ID (GET /api/shipments/:id)
 */
export async function getShipmentDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const shipment = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .join('users as carrier', 'shipments.carrier_id', 'carrier.id')
      .join('users as shipper', 'loads.shipper_id', 'shipper.id')
      .select(
        'shipments.*',
        'loads.cargo_description',
        'loads.weight_tons',
        'loads.origin_city',
        'loads.destination_city',
        'loads.origin_lat',
        'loads.origin_lng',
        'loads.destination_lat',
        'loads.destination_lng',
        'loads.offered_price_etb',
        'shipper.full_name as shipper_name',
        'shipper.phone_number as shipper_phone',
        'carrier.full_name as carrier_name',
        'carrier.phone_number as carrier_phone'
      )
      .where('shipments.id', id)
      .first();

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const escrow = await db('escrow_ledger').where({ shipment_id: id }).first();

    return res.status(200).json({
      success: true,
      data: {
        ...shipment,
        escrow,
      },
    });
  } catch (error) {
    console.error('Get Shipment Details Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving shipment details.',
    });
  }
}

/**
 * Verify Pickup OTP and Dispatch Shipment (POST /api/shipments/:id/pickup-verify)
 */
export async function verifyPickupOtp(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { pickup_otp } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!pickup_otp) {
      return res.status(400).json({
        success: false,
        message: 'Pickup OTP is required.',
      });
    }

    const shipment = await db('shipments').where({ id }).first();
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    // Permission check: Driver assigned to shipment or Admin
    if (role === 'DRIVER' && shipment.carrier_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not the assigned driver for this shipment.',
      });
    }

    if (!['ASSIGNED', 'DISPATCHED'].includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot verify pickup. Current shipment status is ${shipment.status}.`,
      });
    }

    // Hash provided OTP and verify against stored hash
    const inputHash = crypto.createHash('sha256').update(String(pickup_otp)).digest('hex');
    if (inputHash !== shipment.pickup_otp_hash) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid pickup OTP code.',
      });
    }

    // Update shipment status to IN_TRANSIT
    const [updatedShipment] = await db('shipments')
      .where({ id })
      .update({
        status: 'IN_TRANSIT',
        pickup_verified_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    await db('loads').where({ id: shipment.load_id }).update({
      status: 'IN_TRANSIT',
      updated_at: db.fn.now(),
    });

    return res.status(200).json({
      success: true,
      message: 'Pickup OTP verified successfully. Shipment is now IN TRANSIT.',
      data: updatedShipment,
    });
  } catch (error) {
    console.error('Verify Pickup OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying pickup OTP.',
    });
  }
}

/**
 * Verify Delivery OTP and Release Escrow (POST /api/shipments/:id/delivery-verify)
 */
export async function verifyDeliveryOtp(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { delivery_otp } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!delivery_otp) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP is required.',
      });
    }

    const shipment = await db('shipments').where({ id }).first();
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    if (role === 'DRIVER' && shipment.carrier_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not the assigned driver for this shipment.',
      });
    }

    if (shipment.status !== 'IN_TRANSIT') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify delivery. Current shipment status is ${shipment.status}.`,
      });
    }

    const inputHash = crypto.createHash('sha256').update(String(delivery_otp)).digest('hex');
    if (inputHash !== shipment.delivery_otp_hash) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OTP',
        message: 'Invalid delivery OTP code.',
      });
    }

    // Update shipment status to DELIVERED
    const [updatedShipment] = await db('shipments')
      .where({ id })
      .update({
        status: 'DELIVERED',
        delivery_verified_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    await db('loads').where({ id: shipment.load_id }).update({
      status: 'DELIVERED',
      updated_at: db.fn.now(),
    });

    // Release Escrow Ledger
    await db('escrow_ledger')
      .where({ shipment_id: id })
      .update({
        status: 'RELEASED',
        released_at: db.fn.now(),
        updated_at: db.fn.now(),
      });

    return res.status(200).json({
      success: true,
      message: 'Delivery verified successfully! Shipment completed and escrow funds released to driver payout balance.',
      data: updatedShipment,
    });
  } catch (error) {
    console.error('Verify Delivery OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying delivery OTP.',
    });
  }
}
