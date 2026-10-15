import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileService } from '../services/fileService';
import { generateOtpAndHash } from '../utils/crypto';

export async function getDriverProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const driver = await db('users')
      .select(
        'id', 'full_name', 'phone_number', 'email', 'profile_photo_url',
        'kyc_status', 'is_verified', 'status', 'license_number', 'license_photo_url',
        'created_at'
      )
      .where('id', userId)
      .first();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver profile not found.' });
    }

    const vehicle = await db('vehicles').where('driver_id', userId).first();
    const totalShipments = await db('shipments').where('carrier_id', userId).count('* as count').first();
    const inTransit = await db('shipments').where('carrier_id', userId).where('status', 'IN_TRANSIT').count('* as count').first();
    const delivered = await db('shipments').where('carrier_id', userId).where('status', 'DELIVERED').count('* as count').first();

    return res.status(200).json({
      success: true,
      data: {
        ...driver,
        vehicle: vehicle || null,
        stats: {
          total_shipments: Number(totalShipments?.count || 0),
          active_shipments: Number(inTransit?.count || 0),
          completed_shipments: Number(delivered?.count || 0),
        },
      },
    });
  } catch (error) {
    console.error('Get Driver Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving driver profile.' });
  }
}

export async function getDriverBids(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;

    const bids = await db('bids')
      .join('loads', 'bids.load_id', 'loads.id')
      .join('users', 'loads.shipper_id', 'users.id')
      .select(
        'bids.*',
        'loads.cargo_description',
        'loads.weight_tons',
        'loads.origin_city',
        'loads.destination_city',
        'loads.offered_price_etb',
        'loads.shipper_id as shipper_id',
        'users.full_name as shipper_name',
        'users.phone_number as shipper_phone'
      )
      .where('bids.driver_id', driverId)
      .orderBy('bids.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: bids.length,
      data: bids,
    });
  } catch (error) {
    console.error('Get Driver Bids Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving driver bids.' });
  }
}

export async function getDriverShipments(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;

    const shipments = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .join('users', 'loads.shipper_id', 'users.id')
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
        'users.full_name as shipper_name',
        'users.phone_number as shipper_phone'
      )
      .where('shipments.carrier_id', driverId)
      .orderBy('shipments.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    console.error('Get Driver Shipments Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving driver shipments.' });
  }
}

export async function getDriverRatings(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;

    const reviews = await db('reviews')
      .join('users as reviewer', 'reviews.reviewer_id', 'reviewer.id')
      .select(
        'reviews.*',
        'reviewer.full_name as reviewer_name'
      )
      .where('reviews.reviewee_id', driverId)
      .orderBy('reviews.created_at', 'desc');

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const average = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating))));
      (breakdown as any)[star] = ((breakdown as any)[star] || 0) + 1;
    });

    const totalShipments = await db('shipments').where('carrier_id', driverId).count('* as count').first();

    return res.status(200).json({
      success: true,
      data: {
        average,
        totalTrips: Number(totalShipments?.count || 0),
        totalReviews: total,
        breakdown,
        reviews,
      },
    });
  } catch (error) {
    console.error('Get Driver Ratings Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving driver ratings.' });
  }
}

export async function updateDriverProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { full_name, email, phone_number, license_number } = req.body;

    const updateData: Record<string, any> = {};
    if (full_name) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number) updateData.phone_number = phone_number;
    if (license_number) updateData.license_number = license_number;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    const [updated] = await db('users')
      .where('id', userId)
      .update(updateData)
      .returning(['id', 'full_name', 'phone_number', 'email', 'profile_photo_url', 'license_number']);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Driver profile not found.' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });
  } catch (error) {
    console.error('Update Driver Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error updating driver profile.' });
  }
}

export async function uploadDriverProfilePhoto(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const photoUrl = await FileService.saveFile(file.buffer, file.originalname, userId || 'driver', 'profile');

    await db('users').where('id', userId).update({ profile_photo_url: photoUrl });

    return res.status(200).json({
      success: true,
      message: 'Profile photo uploaded successfully.',
      data: { profile_photo_url: photoUrl },
    });
  } catch (error) {
    console.error('Upload Photo Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error uploading profile photo.' });
  }
}

export async function removeDriverProfilePhoto(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    await db('users').where('id', userId).update({ profile_photo_url: null });

    return res.status(200).json({ success: true, message: 'Profile photo removed successfully.' });
  } catch (error) {
    console.error('Remove Photo Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error removing profile photo.' });
  }
}

export async function getDriverStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const total = await db('shipments').where('carrier_id', userId).count('* as count').first();
    const inTransit = await db('shipments').where('carrier_id', userId).where('status', 'IN_TRANSIT').count('* as count').first();
    const delivered = await db('shipments').where('carrier_id', userId).where('status', 'DELIVERED').count('* as count').first();

    const earningsResult = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .where('shipments.carrier_id', userId)
      .where('shipments.status', 'DELIVERED')
      .sum('loads.offered_price_etb as total')
      .first();

    const pendingBids = await db('bids')
      .where('driver_id', userId)
      .where('status', 'PENDING')
      .count('* as count')
      .first();

    const rating = await db('reviews')
      .where('reviewee_id', userId)
      .avg('rating as average_rating')
      .count('* as total_ratings')
      .first();

    return res.status(200).json({
      success: true,
      data: {
        totalEarningsEtb: Number(earningsResult?.total || 0),
        activeJobs: Number(inTransit?.count || 0),
        totalTrips: Number(delivered?.count || 0),
        pendingBids: Number(pendingBids?.count || 0),
        avgRating: rating?.average_rating ? Number(Number(rating.average_rating).toFixed(1)) : 4.9,
        ratingDetails: {
          average: rating?.average_rating ? Number(Number(rating.average_rating).toFixed(1)) : 4.9,
          total: Number(rating?.total_ratings || 0),
        },
      },
    });
  } catch (error) {
    console.error('Get Driver Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving stats.' });
  }
}

export async function getAvailableLoadsForDriver(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { lat, lng, radius_km } = req.query;

    const loads = await db('loads')
      .join('users', 'loads.shipper_id', 'users.id')
      .select(
        'loads.*',
        'users.full_name as shipper_name',
        'users.phone_number as shipper_phone'
      )
      .where('loads.status', 'POSTED')
      .orderBy('loads.created_at', 'desc');

    return res.status(200).json({
      success: true,
      count: loads.length,
      data: loads,
    });
  } catch (error) {
    console.error('Get Available Loads Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving available loads.' });
  }
}

export async function acceptLoadPrice(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { id } = req.params;

    const load = await db('loads')
      .where('id', id)
      .where('status', 'POSTED')
      .first();

    if (!load) {
      return res.status(404).json({ success: false, message: 'Load not found or not available.' });
    }

    let vehicle = await db('vehicles')
      .where('driver_id', driverId)
      .first();

    if (!vehicle) {
      const [newVehicle] = await db('vehicles')
        .insert({
          driver_id: driverId,
          plate_number: 'ETH-TMP-' + Math.floor(1000 + Math.random() * 9000),
          vehicle_type: 'TRAILER',
          capacity_tons: load.weight_tons || 20,
          is_active: true,
          verification_status: 'VERIFIED',
        })
        .returning('*');
      vehicle = newVehicle;
    }

    const [bid] = await db('bids')
      .insert({
        load_id: id,
        driver_id: driverId,
        vehicle_id: vehicle.id,
        bid_amount_etb: load.offered_price_etb,
        status: 'PENDING',
        is_auto_accept: true,
      })
      .returning('*');

    await db('bids').where('id', bid.id).update({ status: 'ACCEPTED' });
    await db('bids').where('load_id', id).whereNot('id', bid.id).update({ status: 'REJECTED' });
    await db('loads').where('id', id).update({ status: 'MATCHED' });

    const pickupData = generateOtpAndHash();
    const deliveryData = generateOtpAndHash();

    const [shipment] = await db('shipments')
      .insert({
        load_id: id,
        carrier_id: driverId,
        vehicle_id: vehicle.id,
        status: 'ASSIGNED',
        pickup_otp_hash: pickupData.hash,
        delivery_otp_hash: deliveryData.hash,
      })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Load accepted successfully. Shipment created.',
      data: { shipment, bid },
    });
  } catch (error) {
    console.error('Accept Load Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error accepting load.' });
  }
}

export async function cancelDriverBid(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;
    const { bid_id } = req.params;

    const bid = await db('bids').where('id', bid_id).where('driver_id', driverId).first();

    if (!bid) {
      return res.status(404).json({ success: false, message: 'Bid not found or unauthorized.' });
    }

    if (bid.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only PENDING bids can be cancelled.' });
    }

    await db('bids').where('id', bid_id).update({ status: 'WITHDRAWN' });

    return res.status(200).json({ success: true, message: 'Bid cancelled successfully.' });
  } catch (error) {
    console.error('Cancel Bid Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error cancelling bid.' });
  }
}

export async function getDriverEarnings(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;

    const total = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .where('shipments.carrier_id', driverId)
      .where('shipments.status', 'DELIVERED')
      .sum('loads.offered_price_etb as total')
      .first();

    return res.status(200).json({
      success: true,
      data: { total_earnings: Number(total?.total || 0) },
    });
  } catch (error) {
    console.error('Get Earnings Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving earnings.' });
  }
}

export async function getDriverEarningsHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const driverId = req.user?.userId;

    const history = await db('shipments')
      .join('loads', 'shipments.load_id', 'loads.id')
      .select(
        'shipments.id',
        'shipments.created_at',
        'loads.origin_city',
        'loads.destination_city',
        'loads.offered_price_etb as amount'
      )
      .where('shipments.carrier_id', driverId)
      .where('shipments.status', 'DELIVERED')
      .orderBy('shipments.created_at', 'desc');

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Get Earnings History Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving earnings history.' });
  }
}
