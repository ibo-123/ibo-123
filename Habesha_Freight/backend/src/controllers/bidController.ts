import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { generateOtpAndHash } from '../utils/crypto';

export async function placeBid(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { load_id, vehicle_id, bid_amount_etb } = req.body;

    if (!load_id || !bid_amount_etb) {
      return res.status(400).json({
        success: false,
        message: 'Load ID and bid amount (ETB) are required.',
      });
    }

    const load = await db('loads').where({ id: load_id }).first();
    if (!load) {
      return res.status(404).json({
        success: false,
        message: 'Load not found.',
      });
    }

    if (load.status !== 'POSTED') {
      return res.status(400).json({
        success: false,
        message: 'Bids can only be placed on loads with status POSTED.',
      });
    }

    // Capacity check
    if (vehicle_id) {
      const vehicle = await db('vehicles').where({ id: vehicle_id }).first();
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found.',
        });
      }

      if (Number(vehicle.capacity_tons) < Number(load.weight_tons)) {
        return res.status(400).json({
          success: false,
          error: 'VEHICLE_OVER_CAPACITY',
          message: `Vehicle capacity (${vehicle.capacity_tons} tons) is insufficient for load weight (${load.weight_tons} tons).`,
        });
      }
    }

    const [newBid] = await db('bids')
      .insert({
        load_id,
        driver_id: driverId,
        vehicle_id: vehicle_id || null,
        bid_amount_etb,
        status: 'PENDING',
      })
      .returning('*');

    return res.status(201).json({
      success: true,
      message: 'Bid submitted successfully.',
      data: newBid,
    });
  } catch (error) {
    console.error('Place Bid Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error placing bid.',
    });
  }
}

export async function updateBidStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either ACCEPTED or REJECTED.',
      });
    }

    const bid = await db('bids').where({ id }).first();
    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found.' });
    }

    const load = await db('loads').where({ id: bid.load_id }).first();
    if (!load) {
      return res.status(404).json({ success: false, message: 'Associated load not found.' });
    }

    if (role === 'SHIPPER' && load.shipper_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only respond to bids on your own loads.',
      });
    }

    const [updatedBid] = await db('bids')
      .where({ id })
      .update({ status, updated_at: db.fn.now() })
      .returning('*');

    let createdShipment = null;
    let pickupOtp = null;
    let deliveryOtp = null;

    if (status === 'ACCEPTED') {
      await db('loads').where({ id: bid.load_id }).update({
        status: 'MATCHED',
        updated_at: db.fn.now(),
      });

      await db('bids')
        .where({ load_id: bid.load_id })
        .whereNot({ id })
        .update({ status: 'REJECTED', updated_at: db.fn.now() });

      const pickupData = generateOtpAndHash();
      const deliveryData = generateOtpAndHash();
      pickupOtp = pickupData.otp;
      deliveryOtp = deliveryData.otp;

      const [shipment] = await db('shipments')
        .insert({
          load_id: load.id,
          carrier_id: bid.driver_id,
          vehicle_id: bid.vehicle_id || null,
          status: 'ASSIGNED',
          pickup_otp_hash: pickupData.hash,
          delivery_otp_hash: deliveryData.hash,
        })
        .returning('*');

      createdShipment = shipment;

      const gross = Number(bid.bid_amount_etb);
      const commission = gross * 0.05;
      const net = gross - commission;

      await db('escrow_ledger').insert({
        shipment_id: shipment.id,
        payer_id: load.shipper_id,
        beneficiary_id: bid.driver_id,
        gross_amount_etb: gross,
        commission_amount_etb: commission,
        net_payout_amount_etb: net,
        idempotency_key: `ESCROW-${shipment.id}`,
        status: 'PENDING',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Bid status updated to ${status}.`,
      data: {
        bid: updatedBid,
        shipment: createdShipment,
        otps: status === 'ACCEPTED' ? { pickupOtp, deliveryOtp } : undefined,
      },
    });
  } catch (error) {
    console.error('Update Bid Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error updating bid status.',
    });
  }
}
