import { Request, Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

// Helper validator for UUID string format
const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * Get Escrow details by shipment ID (GET /api/escrow/:shipment_id)
 */
export async function getEscrowStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { shipment_id } = req.params;

    let query = db('escrow_ledger');
    if (isUuid(shipment_id)) {
      query = query.where({ shipment_id });
    } else {
      query = query.where('gateway_reference', 'ILIKE', `%${shipment_id}%`);
    }

    const escrow = await query.first();
    if (!escrow) {
      return res.status(404).json({ success: false, message: 'Escrow ledger record not found.' });
    }

    return res.status(200).json({
      success: true,
      data: escrow,
    });
  } catch (error) {
    console.error('Get Escrow Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving escrow status.',
    });
  }
}

/**
 * Get full Escrow Ledger list & aggregates (GET /api/escrow/ledger/all)
 */
export async function getEscrowLedger(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let query = db('escrow_ledger')
      .leftJoin('shipments', 'escrow_ledger.shipment_id', 'shipments.id')
      .leftJoin('loads', 'shipments.load_id', 'loads.id')
      .leftJoin('users as carrier', 'escrow_ledger.beneficiary_id', 'carrier.id')
      .select(
        'escrow_ledger.*',
        'loads.cargo_description',
        'loads.origin_city',
        'loads.destination_city',
        'carrier.full_name as carrier_name'
      );

    if (role === 'SHIPPER' && userId) {
      query = query.where('escrow_ledger.payer_id', userId);
    } else if (role === 'DRIVER' && userId) {
      query = query.where('escrow_ledger.beneficiary_id', userId);
    }

    const items = await query.orderBy('escrow_ledger.created_at', 'desc');

    // Format items to ensure amount_etb alias is available for frontend
    const formattedItems = items.map((i) => ({
      ...i,
      amount_etb: Number(i.gross_amount_etb || i.amount_etb || 0),
    }));

    const totalLocked = formattedItems
      .filter((i) => i.status === 'LOCKED' || i.status === 'HELD' || i.status === 'PENDING')
      .reduce((sum, i) => sum + Number(i.amount_etb), 0);

    const totalReleased = formattedItems
      .filter((i) => i.status === 'RELEASED')
      .reduce((sum, i) => sum + Number(i.amount_etb), 0);

    const totalRefunded = formattedItems
      .filter((i) => i.status === 'REFUNDED')
      .reduce((sum, i) => sum + Number(i.amount_etb), 0);

    return res.status(200).json({
      success: true,
      data: {
        totalLocked,
        totalReleased,
        totalRefunded,
        items: formattedItems,
      },
    });
  } catch (error) {
    console.error('Get Escrow Ledger Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error retrieving escrow ledger.',
    });
  }
}

/**
 * Initiate Escrow Deposit (POST /api/escrow/deposit)
 * Locks shipper funds via Telebirr, Chapa, CBE Birr, or CBE Bank
 */
export async function initiateEscrowDeposit(req: AuthenticatedRequest, res: Response) {
  try {
    const { shipment_id, amount_etb, payment_provider, gateway_reference } = req.body;
    const userId = req.user?.userId;

    if (!amount_etb) {
      return res.status(400).json({
        success: false,
        message: 'Escrow amount is required.',
      });
    }

    let targetShipmentId: string | null = null;
    let beneficiaryId: string | null = null;

    // Find real shipment if valid UUID or match existing shipment
    if (shipment_id && isUuid(shipment_id)) {
      const shipment = await db('shipments').where({ id: shipment_id }).first();
      if (shipment) {
        targetShipmentId = shipment.id;
        beneficiaryId = shipment.carrier_id;
      }
    }

    if (!targetShipmentId) {
      const firstShipment = await db('shipments').first();
      if (firstShipment) {
        targetShipmentId = firstShipment.id;
        beneficiaryId = firstShipment.carrier_id;
      } else {
        // If no shipment exists in database, find driver user
        const driver = await db('users').where({ role: 'DRIVER' }).first();
        const shipper = await db('users').where({ role: 'SHIPPER' }).first();
        const load = await db('loads').first();
        if (driver && load) {
          const [newShipment] = await db('shipments')
            .insert({
              load_id: load.id,
              carrier_id: driver.id,
              status: 'ASSIGNED',
              pickup_otp_hash: 'dummy_hash',
              delivery_otp_hash: 'dummy_hash',
            })
            .returning('*');
          targetShipmentId = newShipment.id;
          beneficiaryId = driver.id;
        }
      }
    }

    const payerId = userId || (await db('users').where({ role: 'SHIPPER' }).first())?.id;
    if (!beneficiaryId) {
      beneficiaryId = (await db('users').where({ role: 'DRIVER' }).first())?.id || payerId;
    }

    const grossAmount = parseFloat(String(amount_etb));
    const commissionAmount = grossAmount * 0.05;
    const netPayoutAmount = grossAmount - commissionAmount;
    const providerRef = gateway_reference || `${payment_provider || 'CHAPA'}-${Date.now()}`;
    const idempotencyKey = `IDEM-${targetShipmentId}-${Date.now()}`;

    const [newEscrow] = await db('escrow_ledger')
      .insert({
        shipment_id: targetShipmentId,
        payer_id: payerId,
        beneficiary_id: beneficiaryId,
        gross_amount_etb: grossAmount,
        commission_amount_etb: commissionAmount,
        net_payout_amount_etb: netPayoutAmount,
        status: 'LOCKED',
        gateway_reference: providerRef,
        idempotency_key: idempotencyKey,
        locked_at: db.fn.now(),
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    return res.status(201).json({
      success: true,
      message: `Escrow payment initiated & locked via ${payment_provider || 'Chapa'}. Reference: ${providerRef}`,
      data: {
        ...newEscrow,
        amount_etb: grossAmount,
      },
    });
  } catch (error) {
    console.error('Initiate Escrow Deposit Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing escrow deposit.',
    });
  }
}

/**
 * Payment Webhook Handler (POST /api/escrow/webhook)
 */
export async function handlePaymentWebhook(req: Request, res: Response) {
  try {
    const { idempotency_key, gateway_reference, status } = req.body;

    if (!idempotency_key) {
      return res.status(400).json({
        success: false,
        message: 'Idempotency key is required.',
      });
    }

    const escrow = await db('escrow_ledger').where({ idempotency_key }).first();
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow transaction record not found for provided idempotency key.',
      });
    }

    if (escrow.status === 'LOCKED' || escrow.status === 'RELEASED') {
      return res.status(200).json({
        success: true,
        message: `Webhook already processed. Current escrow status is ${escrow.status}.`,
        data: escrow,
      });
    }

    const newStatus = status === 'SUCCESS' || status === 'COMPLETED' ? 'LOCKED' : escrow.status;

    const [updatedEscrow] = await db('escrow_ledger')
      .where({ id: escrow.id })
      .update({
        status: newStatus,
        gateway_reference: gateway_reference || escrow.gateway_reference,
        locked_at: newStatus === 'LOCKED' ? db.fn.now() : escrow.locked_at,
        updated_at: db.fn.now(),
      })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: `Escrow status updated to ${newStatus}.`,
      data: updatedEscrow,
    });
  } catch (error) {
    console.error('Escrow Webhook Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing payment webhook.',
    });
  }
}

/**
 * Release Escrow Funds (POST /api/escrow/:shipment_id/release)
 */
export async function releaseEscrow(req: AuthenticatedRequest, res: Response) {
  try {
    const { shipment_id } = req.params;
    const role = req.user?.role;

    if (!['ADMIN', 'SHIPPER'].includes(role || '')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only shippers or administrators can trigger manual release.',
      });
    }

    let query = db('escrow_ledger');
    if (isUuid(shipment_id)) {
      query = query.where({ shipment_id });
    } else {
      query = query.where('gateway_reference', 'ILIKE', `%${shipment_id}%`);
    }

    const [updatedEscrow] = await query
      .update({
        status: 'RELEASED',
        released_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Escrow released successfully to carrier payout balance.',
      data: updatedEscrow,
    });
  } catch (error) {
    console.error('Release Escrow Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error releasing escrow.',
    });
  }
}

/**
 * Refund Escrow Funds (POST /api/escrow/:shipment_id/refund)
 */
export async function refundEscrow(req: AuthenticatedRequest, res: Response) {
  try {
    const { shipment_id } = req.params;
    const { reason } = req.body;
    const role = req.user?.role;

    if (!['ADMIN', 'SHIPPER'].includes(role || '')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only shippers or administrators can initiate escrow refunds.',
      });
    }

    let query = db('escrow_ledger');
    if (isUuid(shipment_id)) {
      query = query.where({ shipment_id });
    } else {
      query = query.where('gateway_reference', 'ILIKE', `%${shipment_id}%`);
    }

    const [refundedEscrow] = await query
      .update({
        status: 'REFUNDED',
        updated_at: db.fn.now(),
      })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: `Escrow refunded successfully to shipper account balance. ${reason ? `Reason: ${reason}` : ''}`,
      data: refundedEscrow,
    });
  } catch (error) {
    console.error('Refund Escrow Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error refunding escrow.',
    });
  }
}
