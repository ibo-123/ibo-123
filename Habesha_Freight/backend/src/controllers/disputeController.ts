import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Open a dispute for a shipment (POST /api/disputes)
 */
export async function createDispute(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { shipment_id, category, reason } = req.body;

    if (!shipment_id || !category || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Shipment ID, category (DAMAGE, DELAY, PAYMENT, OTHER), and reason are required.',
      });
    }

    const shipment = await db('shipments').where({ id: shipment_id }).first();
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const [dispute] = await db('disputes')
      .insert({
        shipment_id,
        raised_by_id: userId,
        category,
        reason,
        status: 'OPEN',
      })
      .returning('*');

    // Freeze shipment and escrow
    await db('shipments').where({ id: shipment_id }).update({
      status: 'DISPUTED',
      updated_at: db.fn.now(),
    });

    await db('escrow_ledger').where({ shipment_id }).update({
      status: 'DISPUTED',
      updated_at: db.fn.now(),
    });

    return res.status(201).json({
      success: true,
      message: 'Dispute opened successfully. Shipment and escrow funds have been frozen for review.',
      data: dispute,
    });
  } catch (error) {
    console.error('Create Dispute Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error creating dispute.',
    });
  }
}

/**
 * List disputes (GET /api/disputes)
 */
export async function listDisputes(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    let query = db('disputes')
      .join('shipments', 'disputes.shipment_id', 'shipments.id')
      .join('users as raised_by', 'disputes.raised_by_id', 'raised_by.id')
      .select(
        'disputes.*',
        'shipments.status as shipment_status',
        'raised_by.full_name as raised_by_name',
        'raised_by.role as raised_by_role'
      );

    if (role !== 'ADMIN') {
      query = query.where('disputes.raised_by_id', userId);
    }

    const disputes = await query.orderBy('disputes.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes,
    });
  } catch (error) {
    console.error('List Disputes Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error listing disputes.',
    });
  }
}

/**
 * Resolve dispute (POST /api/disputes/:id/resolve) - Admin only
 */
export async function resolveDispute(req: AuthenticatedRequest, res: Response) {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { resolution_notes, action } = req.body; // action: 'REFUND_SHIPPER' | 'RELEASE_CARRIER'

    if (!resolution_notes || !['REFUND_SHIPPER', 'RELEASE_CARRIER'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes and valid action (REFUND_SHIPPER or RELEASE_CARRIER) are required.',
      });
    }

    const dispute = await db('disputes').where({ id }).first();
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found.' });
    }

    const [resolvedDispute] = await db('disputes')
      .where({ id })
      .update({
        status: 'RESOLVED',
        resolution_notes,
        resolved_by_id: adminId,
        updated_at: db.fn.now(),
      })
      .returning('*');

    // Handle Escrow action
    const newEscrowStatus = action === 'REFUND_SHIPPER' ? 'REFUNDED' : 'RELEASED';

    await db('escrow_ledger').where({ shipment_id: dispute.shipment_id }).update({
      status: newEscrowStatus,
      updated_at: db.fn.now(),
    });

    return res.status(200).json({
      success: true,
      message: `Dispute resolved with decision: ${action}. Escrow status updated to ${newEscrowStatus}.`,
      data: resolvedDispute,
    });
  } catch (error) {
    console.error('Resolve Dispute Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error resolving dispute.',
    });
  }
}
