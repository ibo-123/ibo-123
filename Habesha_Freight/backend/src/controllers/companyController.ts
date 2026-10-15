import { Response } from 'express';
import db from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { FileService } from '../services/fileService';

export async function getCompanyProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const company = await db('users')
      .select(
        'id', 'full_name', 'phone_number', 'email', 'company_logo_url',
        'company_registration_number', 'company_description', 'kyc_status',
        'is_verified', 'status', 'created_at'
      )
      .where('id', userId)
      .where('role', 'FLEET_OWNER')
      .first();

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    const stats = await db('vehicles')
      .where('driver_id', userId)
      .select(
        db.raw('COUNT(*) as total_vehicles'),
        db.raw('COUNT(*) FILTER (WHERE is_active = true) as active_vehicles'),
        db.raw('COUNT(*) FILTER (WHERE verification_status = ?) as verified_vehicles', ['VERIFIED'])
      )
      .first();

    const driverStats = await db('company_drivers')
      .where('company_id', userId)
      .select(
        db.raw('COUNT(*) as total_drivers'),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as active_drivers', ['ACTIVE'])
      )
      .first();

    return res.status(200).json({
      success: true,
      data: {
        ...company,
        stats: {
          total_vehicles: Number(stats?.total_vehicles || 0),
          active_vehicles: Number(stats?.active_vehicles || 0),
          verified_vehicles: Number(stats?.verified_vehicles || 0),
          total_drivers: Number(driverStats?.total_drivers || 0),
          active_drivers: Number(driverStats?.active_drivers || 0),
        },
      },
    });
  } catch (error) {
    console.error('Get Company Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving company profile.' });
  }
}

export async function updateCompanyProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { full_name, email, phone_number, company_registration_number, company_description } = req.body;

    const updateData: Record<string, any> = {};
    if (full_name) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number) updateData.phone_number = phone_number;
    if (company_registration_number) updateData.company_registration_number = company_registration_number;
    if (company_description) updateData.company_description = company_description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    const [updated] = await db('users')
      .where('id', userId)
      .where('role', 'FLEET_OWNER')
      .update(updateData)
      .returning([
        'id', 'full_name', 'phone_number', 'email', 'company_logo_url',
        'company_registration_number', 'company_description', 'kyc_status', 'is_verified', 'status'
      ]);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: updated });
  } catch (error) {
    console.error('Update Company Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error updating profile.' });
  }
}

export async function uploadCompanyLogo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const validation = FileService.validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const fileUrl = await FileService.saveFile(file.buffer, file.originalname, userId!, 'logo');

    const [updated] = await db('users')
      .where('id', userId)
      .update({ company_logo_url: fileUrl })
      .returning(['id', 'company_logo_url']);

    return res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully.',
      data: { company_logo_url: updated.company_logo_url },
    });
  } catch (error) {
    console.error('Upload Company Logo Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error uploading logo.' });
  }
}

export async function removeCompanyLogo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const company = await db('users').where('id', userId).where('role', 'FLEET_OWNER').first();
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    if (company.company_logo_url) {
      await FileService.deleteFile(company.company_logo_url);
    }

    await db('users').where('id', userId).update({ company_logo_url: null });

    return res.status(200).json({ success: true, message: 'Company logo removed successfully.' });
  } catch (error) {
    console.error('Remove Company Logo Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error removing logo.' });
  }
}

export async function getCompanyStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    const vehicleStats = await db('vehicles')
      .where('driver_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(*) FILTER (WHERE is_active = true) as active'),
        db.raw('COUNT(*) FILTER (WHERE verification_status = ?) as verified', ['VERIFIED']),
        db.raw('COUNT(*) FILTER (WHERE verification_status = ?) as pending', ['PENDING'])
      )
      .first();

    const driverStats = await db('company_drivers')
      .where('company_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as active', ['ACTIVE'])
      )
      .first();

    const shipmentStats = await db('shipments')
      .where('carrier_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as in_transit', ['IN_TRANSIT']),
        db.raw('COUNT(*) FILTER (WHERE status = ?) as delivered', ['DELIVERED'])
      )
      .first();

    const earnings = await db('escrow_ledger')
      .where('beneficiary_id', userId)
      .where('status', 'RELEASED')
      .sum('net_payout_amount_etb as total_earnings')
      .first();

    const rating = await db('reviews')
      .where('reviewee_id', userId)
      .where('target_type', 'COMPANY')
      .select(
        db.raw('AVG(rating) as average_rating'),
        db.raw('COUNT(*) as total_ratings')
      )
      .first();

    return res.status(200).json({
      success: true,
      data: {
        vehicles: {
          total: Number(vehicleStats?.total || 0),
          active: Number(vehicleStats?.active || 0),
          verified: Number(vehicleStats?.verified || 0),
          pending: Number(vehicleStats?.pending || 0),
        },
        drivers: {
          total: Number(driverStats?.total || 0),
          active: Number(driverStats?.active || 0),
        },
        shipments: {
          total: Number(shipmentStats?.total || 0),
          in_transit: Number(shipmentStats?.in_transit || 0),
          delivered: Number(shipmentStats?.delivered || 0),
        },
        earnings: Number(earnings?.total_earnings || 0),
        rating: {
          average: Number(rating?.average_rating || 0),
          total: Number(rating?.total_ratings || 0),
        },
      },
    });
  } catch (error) {
    console.error('Get Company Stats Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving stats.' });
  }
}

export async function getCompanyFleetRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let baseQuery = db('loads');

    if (status && status !== 'ALL') {
      baseQuery = baseQuery.where('status', String(status));
    }

    const total = await baseQuery.clone().count('* as count').first();
    let requests = await baseQuery.clone()
      .leftJoin('users', 'loads.shipper_id', 'users.id')
      .select('loads.*', 'users.full_name as shipper_name', 'users.phone_number as shipper_phone')
      .orderBy('loads.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    if (requests.length === 0) {
      requests = await db('loads')
        .leftJoin('users', 'loads.shipper_id', 'users.id')
        .select('loads.*', 'users.full_name as shipper_name', 'users.phone_number as shipper_phone')
        .orderBy('loads.created_at', 'desc')
        .limit(Number(limit));
    }

    return res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || requests.length),
        totalPages: Math.ceil(Number(total?.count || requests.length) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get Company Fleet Requests Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving fleet requests.' });
  }
}

export async function getCompanyFleetRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const request = await db('loads')
      .where('id', id)
      .first();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Fleet request not found.' });
    }

    const bids = await db('bids')
      .where('load_id', id)
      .join('users', 'bids.driver_id', 'users.id')
      .select(
        'bids.*',
        'users.full_name as driver_name',
        'users.phone_number as driver_phone',
        'users.profile_photo_url as driver_photo'
      )
      .orderBy('bids.bid_amount_etb', 'asc');

    return res.status(200).json({
      success: true,
      data: {
        ...request,
        bids,
      },
    });
  } catch (error) {
    console.error('Get Company Fleet Request Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving fleet request.' });
  }
}

export async function acceptFleetRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const request = await db('loads')
      .where('id', id)
      .where('status', 'POSTED')
      .first();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Fleet request not found or not available.' });
    }

    const [updated] = await db('loads')
      .where('id', id)
      .update({ status: 'MATCHED' })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Fleet request accepted successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Accept Fleet Request Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error accepting fleet request.' });
  }
}

export async function declineFleetRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const request = await db('loads')
      .where('id', id)
      .where('status', 'POSTED')
      .first();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Fleet request not found or not available.' });
    }

    const [updated] = await db('loads')
      .where('id', id)
      .update({ status: 'CANCELLED' })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Fleet request declined successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Decline Fleet Request Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error declining fleet request.' });
  }
}

export async function assignDriverToFleetRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ success: false, message: 'Driver ID is required.' });
    }

    const request = await db('loads')
      .where('id', id)
      .where('status', 'MATCHED')
      .first();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Fleet request not found or not in MATCHED status.' });
    }

    const driver = await db('users')
      .where('id', driver_id)
      .where('role', 'DRIVER')
      .first();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    // Check if driver is assigned to company
    const companyDriver = await db('company_drivers')
      .where('company_id', userId)
      .where('driver_id', driver_id)
      .where('status', 'ACTIVE')
      .first();

    if (!companyDriver) {
      return res.status(400).json({ success: false, message: 'Driver is not assigned to this company.' });
    }

    // Get vehicle for driver
    const vehicle = await db('vehicles')
      .where('driver_id', driver_id)
      .where('is_active', true)
      .where('verification_status', 'VERIFIED')
      .where('capacity_tons', '>=', request.weight_tons)
      .first();

    if (!vehicle) {
      return res.status(400).json({ success: false, message: 'Driver does not have a verified vehicle with sufficient capacity.' });
    }

    const [updated] = await db('loads')
      .where('id', id)
      .update({ driver_id: driver_id })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Driver assigned to fleet request successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Assign Driver To Fleet Request Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error assigning driver.' });
  }
}

export async function getCompanyDeliveries(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let baseQuery = db('shipments')
      .where('carrier_id', userId)
      .join('loads', 'shipments.load_id', 'loads.id');

    if (status) {
      baseQuery = baseQuery.where('shipments.status', String(status));
    }

    const total = await baseQuery.clone().count('* as count').first();
    const deliveries = await baseQuery.clone()
      .select('shipments.*', 'loads.cargo_description', 'loads.origin_city', 'loads.destination_city')
      .orderBy('shipments.created_at', 'desc')
      .limit(Number(limit)).offset(offset);

    return res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        totalPages: Math.ceil(Number(total?.count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get Company Deliveries Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving deliveries.' });
  }
}

export async function getCompanyDelivery(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const delivery = await db('shipments')
      .where('shipments.id', id)
      .where('carrier_id', userId)
      .join('loads', 'shipments.load_id', 'loads.id')
      .select('shipments.*', 'loads.cargo_description', 'loads.origin_city', 'loads.destination_city')
      .first();

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found.' });
    }

    const tracking = await db('location_breadcrumbs')
      .where('shipment_id', id)
      .orderBy('recorded_at', 'asc');

    const escrow = await db('escrow_ledger')
      .where('shipment_id', id)
      .first();

    return res.status(200).json({
      success: true,
      data: {
        ...delivery,
        tracking,
        escrow,
      },
    });
  } catch (error) {
    console.error('Get Company Delivery Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving delivery.' });
  }
}

export async function getCompanyVehicles(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const companyDrivers = await db('company_drivers')
      .where('company_id', userId)
      .pluck('driver_id');

    let baseQuery = db('vehicles').where((builder) => {
      builder.where('driver_id', userId).orWhereIn('driver_id', companyDrivers);
    });

    if (status === 'active') {
      baseQuery = baseQuery.where('is_active', true);
    } else if (status === 'inactive') {
      baseQuery = baseQuery.where('is_active', false);
    }

    const total = await baseQuery.clone().count('* as count').first();
    let vehicles = await baseQuery.clone().select('*').orderBy('created_at', 'desc').limit(Number(limit)).offset(offset);

    if (vehicles.length === 0) {
      vehicles = await db('vehicles').select('*').orderBy('created_at', 'desc').limit(Number(limit));
    }

    return res.status(200).json({
      success: true,
      data: vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || vehicles.length),
        totalPages: Math.ceil(Number(total?.count || vehicles.length) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get Company Vehicles Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving vehicles.' });
  }
}

export async function createCompanyVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { plate_number, vehicle_type, capacity_tons, origin_lat, origin_lng } = req.body;

    if (!plate_number || !vehicle_type || !capacity_tons) {
      return res.status(400).json({ success: false, message: 'Plate number, vehicle type, and capacity are required.' });
    }

    const existing = await db('vehicles').where({ plate_number }).first();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Vehicle with this plate number already exists.' });
    }

    const [vehicle] = await db('vehicles')
      .insert({
        driver_id: userId,
        plate_number,
        vehicle_type,
        capacity_tons,
        origin_lat: origin_lat || null,
        origin_lng: origin_lng || null,
        is_active: true,
        verification_status: 'PENDING',
      })
      .returning('*');

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully.',
      data: vehicle,
    });
  } catch (error) {
    console.error('Create Company Vehicle Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error creating vehicle.' });
  }
}

export async function updateCompanyVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { plate_number, vehicle_type, capacity_tons, is_active, origin_lat, origin_lng, assigned_driver_id, verification_status } = req.body;

    const vehicle = await db('vehicles')
      .where('id', id)
      .where('driver_id', userId)
      .first();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const updateData: Record<string, any> = {};
    if (plate_number) updateData.plate_number = plate_number;
    if (vehicle_type) updateData.vehicle_type = vehicle_type;
    if (capacity_tons) updateData.capacity_tons = Number(capacity_tons);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (origin_lat !== undefined) updateData.origin_lat = origin_lat;
    if (origin_lng !== undefined) updateData.origin_lng = origin_lng;
    if (assigned_driver_id !== undefined) updateData.assigned_driver_id = assigned_driver_id || null;
    if (verification_status) updateData.verification_status = verification_status;

    const [updated] = await db('vehicles')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: updated || { id, ...updateData },
    });
  } catch (error) {
    console.error('Update Company Vehicle Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error updating vehicle.' });
  }
}

export async function updateCompanyVehicleStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
    }

    const vehicle = await db('vehicles')
      .where('id', id)
      .where('driver_id', userId)
      .first();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const [updated] = await db('vehicles')
      .where('id', id)
      .update({ is_active: status === 'ACTIVE' })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: `Vehicle status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Update Company Vehicle Status Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error updating vehicle status.' });
  }
}

export async function assignDriverToVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ success: false, message: 'Driver ID is required.' });
    }

    const vehicle = await db('vehicles')
      .where('id', id)
      .where('driver_id', userId)
      .first();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const driver = await db('users')
      .where('id', driver_id)
      .where('role', 'DRIVER')
      .first();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    if (!driver.is_verified || driver.kyc_status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Driver cannot be assigned until KYC status is APPROVED and verified by platform administrator.',
      });
    }

    // Check if driver is assigned to company
    const companyDriver = await db('company_drivers')
      .where('company_id', userId)
      .where('driver_id', driver_id)
      .where('status', 'ACTIVE')
      .first();

    if (!companyDriver) {
      return res.status(400).json({ success: false, message: 'Driver is not assigned to this company.' });
    }

    const [updated] = await db('vehicles')
      .where('id', id)
      .update({ assigned_driver_id: driver_id })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Driver assigned to vehicle successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Assign Driver To Vehicle Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error assigning driver.' });
  }
}

export async function unassignDriverFromVehicle(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const vehicle = await db('vehicles')
      .where('id', id)
      .where('driver_id', userId)
      .first();

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    const [updated] = await db('vehicles')
      .where('id', id)
      .update({ assigned_driver_id: null })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: 'Driver unassigned from vehicle successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Unassign Driver From Vehicle Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error unassigning driver.' });
  }
}

export async function getCompanyDrivers(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let baseQuery = db('company_drivers')
      .where('company_id', userId)
      .join('users', 'company_drivers.driver_id', 'users.id');

    if (status) {
      baseQuery = baseQuery.where('company_drivers.status', String(status));
    }

    const total = await baseQuery.clone().count('* as count').first();
    const drivers = await baseQuery.clone()
      .select(
        'company_drivers.*',
        'users.full_name',
        'users.phone_number',
        'users.email',
        'users.kyc_status',
        'users.is_verified',
        'users.profile_photo_url'
      )
      .orderBy('company_drivers.created_at', 'desc')
      .limit(Number(limit)).offset(offset);

    return res.status(200).json({
      success: true,
      data: drivers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total?.count || 0),
        totalPages: Math.ceil(Number(total?.count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get Company Drivers Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving drivers.' });
  }
}

export async function createCompanyDriver(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { driver_id } = req.body;

    if (!driver_id) {
      return res.status(400).json({ success: false, message: 'Driver ID is required.' });
    }

    const driver = await db('users')
      .where('id', driver_id)
      .where('role', 'DRIVER')
      .first();

    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const existing = await db('company_drivers')
      .where('company_id', userId)
      .where('driver_id', driver_id)
      .first();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Driver is already assigned to this company.' });
    }

    const [companyDriver] = await db('company_drivers')
      .insert({
        company_id: userId,
        driver_id: driver_id,
        status: 'ACTIVE',
      })
      .returning('*');

    return res.status(201).json({
      success: true,
      message: 'Driver assigned to company successfully.',
      data: companyDriver,
    });
  } catch (error) {
    console.error('Create Company Driver Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error assigning driver.' });
  }
}

export async function getCompanyDriverDetails(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const companyDriver = await db('company_drivers')
      .where('company_drivers.driver_id', id)
      .where('company_id', userId)
      .join('users', 'company_drivers.driver_id', 'users.id')
      .select(
        'company_drivers.*',
        'users.full_name',
        'users.phone_number',
        'users.email',
        'users.kyc_status',
        'users.is_verified',
        'users.profile_photo_url',
        'users.license_number'
      )
      .first();

    if (!companyDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const vehicles = await db('vehicles')
      .where('driver_id', id)
      .select('*');

    const ratings = await db('reviews')
      .where('reviewee_id', id)
      .where('target_type', 'DRIVER')
      .select(
        db.raw('AVG(rating) as average_rating'),
        db.raw('COUNT(*) as total_ratings')
      )
      .first();

    return res.status(200).json({
      success: true,
      data: {
        ...companyDriver,
        vehicles,
        rating: {
          average: Number(ratings?.average_rating || 0),
          total: Number(ratings?.total_ratings || 0),
        },
      },
    });
  } catch (error) {
    console.error('Get Company Driver Details Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error retrieving driver details.' });
  }
}

export async function updateCompanyDriverAssignment(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED.' });
    }

    const companyDriver = await db('company_drivers')
      .where('driver_id', id)
      .where('company_id', userId)
      .first();

    if (!companyDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    const [updated] = await db('company_drivers')
      .where('driver_id', id)
      .where('company_id', userId)
      .update({ status })
      .returning('*');

    return res.status(200).json({
      success: true,
      message: `Driver status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Update Company Driver Assignment Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error updating driver status.' });
  }
}

export async function removeCompanyDriver(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const companyDriver = await db('company_drivers')
      .where('driver_id', id)
      .where('company_id', userId)
      .first();

    if (!companyDriver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    await db('company_drivers')
      .where('driver_id', id)
      .where('company_id', userId)
      .del();

    return res.status(200).json({
      success: true,
      message: 'Driver removed from company successfully.',
    });
  } catch (error) {
    console.error('Remove Company Driver Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error removing driver.' });
  }
}
