import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Submit a rating and review for a completed shipment (POST /api/reviews)
 */
export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    const reviewerId = req.user?.userId;
    const { shipment_id, reviewee_id, rating, comment } = req.body;

    if (!shipment_id || !reviewee_id || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Shipment ID, reviewee ID, and rating (1-5) are required.',
      });
    }

    const numericRating = parseInt(String(rating), 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const shipment = await db('shipments').where({ id: shipment_id }).first();
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    // Business rule: Review CAN ONLY be created for completed, DELIVERED shipments
    if (shipment.status !== 'DELIVERED') {
      return res.status(400).json({
        success: false,
        error: 'SHIPMENT_NOT_DELIVERED',
        message: `Reviews can only be submitted after shipment delivery is verified. Current status is ${shipment.status}.`,
      });
    }

    const [review] = await db('reviews')
      .insert({
        shipment_id,
        reviewer_id: reviewerId,
        reviewee_id,
        rating: numericRating,
        comment: comment || null,
      })
      .returning('*');

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: review,
    });
  } catch (error) {
    console.error('Create Review Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error creating review.',
    });
  }
}

/**
 * List reviews for a user or shipment (GET /api/reviews)
 */
export async function listReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const { user_id, reviewer_id, shipment_id } = req.query;

    let query = db('reviews')
      .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .join('users as reviewee', 'reviews.reviewee_id', 'reviewee.id')
      .select(
        'reviews.*',
        'reviewer.full_name as reviewer_name',
        'reviewee.full_name as reviewee_name',
        'reviewee.role as reviewee_role'
      );

    if (user_id) {
      query = query.where('reviews.reviewee_id', String(user_id));
    }
    if (reviewer_id) {
      query = query.where('reviews.reviewer_id', String(reviewer_id));
    }
    if (shipment_id) {
      query = query.where('reviews.shipment_id', String(shipment_id));
    }

    const reviews = await query.orderBy('reviews.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error('List Reviews Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error listing reviews.',
    });
  }
}
