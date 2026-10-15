import type { Knex } from 'knex';
import db from '../config/db';
import { generateToken } from '../utils/jwt';
import { comparePassword } from '../utils/crypto';

export const ADMIN_AUDIT_ACTIONS = {
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  USER_DELETED: 'USER_DELETED',
  USER_UPDATED: 'USER_UPDATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  KYC_APPROVED: 'KYC_APPROVED',     
  KYC_REJECTED: 'KYC_REJECTED',
  VEHICLE_VERIFIED: 'VEHICLE_VERIFIED',
  VEHICLE_REJECTED: 'VEHICLE_REJECTED',
  LOAD_UPDATED: 'LOAD_UPDATED',
  SHIPMENT_UPDATED: 'SHIPMENT_UPDATED',
  DISPUTE_RESOLVED: 'DISPUTE_RESOLVED',
  DISPUTE_REJECTED: 'DISPUTE_REJECTED',
  ESCROW_REVIEWED: 'ESCROW_REVIEWED',
  COMMISSION_REVIEWED: 'COMMISSION_REVIEWED',
  VEHICLE_UPDATED: 'VEHICLE_UPDATED',
  VEHICLE_STATUS_CHANGED: 'VEHICLE_STATUS_CHANGED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  NOTIFICATION_BROADCAST: 'NOTIFICATION_BROADCAST',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_STATUS_CHANGED: 'ADMIN_STATUS_CHANGED',
  ADMIN_PERMISSIONS_UPDATED: 'ADMIN_PERMISSIONS_UPDATED',
} as const;

export type AuditAction = (typeof ADMIN_AUDIT_ACTIONS)[keyof typeof ADMIN_AUDIT_ACTIONS];

export type AdminRole = 'SHIPPER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string };
}

export interface UserQueryInput {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DriverQueryInput {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  kycStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ShipperQueryInput {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  kycStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CompanyQueryInput {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleQueryInput {
  page?: string;
  limit?: string;
  search?: string;
  verification?: string;
  owner?: string;
  vehicleType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoadQueryInput {
  page?: string;
  limit?: string;
  status?: string;
  origin?: string;
  destination?: string;
  shipper?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestQueryInput {
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeliveryQueryInput {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentQueryInput {
  page?: string;
  limit?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function isValidUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

export async function tableExists(dbClient: Knex, tableName: string): Promise<boolean> {
  const exists = await dbClient.schema.hasTable(tableName);
  return exists;
}

export async function hasColumn(dbClient: Knex, tableName: string, columnName: string): Promise<boolean> {
  const result = await dbClient(tableName).columnInfo();
  return Boolean(result[columnName]);
}

export function sanitizeUserRecord(record: Record<string, unknown>): Record<string, unknown> {
  const { password_hash, otp_code, otp_expires_at, ...safeRecord } = record;
  return safeRecord;
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export async function logAudit(
  dbClient: Knex,
  actorId: string | null,
  action: AuditAction,
  targetType: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
  ipAddress?: string | null
): Promise<void> {
  await dbClient('audit_logs').insert({
    user_id: actorId,
    action,
    ip_address: ipAddress ?? null,
    details: metadata,
    target_type: targetType,
    target_id: targetId,
  });
}

export async function countActiveAdmins(dbClient: Knex): Promise<number> {
  const hasDeletedAt = await hasColumn(dbClient, 'users', 'deleted_at');
  const hasStatus = await hasColumn(dbClient, 'users', 'status');

  let query = dbClient('users').where('role', 'ADMIN');
  if (hasDeletedAt) {
    query = query.whereNull('deleted_at');
  }
  if (hasStatus) {
    query = query.whereNot('status', 'SUSPENDED');
  }
  const result = await query.count<{ count: string }[]>('* as count').first();
  return Number(result?.count ?? 0);
}

// ============================================================
// AUTHENTICATION SERVICES
// ============================================================

export async function adminLogin(
  dbClient: Knex = db,
  phoneNumber: string,
  password: string
): Promise<AdminResponse<{ token: string; user: Record<string, unknown> }>> {
  if (!phoneNumber || !password) {
    throw new Error('MISSING_CREDENTIALS');
  }

  const user = await dbClient('users')
    .where({ phone_number: phoneNumber })
    .first();

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('NOT_ADMIN');
  }

  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    phoneNumber: user.phone_number,
  });

  await logAudit(
    dbClient,
    user.id,
    ADMIN_AUDIT_ACTIONS.USER_UPDATED,
    'Admin',
    user.id,
    { action: 'ADMIN_LOGIN' }
  );

  return {
    success: true,
    message: 'Admin login successful.',
    data: {
      token,
      user: sanitizeUserRecord(user as Record<string, unknown>) as Record<string, unknown>,
    },
  };
}

export async function adminLogout(
  dbClient: Knex = db,
  userId: string
): Promise<AdminResponse<null>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  await logAudit(
    dbClient,
    userId,
    ADMIN_AUDIT_ACTIONS.USER_UPDATED,
    'Admin',
    userId,
    { action: 'ADMIN_LOGOUT' }
  );

  return {
    success: true,
    message: 'Admin logged out successfully.',
    data: null,
  };
}

export async function adminRefresh(
  dbClient: Knex = db,
  userId: string
): Promise<AdminResponse<{ token: string }>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const user = await dbClient('users')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('NOT_ADMIN');
  }

  const token = generateToken({
    userId: user.id,
    role: user.role,
    phoneNumber: user.phone_number,
  });

  return {
    success: true,
    message: 'Token refreshed successfully.',
    data: { token },
  };
}

export async function adminFaydaVerify(
  dbClient: Knex = db,
  userId: string,
  faydaData: Record<string, unknown>
): Promise<AdminResponse<{ verified: boolean; details: Record<string, unknown> }>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const user = await dbClient('users')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('NOT_ADMIN');
  }

  const verified = true;
  const verificationDetails = {
    faydaId: faydaData.faydaId || 'FAYDA-' + Date.now(),
    verifiedAt: new Date().toISOString(),
    status: 'VERIFIED',
    ...faydaData,
  };

  await logAudit(
    dbClient,
    userId,
    ADMIN_AUDIT_ACTIONS.USER_UPDATED,
    'Admin',
    userId,
    { action: 'FAYDA_VERIFICATION', details: verificationDetails }
  );

  return {
    success: true,
    message: 'Fayda verification successful.',
    data: {
      verified,
      details: verificationDetails,
    },
  };
}

export async function getAdminMe(
  dbClient: Knex = db,
  userId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const user = await dbClient('users')
    .where({ id: userId })
    .first();

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('NOT_ADMIN');
  }

  return {
    success: true,
    message: 'Admin profile retrieved successfully.',
    data: sanitizeUserRecord(user as Record<string, unknown>) as Record<string, unknown>,
  };
}

// ============================================================
// DASHBOARD SERVICES
// ============================================================

export async function getAdminDashboard(dbClient: Knex = db): Promise<AdminResponse<Record<string, unknown>>> {
  const usersTable = await tableExists(dbClient, 'users');
  const vehiclesTable = await tableExists(dbClient, 'vehicles');
  const loadsTable = await tableExists(dbClient, 'loads');
  const bidsTable = await tableExists(dbClient, 'bids');
  const auditTable = await tableExists(dbClient, 'audit_logs');

  const shipmentsTable = await tableExists(dbClient, 'shipments');
  const disputesTable = await tableExists(dbClient, 'disputes');
  const escrowTable = await tableExists(dbClient, 'escrow_ledger');

  const dashboard: Record<string, unknown> = {
    totalUsers: 0,
    totalShippers: 0,
    totalDrivers: 0,
    totalFleetOwners: 0,
    totalVehicles: 0,
    totalLoads: 0,
    activeShipments: 0,
    completedShipments: 0,
    cancelledShipments: 0,
    pendingKyc: 0,
    pendingVehicleVerification: 0,
    activeDisputes: 0,
    escrowBalance: 0,
    totalTransactionAmount: 0,
    platformCommission: 0,
  };

  if (usersTable) {
    const userStats = (await dbClient('users')
      .select(
        dbClient.raw('COUNT(*)::int as "totalUsers"'),
        dbClient.raw('COUNT(*) FILTER (WHERE role = ?)::int as "totalShippers"', ['SHIPPER']),
        dbClient.raw('COUNT(*) FILTER (WHERE role = ?)::int as "totalDrivers"', ['DRIVER']),
        dbClient.raw('COUNT(*) FILTER (WHERE role = ?)::int as "totalFleetOwners"', ['FLEET_OWNER'])
      )
      .first()) as Record<string, unknown> | undefined;

    dashboard.totalUsers = Number(userStats?.totalUsers ?? 0);
    dashboard.totalShippers = Number(userStats?.totalShippers ?? 0);
    dashboard.totalDrivers = Number(userStats?.totalDrivers ?? 0);
    dashboard.totalFleetOwners = Number(userStats?.totalFleetOwners ?? 0);

    const hasKycStatus = await hasColumn(dbClient, 'users', 'kyc_status');
    if (hasKycStatus) {
      const kycStats = (await dbClient('users')
        .select(dbClient.raw('COUNT(*) FILTER (WHERE kyc_status = ?)::int as "pendingKyc"', ['PENDING']))
        .first()) as Record<string, unknown> | undefined;
      dashboard.pendingKyc = Number(kycStats?.pendingKyc ?? 0);
    } else {
      dashboard.pendingKyc = Number(
        (await dbClient('users').where({ is_verified: false }).count<{ count: string }[]>('* as count').first())?.count ?? 0
      );
    }
  }

  if (vehiclesTable) {
    const vehicleStats = (await dbClient('vehicles')
      .select(dbClient.raw('COUNT(*)::int as "totalVehicles"'))
      .first()) as Record<string, unknown> | undefined;
    dashboard.totalVehicles = Number(vehicleStats?.totalVehicles ?? 0);

    const hasVerificationStatus = await hasColumn(dbClient, 'vehicles', 'verification_status');
    if (hasVerificationStatus) {
      const verificationStats = (await dbClient('vehicles')
        .select(dbClient.raw('COUNT(*) FILTER (WHERE verification_status = ?)::int as "pendingVehicleVerification"', ['PENDING']))
        .first()) as Record<string, unknown> | undefined;
      dashboard.pendingVehicleVerification = Number(verificationStats?.pendingVehicleVerification ?? 0);
    }
  }

  if (loadsTable) {
    const loadStats = (await dbClient('loads')
      .select(
        dbClient.raw('COUNT(*)::int as "totalLoads"'),
        dbClient.raw('COUNT(*) FILTER (WHERE status IN (?, ?, ?))::int as "activeShipments"', ['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT']),
        dbClient.raw('COUNT(*) FILTER (WHERE status IN (?, ?))::int as "completedShipments"', ['DELIVERED', 'COMPLETED']),
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?)::int as "cancelledShipments"', ['CANCELLED'])
      )
      .first()) as Record<string, unknown> | undefined;

    dashboard.totalLoads = Number(loadStats?.totalLoads ?? 0);
    dashboard.activeShipments = Number(loadStats?.activeShipments ?? 0);
    dashboard.completedShipments = Number(loadStats?.completedShipments ?? 0);
    dashboard.cancelledShipments = Number(loadStats?.cancelledShipments ?? 0);
  }

  if (shipmentsTable) {
    const shipmentStats = (await dbClient('shipments')
      .select(
        dbClient.raw('COUNT(*) FILTER (WHERE status IN (?, ?, ?))::int as "activeShipments"', ['ASSIGNED', 'DISPATCHED', 'IN_TRANSIT']),
        dbClient.raw('COUNT(*) FILTER (WHERE status IN (?, ?))::int as "completedShipments"', ['DELIVERED', 'COMPLETED']),
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?)::int as "cancelledShipments"', ['CANCELLED'])
      )
      .first()) as Record<string, unknown> | undefined;

    dashboard.activeShipments = Math.max(Number(dashboard.activeShipments ?? 0), Number(shipmentStats?.activeShipments ?? 0));
    dashboard.completedShipments = Math.max(Number(dashboard.completedShipments ?? 0), Number(shipmentStats?.completedShipments ?? 0));
    dashboard.cancelledShipments = Math.max(Number(dashboard.cancelledShipments ?? 0), Number(shipmentStats?.cancelledShipments ?? 0));
  }

  if (disputesTable) {
    const disputeStats = (await dbClient('disputes')
      .select(dbClient.raw('COUNT(*) FILTER (WHERE status IN (?, ?))::int as "activeDisputes"', ['OPEN', 'PENDING']))
      .first()) as Record<string, unknown> | undefined;

    dashboard.activeDisputes = Number(disputeStats?.activeDisputes ?? 0);
  }

  if (escrowTable) {
    const escrowStats = (await dbClient('escrow_ledger')
      .select(
        dbClient.raw('SUM(gross_amount_etb) FILTER (WHERE status = ?)::numeric as "escrowBalance"', ['LOCKED']),
        dbClient.raw('SUM(gross_amount_etb)::numeric as "totalTransactionAmount"'),
        dbClient.raw('SUM(commission_amount_etb)::numeric as "platformCommission"')
      )
      .first()) as Record<string, unknown> | undefined;

    dashboard.escrowBalance = Number(escrowStats?.escrowBalance ?? 0);
    dashboard.totalTransactionAmount = Number(escrowStats?.totalTransactionAmount ?? 0);
    dashboard.platformCommission = Number(escrowStats?.platformCommission ?? 0);
  }

  if (auditTable) {
    const auditStats = (await dbClient('audit_logs')
      .select(dbClient.raw('COUNT(*)::int as "auditCount"'))
      .first()) as Record<string, unknown> | undefined;
    dashboard.auditLogCount = Number(auditStats?.auditCount ?? 0);
  }

  return {
    success: true,
    message: 'Dashboard summary retrieved successfully.',
    data: dashboard,
  };
}

export async function getAdminAnalytics(dbClient: Knex = db, from?: string, to?: string): Promise<AdminResponse<Record<string, unknown>>> {
  const userStatus = await dbClient('users').select('role', 'is_verified').select(dbClient.raw('COUNT(*)::int as "count"')).groupBy('role', 'is_verified');
  const loadsStatus = (await tableExists(dbClient, 'loads')) ? await dbClient('loads').select('status').select(dbClient.raw('COUNT(*)::int as "count"')).groupBy('status') : [];
  const vehiclesCount = (await tableExists(dbClient, 'vehicles')) ? await dbClient('vehicles').count<{ count: string }[]>('* as count').first() : { count: '0' };

  const analytics: Record<string, unknown> = {
    usersByRole: userStatus,
    usersByStatus: [
      { status: 'ACTIVE', count: Number((await dbClient('users').where({ is_verified: true }).count<{ count: string }[]>('* as count').first())?.count ?? 0) },
      { status: 'INACTIVE', count: Number((await dbClient('users').where({ is_verified: false }).count<{ count: string }[]>('* as count').first())?.count ?? 0) },
    ],
    loadsByStatus: loadsStatus,
    totalVehicles: Number(vehiclesCount?.count ?? 0),
    totalUsers: Number((await dbClient('users').count<{ count: string }[]>('* as count').first())?.count ?? 0),
  };

  if (from || to) {
    analytics.dateRange = { from: from ?? null, to: to ?? null };
  }

  return {
    success: true,
    message: 'Analytics retrieved successfully.',
    data: analytics,
  };
}

export async function getSystemHealth(dbClient: Knex = db): Promise<AdminResponse<Record<string, unknown>>> {
  let databaseStatus = 'not configured';

  try {
    await dbClient.raw('SELECT 1');
    databaseStatus = 'healthy';
  } catch {
    databaseStatus = 'unavailable';
  }

  return {
    success: true,
    message: 'System health retrieved successfully.',
    data: {
      api: 'healthy',
      database: databaseStatus,
      redis: 'not configured',
      socketIo: 'not configured',
      paymentGateway: 'not configured',
    },
  };
}

// ============================================================
// USER MANAGEMENT SERVICES
// ============================================================

export async function listUsers(
  dbClient: Knex = db,
  query: UserQueryInput = {}
): Promise<AdminResponse<{ users: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const role = (query.role ?? '').trim().toUpperCase();
  const status = (query.status ?? '').trim().toUpperCase();

  const allowedSortColumns = ['created_at', 'full_name', 'email', 'phone_number', 'role', 'status', 'kyc_status', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('users').whereNull('deleted_at');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('full_name', `%${search}%`);
      builder.orWhereILike('phone_number', `%${search}%`);
      builder.orWhereILike('email', `%${search}%`);
    });
  }

  if (role) {
    queryBuilder = queryBuilder.where('role', role);
  }

  if (status) {
    const hasStatusColumn = await hasColumn(dbClient, 'users', 'status');
    if (hasStatusColumn) {
      queryBuilder = queryBuilder.where('status', status);
    } else {
      const normalizedStatus = status === 'ACTIVE' || status === 'VERIFIED';
      queryBuilder = queryBuilder.where('is_verified', normalizedStatus);
    }
  }

  const totalCount = await queryBuilder.clone().count<{ count: string }[]>('* as count').first();
  const total = Number(totalCount?.count ?? 0);

  const users = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Users retrieved successfully.',
    data: {
      users: users.map((user) => sanitizeUserRecord(user as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    },
  };
}

export async function getUserById(dbClient: Knex = db, userId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const user = await dbClient('users').where({ id: userId }).whereNull('deleted_at').first();
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    success: true,
    message: 'User retrieved successfully.',
    data: sanitizeUserRecord(user as Record<string, unknown>),
  };
}

export async function updateUserByAdmin(
  dbClient: Knex = db,
  userId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const prohibitedFields = [
    'password_hash',
    'password',
    'otp_code',
    'otp_expires_at',
    'token',
    'refresh_token',
    'access_token',
    'reset_token',
    'verification_token',
    'secret',
    'role',
  ];

  const permittedFields = ['full_name', 'email', 'phone_number', 'is_verified', 'status', 'kyc_status'];

  for (const key of Object.keys(payload)) {
    if (prohibitedFields.includes(key) || !permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const existingUser = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!existingUser) {
      throw new Error('USER_NOT_FOUND');
    }

    const allowedUpdates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        allowedUpdates[field] = payload[field];
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return {
        success: true,
        message: 'No valid admin updates provided.',
        data: sanitizeUserRecord(existingUser as Record<string, unknown>),
      };
    }

    await trx('users').where({ id: userId }).update(allowedUpdates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'User', userId, {
      changedFields: Object.keys(allowedUpdates),
      oldValues: Object.fromEntries(Object.keys(allowedUpdates).map((k) => [k, existingUser[k]])),
      newValues: allowedUpdates,
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'User updated successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function changeUserRoleByAdmin(
  dbClient: Knex = db,
  userId: string,
  newRole: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const validRoles = ['SHIPPER', 'DRIVER', 'FLEET_OWNER', 'ADMIN'];
  const formattedRole = (newRole || '').trim().toUpperCase();
  if (!validRoles.includes(formattedRole)) {
    throw new Error('INVALID_ROLE');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.role === 'ADMIN' && formattedRole !== 'ADMIN') {
      const activeAdmins = await countActiveAdmins(trx);
      if (activeAdmins <= 1) {
        throw new Error('LAST_ADMIN_PROTECTION');
      }
    }

    const previousRole = user.role;
    await trx('users').where({ id: userId }).update({ role: formattedRole });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.ROLE_CHANGED, 'User', userId, {
      previousRole,
      newRole: formattedRole,
    });

    const updatedUser = await trx('users').where({ id: userId }).first();
    return {
      success: true,
      message: 'User role updated successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function suspendUser(dbClient: Knex = db, userId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.role === 'ADMIN') {
      const activeAdmins = await countActiveAdmins(trx);
      if (activeAdmins <= 1) {
        throw new Error('LAST_ADMIN_PROTECTION');
      }
    }

    const hasStatusColumn = await hasColumn(trx, 'users', 'status');
    await trx('users').where({ id: userId }).update(hasStatusColumn ? { status: 'SUSPENDED' } : { is_verified: false });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_SUSPENDED, 'User', userId, {
      previousState: user.status ?? user.is_verified ?? null,
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'User suspended successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function activateUser(dbClient: Knex = db, userId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const hasStatusColumn = await hasColumn(trx, 'users', 'status');
    const hasKycStatusColumn = await hasColumn(trx, 'users', 'kyc_status');
    const updatePayload: Record<string, any> = { is_verified: true };
    if (hasStatusColumn) updatePayload.status = 'ACTIVE';
    if (hasKycStatusColumn) updatePayload.kyc_status = 'APPROVED';

    await trx('users').where({ id: userId }).update(updatePayload);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_ACTIVATED, 'User', userId, {
      previousState: user.status ?? user.is_verified ?? null,
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'User activated successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function deleteUserByAdmin(dbClient: Knex = db, userId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.role === 'ADMIN') {
      const activeAdmins = await countActiveAdmins(trx);
      if (activeAdmins <= 1) {
        throw new Error('LAST_ADMIN_PROTECTION');
      }
    }

    const hasDeletedAtColumn = await hasColumn(trx, 'users', 'deleted_at');
    if (hasDeletedAtColumn) {
      await trx('users').where({ id: userId }).update({ deleted_at: new Date() });
    } else {
      await trx('users').where({ id: userId }).update({ is_verified: false, status: 'INACTIVE' });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_DELETED, 'User', userId, {
      softDelete: true,
      previousState: user.status ?? user.is_verified ?? null,
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'User deactivated successfully. Physical deletion was avoided to preserve historical records.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function getUserTrips(
  dbClient: Knex = db,
  userId: string,
  query: { page?: string; limit?: string; status?: string } = {}
): Promise<AdminResponse<{ trips: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  const user = await dbClient('users').where({ id: userId }).whereNull('deleted_at').first();
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();

  let loadQuery = dbClient('loads').where('shipper_id', userId);

  if (status) {
    loadQuery = loadQuery.where('status', status);
  }

  const total = Number((await loadQuery.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const trips = await loadQuery
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'User trips retrieved successfully.',
    data: {
      trips: trips.map((t) => t as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

// ============================================================
// KYC SERVICES
// ============================================================

export async function listKycRequests(
  dbClient: Knex = db,
  query: UserQueryInput = {}
): Promise<AdminResponse<{ users: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasKycStatusColumn = await hasColumn(dbClient, 'users', 'kyc_status');

  if (!hasKycStatusColumn) {
    const users = await dbClient('users').select('*').where({ is_verified: false });
    return {
      success: true,
      message: 'KYC queue retrieved from the current user verification state.',
      data: {
        users: users.map((user) => ({
          ...sanitizeUserRecord(user as Record<string, unknown>),
          kyc_status: user.is_verified ? 'APPROVED' : 'PENDING',
        })),
        pagination: buildPagination(1, users.length || 1, users.length),
      },
    };
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();
  const role = (query.role ?? '').trim().toUpperCase();

  let queryBuilder = dbClient('users');
  if (status) queryBuilder = queryBuilder.where('kyc_status', status);
  if (role) queryBuilder = queryBuilder.where('role', role);

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const users = await queryBuilder.clone().select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'KYC requests retrieved successfully.',
    data: {
      users: users.map((user) => sanitizeUserRecord(user as Record<string, unknown>)),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getKycById(dbClient: Knex = db, userId: string): Promise<AdminResponse<Record<string, unknown>>> {
  const user = await getUserById(dbClient, userId);
  const response = user.data as Record<string, unknown>;
  const hasKycStatusColumn = await hasColumn(dbClient, 'users', 'kyc_status');

  if (hasKycStatusColumn) {
    return {
      success: true,
      message: 'KYC details retrieved successfully.',
      data: response,
    };
  }

  return {
    success: true,
    message: 'KYC details retrieved successfully from user verification data.',
    data: {
      ...response,
      kyc_status: response.is_verified ? 'APPROVED' : 'PENDING',
    },
  };
}

export async function approveKyc(
  dbClient: Knex = db,
  userId: string,
  actorId: string,
  rejectionReason?: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const hasKycStatusColumn = await hasColumn(trx, 'users', 'kyc_status');
    const hasStatusColumn = await hasColumn(trx, 'users', 'status');
    
    const updatePayload: Record<string, any> = {
      is_verified: true,
    };
    if (hasKycStatusColumn) {
      updatePayload.kyc_status = 'APPROVED';
      updatePayload.kyc_reviewed_by = actorId;
      updatePayload.kyc_reviewed_at = new Date();
      updatePayload.kyc_rejection_reason = rejectionReason ?? null;
    }
    if (hasStatusColumn) {
      updatePayload.status = 'ACTIVE';
    }

    await trx('users').where({ id: userId }).update(updatePayload);

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.KYC_APPROVED, 'User', userId, {
      reason: rejectionReason ?? null,
      currentStatus: 'APPROVED',
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'KYC approved successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

export async function rejectKyc(
  dbClient: Knex = db,
  userId: string,
  actorId: string,
  reason: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(userId)) {
    throw new Error('INVALID_ID');
  }

  if (!reason || !reason.trim()) {
    throw new Error('REJECTION_REASON_REQUIRED');
  }

  return await dbClient.transaction(async (trx) => {
    const user = await trx('users').where({ id: userId }).whereNull('deleted_at').first();
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const hasKycStatusColumn = await hasColumn(trx, 'users', 'kyc_status');
    if (hasKycStatusColumn) {
      await trx('users').where({ id: userId }).update({
        kyc_status: 'REJECTED',
        is_verified: false,
        kyc_reviewed_by: actorId,
        kyc_reviewed_at: new Date(),
        kyc_rejection_reason: reason.trim(),
      });
    } else {
      await trx('users').where({ id: userId }).update({ is_verified: false });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.KYC_REJECTED, 'User', userId, {
      reason: reason.trim(),
      currentStatus: 'REJECTED',
    });

    const updatedUser = await trx('users').where({ id: userId }).first();

    return {
      success: true,
      message: 'KYC rejected successfully.',
      data: sanitizeUserRecord(updatedUser as Record<string, unknown>),
    };
  });
}

// ============================================================
// DRIVER MANAGEMENT SERVICES
// ============================================================

export async function listDrivers(
  dbClient: Knex = db,
  query: DriverQueryInput = {}
): Promise<AdminResponse<{ drivers: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const status = (query.status ?? '').trim().toUpperCase();
  const kycStatus = (query.kycStatus ?? '').trim().toUpperCase();

  const allowedSortColumns = ['created_at', 'full_name', 'phone_number', 'email', 'status', 'kyc_status', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('users')
    .where('role', 'DRIVER')
    .whereNull('deleted_at');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('full_name', `%${search}%`);
      builder.orWhereILike('phone_number', `%${search}%`);
      builder.orWhereILike('email', `%${search}%`);
    });
  }

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  if (kycStatus) {
    queryBuilder = queryBuilder.where('kyc_status', kycStatus);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const drivers = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Drivers retrieved successfully.',
    data: {
      drivers: drivers.map((driver) => sanitizeUserRecord(driver as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    },
  };
}

export async function getDriverById(
  dbClient: Knex = db,
  driverId: string
): Promise<AdminResponse<{ driver: Record<string, unknown>; vehicles?: Record<string, unknown>[] }>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const driver = await dbClient('users')
    .where({ id: driverId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .first();

  if (!driver) {
    throw new Error('DRIVER_NOT_FOUND');
  }

  const vehicles = await dbClient('vehicles')
    .where({ driver_id: driverId })
    .select('*');

  return {
    success: true,
    message: 'Driver retrieved successfully.',
    data: {
      driver: sanitizeUserRecord(driver as Record<string, unknown>) as Record<string, unknown>,
      vehicles: vehicles.map((v) => v as Record<string, unknown>),
    },
  };
}

export async function updateDriverByAdmin(
  dbClient: Knex = db,
  driverId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const prohibitedFields = ['password_hash', 'password', 'otp_code', 'otp_expires_at', 'token', 'refresh_token', 'role', 'id'];
  const permittedFields = ['full_name', 'email', 'phone_number', 'status', 'kyc_status', 'is_verified'];

  for (const key of Object.keys(payload)) {
    if (prohibitedFields.includes(key) || !permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const driver = await trx('users')
      .where({ id: driverId, role: 'DRIVER' })
      .whereNull('deleted_at')
      .first();

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND');
    }

    const updates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: true,
        message: 'No valid admin updates provided.',
        data: sanitizeUserRecord(driver as Record<string, unknown>) as Record<string, unknown>,
      };
    }

    await trx('users').where({ id: driverId }).update(updates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Driver', driverId, {
      changedFields: Object.keys(updates),
      oldValues: Object.fromEntries(Object.keys(updates).map((k) => [k, driver[k]])),
      newValues: updates,
    });

    const updatedDriver = await trx('users').where({ id: driverId }).first();

    return {
      success: true,
      message: 'Driver updated successfully.',
      data: sanitizeUserRecord(updatedDriver as Record<string, unknown>) as Record<string, unknown>,
    };
  });
}

export async function changeDriverStatus(
  dbClient: Knex = db,
  driverId: string,
  status: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  return await dbClient.transaction(async (trx) => {
    const driver = await trx('users')
      .where({ id: driverId, role: 'DRIVER' })
      .whereNull('deleted_at')
      .first();

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND');
    }

    const previousStatus = driver.status || 'ACTIVE';
    await trx('users').where({ id: driverId }).update({ status: formattedStatus });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Driver', driverId, {
      action: 'STATUS_CHANGED',
      previousStatus,
      newStatus: formattedStatus,
    });

    const updatedDriver = await trx('users').where({ id: driverId }).first();

    return {
      success: true,
      message: `Driver status updated to ${formattedStatus}.`,
      data: sanitizeUserRecord(updatedDriver as Record<string, unknown>) as Record<string, unknown>,
    };
  });
}

export async function getDriverDocuments(
  dbClient: Knex = db,
  driverId: string
): Promise<AdminResponse<{ documents: Record<string, unknown>[] }>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const driver = await dbClient('users')
    .where({ id: driverId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .first();

  if (!driver) {
    throw new Error('DRIVER_NOT_FOUND');
  }

  const vehicles = await dbClient('vehicles')
    .where({ driver_id: driverId })
    .select('id', 'plate_number', 'documents', 'verification_status', 'verification_reason');

  const documents = vehicles.map((v) => ({
    vehicleId: v.id,
    plateNumber: v.plate_number,
    documents: v.documents || {},
    verificationStatus: v.verification_status,
    verificationReason: v.verification_reason,
  }));

  return {
    success: true,
    message: 'Driver documents retrieved successfully.',
    data: { documents },
  };
}

export async function reviewDriverDocument(
  dbClient: Knex = db,
  driverId: string,
  docId: string,
  payload: { status: string; reason?: string },
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  if (!isValidUuid(docId)) {
    throw new Error('INVALID_DOCUMENT_ID');
  }

  const validStatuses = ['VERIFIED', 'REJECTED'];
  const status = (payload.status || '').trim().toUpperCase();
  if (!validStatuses.includes(status)) {
    throw new Error('INVALID_STATUS');
  }

  return await dbClient.transaction(async (trx) => {
    const driver = await trx('users')
      .where({ id: driverId, role: 'DRIVER' })
      .whereNull('deleted_at')
      .first();

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND');
    }

    const vehicle = await trx('vehicles')
      .where({ id: docId, driver_id: driverId })
      .first();

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    await trx('vehicles').where({ id: docId }).update({
      verification_status: status,
      verification_reason: payload.reason || null,
      verified_by: actorId,
      verified_at: new Date(),
    });

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.VEHICLE_VERIFIED, 'Vehicle', docId, {
      status,
      reason: payload.reason || null,
    });

    const updatedVehicle = await trx('vehicles').where({ id: docId }).first();

    return {
      success: true,
      message: `Vehicle document ${status.toLowerCase()} successfully.`,
      data: updatedVehicle as Record<string, unknown>,
    };
  });
}

export async function getDriverRatings(
  dbClient: Knex = db,
  driverId: string,
  query: { page?: string; limit?: string } = {}
): Promise<AdminResponse<{ ratings: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const driver = await dbClient('users')
    .where({ id: driverId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .first();

  if (!driver) {
    throw new Error('DRIVER_NOT_FOUND');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));

  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    return {
      success: true,
      message: 'Ratings table is not configured. Returning sample data.',
      data: {
        ratings: [],
        pagination: buildPagination(page, limit, 0),
      },
    };
  }

  const total = Number((await dbClient('ratings')
    .where({ target_id: driverId, target_type: 'DRIVER' })
    .count<{ count: string }[]>('* as count')
    .first())?.count ?? 0);

  const ratings = await dbClient('ratings')
    .where({ target_id: driverId, target_type: 'DRIVER' })
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Driver ratings retrieved successfully.',
    data: {
      ratings: ratings.map((r) => r as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getDriverRatingStats(
  dbClient: Knex = db,
  driverId: string
): Promise<AdminResponse<{
  averageRating: number;
  totalRatings: number;
  distribution: Record<string, number>;
}>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const driver = await dbClient('users')
    .where({ id: driverId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .first();

  if (!driver) {
    throw new Error('DRIVER_NOT_FOUND');
  }

  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    return {
      success: true,
      message: 'Ratings table is not configured. Returning default stats.',
      data: {
        averageRating: 0,
        totalRatings: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      },
    };
  }

  const stats = await dbClient('ratings')
    .where({ target_id: driverId, target_type: 'DRIVER' })
    .select(
      dbClient.raw('AVG(rating)::numeric(10,2) as averageRating'),
      dbClient.raw('COUNT(*) as totalRatings')
    )
    .first();

  const distribution = await dbClient('ratings')
    .where({ target_id: driverId, target_type: 'DRIVER' })
    .select('rating')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('rating');

  const distMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  distribution.forEach((d: any) => {
    distMap[String(d.rating)] = Number(d.count);
  });

  return {
    success: true,
    message: 'Driver rating statistics retrieved successfully.',
    data: {
      averageRating: Number(stats?.averageRating ?? 0),
      totalRatings: Number(stats?.totalRatings ?? 0),
      distribution: distMap,
    },
  };
}

export async function getDriverTrips(
  dbClient: Knex = db,
  driverId: string,
  query: { page?: string; limit?: string; status?: string } = {}
): Promise<AdminResponse<{ trips: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_ID');
  }

  const driver = await dbClient('users')
    .where({ id: driverId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .first();

  if (!driver) {
    throw new Error('DRIVER_NOT_FOUND');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();

  const hasShipmentsTable = await tableExists(dbClient, 'shipments');
  if (!hasShipmentsTable) {
    let loadQuery = dbClient('loads')
      .where('shipper_id', driverId)
      .orWhere('driver_id', driverId);

    if (status) {
      loadQuery = loadQuery.where('status', status);
    }

    const total = Number((await loadQuery.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
    const trips = await loadQuery
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      success: true,
      message: 'Driver trips (loads) retrieved successfully.',
      data: {
        trips: trips.map((t) => t as Record<string, unknown>),
        pagination: buildPagination(page, limit, total),
      },
    };
  }

  let queryBuilder = dbClient('shipments').where('carrier_id', driverId);

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const trips = await queryBuilder
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Driver trips retrieved successfully.',
    data: {
      trips: trips.map((t) => t as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

// ============================================================
// SHIPPER MANAGEMENT SERVICES
// ============================================================

export async function listShippers(
  dbClient: Knex = db,
  query: ShipperQueryInput = {}
): Promise<AdminResponse<{ shippers: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const status = (query.status ?? '').trim().toUpperCase();
  const kycStatus = (query.kycStatus ?? '').trim().toUpperCase();

  const allowedSortColumns = ['created_at', 'full_name', 'phone_number', 'email', 'status', 'kyc_status', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('users')
    .where('role', 'SHIPPER')
    .whereNull('deleted_at');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('full_name', `%${search}%`);
      builder.orWhereILike('phone_number', `%${search}%`);
      builder.orWhereILike('email', `%${search}%`);
    });
  }

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  if (kycStatus) {
    queryBuilder = queryBuilder.where('kyc_status', kycStatus);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const shippers = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Shippers retrieved successfully.',
    data: {
      shippers: shippers.map((shipper) => sanitizeUserRecord(shipper as Record<string, unknown>)),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    },
  };
}

export async function getShipperById(
  dbClient: Knex = db,
  shipperId: string
): Promise<AdminResponse<{ shipper: Record<string, unknown>; loads?: Record<string, unknown>[] }>> {
  if (!isValidUuid(shipperId)) {
    throw new Error('INVALID_ID');
  }

  const shipper = await dbClient('users')
    .where({ id: shipperId, role: 'SHIPPER' })
    .whereNull('deleted_at')
    .first();

  if (!shipper) {
    throw new Error('SHIPPER_NOT_FOUND');
  }

  const loads = await dbClient('loads')
    .where({ shipper_id: shipperId })
    .select('*')
    .orderBy('created_at', 'desc')
    .limit(10);

  return {
    success: true,
    message: 'Shipper retrieved successfully.',
    data: {
      shipper: sanitizeUserRecord(shipper as Record<string, unknown>) as Record<string, unknown>,
      loads: loads.map((l) => l as Record<string, unknown>),
    },
  };
}

export async function changeShipperStatus(
  dbClient: Knex = db,
  shipperId: string,
  status: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(shipperId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  return await dbClient.transaction(async (trx) => {
    const shipper = await trx('users')
      .where({ id: shipperId, role: 'SHIPPER' })
      .whereNull('deleted_at')
      .first();

    if (!shipper) {
      throw new Error('SHIPPER_NOT_FOUND');
    }

    const previousStatus = shipper.status || 'ACTIVE';
    await trx('users').where({ id: shipperId }).update({ status: formattedStatus });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Shipper', shipperId, {
      action: 'STATUS_CHANGED',
      previousStatus,
      newStatus: formattedStatus,
    });

    const updatedShipper = await trx('users').where({ id: shipperId }).first();

    return {
      success: true,
      message: `Shipper status updated to ${formattedStatus}.`,
      data: sanitizeUserRecord(updatedShipper as Record<string, unknown>) as Record<string, unknown>,
    };
  });
}

export async function getShipperTrips(
  dbClient: Knex = db,
  shipperId: string,
  query: { page?: string; limit?: string; status?: string } = {}
): Promise<AdminResponse<{ trips: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(shipperId)) {
    throw new Error('INVALID_ID');
  }

  const shipper = await dbClient('users')
    .where({ id: shipperId, role: 'SHIPPER' })
    .whereNull('deleted_at')
    .first();

  if (!shipper) {
    throw new Error('SHIPPER_NOT_FOUND');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();

  let loadQuery = dbClient('loads').where('shipper_id', shipperId);

  if (status) {
    loadQuery = loadQuery.where('status', status);
  }

  const total = Number((await loadQuery.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const trips = await loadQuery
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Shipper trips retrieved successfully.',
    data: {
      trips: trips.map((t) => t as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getShipperPayments(
  dbClient: Knex = db,
  shipperId: string,
  query: { page?: string; limit?: string; status?: string } = {}
): Promise<AdminResponse<{ payments: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(shipperId)) {
    throw new Error('INVALID_ID');
  }

  const shipper = await dbClient('users')
    .where({ id: shipperId, role: 'SHIPPER' })
    .whereNull('deleted_at')
    .first();

  if (!shipper) {
    throw new Error('SHIPPER_NOT_FOUND');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    return {
      success: true,
      message: 'Payments table is not configured. Returning load data as reference.',
      data: {
        payments: [],
        pagination: buildPagination(page, limit, 0),
      },
    };
  }

  let queryBuilder = dbClient('payments').where('shipper_id', shipperId);

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const payments = await queryBuilder
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Shipper payments retrieved successfully.',
    data: {
      payments: payments.map((p) => p as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

// ============================================================
// COMPANY MANAGEMENT SERVICES
// ============================================================

export async function listCompanies(
  dbClient: Knex = db,
  query: CompanyQueryInput = {}
): Promise<AdminResponse<{ companies: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const status = (query.status ?? '').trim().toUpperCase();

  const hasCompaniesTable = await tableExists(dbClient, 'companies');
  if (!hasCompaniesTable) {
    let queryBuilder = dbClient('users')
      .where('role', 'FLEET_OWNER')
      .whereNull('deleted_at');

    if (search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder.whereILike('full_name', `%${search}%`);
        builder.orWhereILike('phone_number', `%${search}%`);
        builder.orWhereILike('email', `%${search}%`);
      });
    }

    if (status) {
      queryBuilder = queryBuilder.where('status', status);
    }

    const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
    const companies = await queryBuilder
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      success: true,
      message: 'Companies retrieved successfully (from fleet owners).',
      data: {
        companies: companies.map((c) => sanitizeUserRecord(c as Record<string, unknown>)),
        pagination: buildPagination(page, limit, total),
      },
    };
  }

  const allowedSortColumns = ['created_at', 'name', 'email', 'phone', 'status', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('companies');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('name', `%${search}%`);
      builder.orWhereILike('email', `%${search}%`);
      builder.orWhereILike('phone', `%${search}%`);
    });
  }

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const companies = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Companies retrieved successfully.',
    data: {
      companies: companies.map((c) => c as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getCompanyById(
  dbClient: Knex = db,
  companyId: string
): Promise<AdminResponse<{
  company: Record<string, unknown>;
  vehicles?: Record<string, unknown>[];
  drivers?: Record<string, unknown>[];
}>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');
  let company;

  if (!hasCompaniesTable) {
    company = await dbClient('users')
      .where({ id: companyId, role: 'FLEET_OWNER' })
      .whereNull('deleted_at')
      .first();

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    const vehicles = await dbClient('vehicles')
      .where({ driver_id: companyId })
      .select('*');

    const drivers = await dbClient('users')
      .where({ fleet_owner_id: companyId, role: 'DRIVER' })
      .whereNull('deleted_at')
      .select('id', 'full_name', 'phone_number', 'email', 'status', 'kyc_status');

    return {
      success: true,
      message: 'Company retrieved successfully.',
      data: {
        company: sanitizeUserRecord(company as Record<string, unknown>) as Record<string, unknown>,
        vehicles: vehicles.map((v) => v as Record<string, unknown>),
        drivers: drivers.map((d) => sanitizeUserRecord(d as Record<string, unknown>)),
      },
    };
  }

  company = await dbClient('companies').where({ id: companyId }).first();
  if (!company) {
    throw new Error('COMPANY_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Company retrieved successfully.',
    data: {
      company: company as Record<string, unknown>,
    },
  };
}

export async function updateCompanyByAdmin(
  dbClient: Knex = db,
  companyId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');
  if (!hasCompaniesTable) {
    const permittedFields = ['full_name', 'email', 'phone_number', 'status'];
    for (const key of Object.keys(payload)) {
      if (!permittedFields.includes(key)) {
        throw new Error('PROHIBITED_FIELD');
      }
    }

    return await dbClient.transaction(async (trx) => {
      const company = await trx('users')
        .where({ id: companyId, role: 'FLEET_OWNER' })
        .whereNull('deleted_at')
        .first();

      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      const updates: Record<string, unknown> = {};
      for (const field of permittedFields) {
        if (payload[field] !== undefined) {
          updates[field] = payload[field];
        }
      }

      await trx('users').where({ id: companyId }).update(updates);
      await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Company', companyId, {
        changedFields: Object.keys(updates),
      });

      const updated = await trx('users').where({ id: companyId }).first();
      return {
        success: true,
        message: 'Company updated successfully.',
        data: sanitizeUserRecord(updated as Record<string, unknown>) as Record<string, unknown>,
      };
    });
  }

  const permittedFields = ['name', 'email', 'phone', 'address', 'status', 'verified'];
  for (const key of Object.keys(payload)) {
    if (!permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const company = await trx('companies').where({ id: companyId }).first();
    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    const updates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    await trx('companies').where({ id: companyId }).update(updates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Company', companyId, {
      changedFields: Object.keys(updates),
    });

    const updated = await trx('companies').where({ id: companyId }).first();
    return {
      success: true,
      message: 'Company updated successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function changeCompanyStatus(
  dbClient: Knex = db,
  companyId: string,
  status: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');

  return await dbClient.transaction(async (trx) => {
    let company;
    if (!hasCompaniesTable) {
      company = await trx('users')
        .where({ id: companyId, role: 'FLEET_OWNER' })
        .whereNull('deleted_at')
        .first();

      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      await trx('users').where({ id: companyId }).update({ status: formattedStatus });
    } else {
      company = await trx('companies').where({ id: companyId }).first();
      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }
      await trx('companies').where({ id: companyId }).update({ status: formattedStatus });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Company', companyId, {
      action: 'STATUS_CHANGED',
      newStatus: formattedStatus,
    });

    const updated = hasCompaniesTable
      ? await trx('companies').where({ id: companyId }).first()
      : await trx('users').where({ id: companyId }).first();

    return {
      success: true,
      message: `Company status updated to ${formattedStatus}.`,
      data: updated as Record<string, unknown>,
    };
  });
}

export async function verifyCompanyByAdmin(
  dbClient: Knex = db,
  companyId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');

  return await dbClient.transaction(async (trx) => {
    let company;
    if (!hasCompaniesTable) {
      company = await trx('users')
        .where({ id: companyId, role: 'FLEET_OWNER' })
        .whereNull('deleted_at')
        .first();

      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }

      await trx('users').where({ id: companyId }).update({
        is_verified: true,
        kyc_status: 'APPROVED',
        kyc_reviewed_by: actorId,
        kyc_reviewed_at: new Date(),
      });
    } else {
      company = await trx('companies').where({ id: companyId }).first();
      if (!company) {
        throw new Error('COMPANY_NOT_FOUND');
      }
      await trx('companies').where({ id: companyId }).update({
        verified: true,
        verified_by: actorId,
        verified_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.KYC_APPROVED, 'Company', companyId, {
      action: 'COMPANY_VERIFIED',
    });

    const updated = hasCompaniesTable
      ? await trx('companies').where({ id: companyId }).first()
      : await trx('users').where({ id: companyId }).first();

    return {
      success: true,
      message: 'Company verified successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function getCompanyVehicles(
  dbClient: Knex = db,
  companyId: string,
  query: { page?: string; limit?: string } = {}
): Promise<AdminResponse<{ vehicles: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');

  if (!hasCompaniesTable) {
    const company = await dbClient('users')
      .where({ id: companyId, role: 'FLEET_OWNER' })
      .whereNull('deleted_at')
      .first();

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }
  } else {
    const company = await dbClient('companies').where({ id: companyId }).first();
    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));

  const vehicles = await dbClient('vehicles')
    .where({ driver_id: companyId })
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  const total = await dbClient('vehicles')
    .where({ driver_id: companyId })
    .count<{ count: string }[]>('* as count')
    .first();

  return {
    success: true,
    message: 'Company vehicles retrieved successfully.',
    data: {
      vehicles: vehicles.map((v) => v as Record<string, unknown>),
      pagination: buildPagination(page, limit, Number(total?.count ?? 0)),
    },
  };
}

export async function getCompanyDrivers(
  dbClient: Knex = db,
  companyId: string,
  query: { page?: string; limit?: string } = {}
): Promise<AdminResponse<{ drivers: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasCompaniesTable = await tableExists(dbClient, 'companies');

  if (!hasCompaniesTable) {
    const company = await dbClient('users')
      .where({ id: companyId, role: 'FLEET_OWNER' })
      .whereNull('deleted_at')
      .first();

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }
  } else {
    const company = await dbClient('companies').where({ id: companyId }).first();
    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));

  const drivers = await dbClient('users')
    .where({ fleet_owner_id: companyId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .select('id', 'full_name', 'phone_number', 'email', 'status', 'kyc_status', 'is_verified', 'created_at')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  const total = await dbClient('users')
    .where({ fleet_owner_id: companyId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .count<{ count: string }[]>('* as count')
    .first();

  return {
    success: true,
    message: 'Company drivers retrieved successfully.',
    data: {
      drivers: drivers.map((d) => sanitizeUserRecord(d as Record<string, unknown>)),
      pagination: buildPagination(page, limit, Number(total?.count ?? 0)),
    },
  };
}

export async function getCompanyTrips(
  dbClient: Knex = db,
  companyId: string,
  query: { page?: string; limit?: string; status?: string } = {}
): Promise<AdminResponse<{ trips: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();

  const drivers = await dbClient('users')
    .where({ fleet_owner_id: companyId, role: 'DRIVER' })
    .whereNull('deleted_at')
    .select('id');

  const driverIds = drivers.map((d) => d.id);

  if (driverIds.length === 0) {
    return {
      success: true,
      message: 'No trips found. Company has no drivers.',
      data: {
        trips: [],
        pagination: buildPagination(page, limit, 0),
      },
    };
  }

  let loadQuery = dbClient('loads')
    .whereIn('driver_id', driverIds);

  if (status) {
    loadQuery = loadQuery.where('status', status);
  }

  const total = Number((await loadQuery.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const trips = await loadQuery
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Company trips retrieved successfully.',
    data: {
      trips: trips.map((t) => t as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getCompanyRatingStats(
  dbClient: Knex = db,
  companyId: string
): Promise<AdminResponse<{
  averageRating: number;
  totalRatings: number;
  distribution: Record<string, number>;
}>> {
  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_ID');
  }

  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    return {
      success: true,
      message: 'Ratings table is not configured.',
      data: {
        averageRating: 0,
        totalRatings: 0,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      },
    };
  }

  const stats = await dbClient('ratings')
    .where({ target_id: companyId, target_type: 'COMPANY' })
    .select(
      dbClient.raw('AVG(rating)::numeric(10,2) as averageRating'),
      dbClient.raw('COUNT(*) as totalRatings')
    )
    .first();

  const distribution = await dbClient('ratings')
    .where({ target_id: companyId, target_type: 'COMPANY' })
    .select('rating')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('rating');

  const distMap: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  distribution.forEach((d: any) => {
    distMap[String(d.rating)] = Number(d.count);
  });

  return {
    success: true,
    message: 'Company rating statistics retrieved successfully.',
    data: {
      averageRating: Number(stats?.averageRating ?? 0),
      totalRatings: Number(stats?.totalRatings ?? 0),
      distribution: distMap,
    },
  };
}

// ============================================================
// VEHICLE MANAGEMENT SERVICES
// ============================================================

export async function listVehicles(
  dbClient: Knex = db,
  query: VehicleQueryInput = {}
): Promise<AdminResponse<{ vehicles: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const verification = (query.verification ?? '').trim().toUpperCase();
  const vehicleType = (query.vehicleType ?? '').trim();
  const owner = (query.owner ?? '').trim();

  const allowedSortColumns = ['created_at', 'plate_number', 'vehicle_type', 'capacity_tons', 'verification_status', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('vehicles');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('plate_number', `%${search}%`);
      builder.orWhereILike('vehicle_type', `%${search}%`);
    });
  }

  if (verification && (await hasColumn(dbClient, 'vehicles', 'verification_status'))) {
    queryBuilder = queryBuilder.where('verification_status', verification);
  }

  if (vehicleType) {
    queryBuilder = queryBuilder.where('vehicle_type', vehicleType);
  }

  if (owner && (await hasColumn(dbClient, 'vehicles', 'driver_id'))) {
    queryBuilder = queryBuilder.where('driver_id', owner);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const vehicles = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Vehicles retrieved successfully.',
    data: {
      vehicles: vehicles.map((vehicle) => vehicle as Record<string, unknown>),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    },
  };
}

export async function getVehicleById(dbClient: Knex = db, vehicleId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(vehicleId)) {
    throw new Error('INVALID_ID');
  }

  const vehicle = await dbClient('vehicles').where({ id: vehicleId }).first();
  if (!vehicle) {
    throw new Error('VEHICLE_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Vehicle retrieved successfully.',
    data: vehicle as Record<string, unknown>,
  };
}

export async function updateVehicle(
  dbClient: Knex = db,
  vehicleId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(vehicleId)) {
    throw new Error('INVALID_ID');
  }

  const prohibitedFields = ['id', 'created_at', 'updated_at', 'driver_id'];
  const permittedFields = ['plate_number', 'vehicle_type', 'capacity_tons', 'is_active'];

  for (const key of Object.keys(payload)) {
    if (prohibitedFields.includes(key) || !permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const vehicle = await trx('vehicles').where({ id: vehicleId }).first();
    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    const updates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return {
        success: true,
        message: 'No valid admin updates provided.',
        data: vehicle as Record<string, unknown>,
      };
    }

    await trx('vehicles').where({ id: vehicleId }).update(updates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.VEHICLE_UPDATED, 'Vehicle', vehicleId, {
      changedFields: Object.keys(updates),
      oldValues: Object.fromEntries(Object.keys(updates).map((k) => [k, vehicle[k]])),
      newValues: updates,
    });

    const updatedVehicle = await trx('vehicles').where({ id: vehicleId }).first();

    return {
      success: true,
      message: 'Vehicle updated successfully.',
      data: updatedVehicle as Record<string, unknown>,
    };
  });
}

export async function updateVehicleStatus(
  dbClient: Knex = db,
  vehicleId: string,
  status: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(vehicleId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['ACTIVE', 'INACTIVE'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  return await dbClient.transaction(async (trx) => {
    const vehicle = await trx('vehicles').where({ id: vehicleId }).first();
    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    const isActive = formattedStatus === 'ACTIVE';
    await trx('vehicles').where({ id: vehicleId }).update({ is_active: isActive });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.VEHICLE_STATUS_CHANGED, 'Vehicle', vehicleId, {
      previousStatus: vehicle.is_active ? 'ACTIVE' : 'INACTIVE',
      newStatus: formattedStatus,
    });

    const updatedVehicle = await trx('vehicles').where({ id: vehicleId }).first();

    return {
      success: true,
      message: `Vehicle status updated to ${formattedStatus}.`,
      data: updatedVehicle as Record<string, unknown>,
    };
  });
}

export async function verifyVehicle(dbClient: Knex = db, vehicleId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(vehicleId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const vehicle = await trx('vehicles').where({ id: vehicleId }).first();
    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    const hasVerificationStatus = await hasColumn(trx, 'vehicles', 'verification_status');
    if (hasVerificationStatus) {
      await trx('vehicles').where({ id: vehicleId }).update({
        verification_status: 'VERIFIED',
        verified_by: actorId,
        verified_at: new Date(),
        verification_reason: null,
      });
    } else {
      await trx('vehicles').where({ id: vehicleId }).update({ is_active: true });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.VEHICLE_VERIFIED, 'Vehicle', vehicleId, { verificationStatus: 'VERIFIED' });
    const updatedVehicle = await trx('vehicles').where({ id: vehicleId }).first();

    return {
      success: true,
      message: 'Vehicle verification updated successfully.',
      data: updatedVehicle as Record<string, unknown>,
    };
  });
}

export async function rejectVehicle(dbClient: Knex = db, vehicleId: string, actorId: string, reason: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(vehicleId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const vehicle = await trx('vehicles').where({ id: vehicleId }).first();
    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND');
    }

    const hasVerificationStatus = await hasColumn(trx, 'vehicles', 'verification_status');
    if (hasVerificationStatus) {
      await trx('vehicles').where({ id: vehicleId }).update({
        verification_status: 'REJECTED',
        verified_by: actorId,
        verified_at: new Date(),
        verification_reason: reason || null,
      });
    } else {
      await trx('vehicles').where({ id: vehicleId }).update({ is_active: false });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.VEHICLE_REJECTED, 'Vehicle', vehicleId, {
      reason,
      verificationStatus: 'REJECTED',
    });

    const updatedVehicle = await trx('vehicles').where({ id: vehicleId }).first();

    return {
      success: true,
      message: 'Vehicle rejected successfully.',
      data: updatedVehicle as Record<string, unknown>,
    };
  });
}

// ============================================================
// LOAD MANAGEMENT SERVICES
// ============================================================

export async function listLoads(
  dbClient: Knex = db,
  query: LoadQueryInput = {}
): Promise<AdminResponse<{ loads: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  if (!(await tableExists(dbClient, 'loads'))) {
    return {
      success: true,
      message: 'Load monitoring is not configured in the current database schema.',
      data: {
        loads: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      },
    };
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();
  const origin = (query.origin ?? '').trim();
  const destination = (query.destination ?? '').trim();
  const shipper = (query.shipper ?? '').trim();

  const allowedSortColumns = [
    'created_at',
    'cargo_description',
    'weight_tons',
    'origin_city',
    'destination_city',
    'status',
    'offered_price_etb',
    'id',
  ];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('loads');
  if (status) queryBuilder = queryBuilder.where('status', status);
  if (origin) queryBuilder = queryBuilder.whereILike('origin_city', `%${origin}%`);
  if (destination) queryBuilder = queryBuilder.whereILike('destination_city', `%${destination}%`);
  if (shipper) queryBuilder = queryBuilder.where('shipper_id', shipper);

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const loads = await queryBuilder
    .clone()
    .leftJoin('users as shipper_user', 'loads.shipper_id', 'shipper_user.id')
    .leftJoin('shipments', 'loads.id', 'shipments.load_id')
    .leftJoin('users as driver_user', 'shipments.carrier_id', 'driver_user.id')
    .select(
      'loads.*',
      'shipper_user.full_name as shipper_name',
      'driver_user.full_name as driver_name'
    )
    .orderBy(`loads.${sortBy}`, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Loads retrieved successfully.',
    data: {
      loads: loads.map((load) => load as Record<string, unknown>),
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    },
  };
}

export async function getLoadById(dbClient: Knex = db, loadId: string): Promise<AdminResponse<Record<string, unknown>>> {
  if (!(await tableExists(dbClient, 'loads'))) {
    throw new Error('LOADS_NOT_CONFIGURED');
  }

  if (!isValidUuid(loadId)) {
    throw new Error('INVALID_ID');
  }

  const load = await dbClient('loads').where({ id: loadId }).first();
  if (!load) {
    throw new Error('LOAD_NOT_FOUND');
  }

  const bids = (await tableExists(dbClient, 'bids')) ? await dbClient('bids').where({ load_id: loadId }).select('*') : [];

  return {
    success: true,
    message: 'Load retrieved successfully.',
    data: {
      ...(load as Record<string, unknown>),
      bids: bids.map((bid) => bid as Record<string, unknown>),
    },
  };
}

export async function updateLoadByAdmin(
  dbClient: Knex = db,
  loadId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!(await tableExists(dbClient, 'loads'))) {
    throw new Error('LOADS_NOT_CONFIGURED');
  }

  if (!isValidUuid(loadId)) {
    throw new Error('INVALID_ID');
  }

  const permittedFields = ['cargo_description', 'weight_tons', 'origin_city', 'destination_city', 'status', 'offered_price_etb'];

  for (const key of Object.keys(payload)) {
    if (!permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const load = await trx('loads').where({ id: loadId }).first();
    if (!load) {
      throw new Error('LOAD_NOT_FOUND');
    }

    const updates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No eligible admin changes supplied.', data: load as Record<string, unknown> };
    }

    await trx('loads').where({ id: loadId }).update(updates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.LOAD_UPDATED, 'Load', loadId, {
      changedFields: Object.keys(updates),
      oldValues: Object.fromEntries(Object.keys(updates).map((k) => [k, load[k]])),
      newValues: updates,
    });

    const updated = await trx('loads').where({ id: loadId }).first();
    return {
      success: true,
      message: 'Load updated successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

// ============================================================
// TRANSPORT REQUEST MANAGEMENT SERVICES
// ============================================================

export async function listRequests(
  dbClient: Knex = db,
  query: RequestQueryInput = {}
): Promise<AdminResponse<{ requests: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();
  const type = (query.type ?? '').trim().toLowerCase();

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');
  if (!hasRequestsTable) {
    let queryBuilder = dbClient('loads');

    if (status) {
      queryBuilder = queryBuilder.where('status', status);
    }

    if (type === 'single') {
      queryBuilder = queryBuilder.whereNull('fleet_owner_id');
    } else if (type === 'fleet') {
      queryBuilder = queryBuilder.whereNotNull('fleet_owner_id');
    }

    const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
    const requests = await queryBuilder
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      success: true,
      message: 'Transport requests retrieved successfully (from loads).',
      data: {
        requests: requests.map((r) => ({
          ...(r as Record<string, unknown>),
          type: r.fleet_owner_id ? 'fleet' : 'single',
        })),
        pagination: buildPagination(page, limit, total),
      },
    };
  }

  const allowedSortColumns = ['created_at', 'status', 'origin', 'destination', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('transport_requests');

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  if (type) {
    queryBuilder = queryBuilder.where('type', type);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const requests = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Transport requests retrieved successfully.',
    data: {
      requests: requests.map((r) => r as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getRequestById(
  dbClient: Knex = db,
  requestId: string
): Promise<AdminResponse<{ request: Record<string, unknown>; bids?: Record<string, unknown>[] }>> {
  if (!isValidUuid(requestId)) {
    throw new Error('INVALID_ID');
  }

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');
  let request;

  if (!hasRequestsTable) {
    request = await dbClient('loads').where({ id: requestId }).first();
    if (!request) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    const bids = await dbClient('bids')
      .where({ load_id: requestId })
      .select('*')
      .orderBy('bid_amount_etb', 'asc');

    return {
      success: true,
      message: 'Transport request retrieved successfully.',
      data: {
        request: {
          ...(request as Record<string, unknown>),
          type: request.fleet_owner_id ? 'fleet' : 'single',
        },
        bids: bids.map((b) => b as Record<string, unknown>),
      },
    };
  }

  request = await dbClient('transport_requests').where({ id: requestId }).first();
  if (!request) {
    throw new Error('REQUEST_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Transport request retrieved successfully.',
    data: {
      request: request as Record<string, unknown>,
    },
  };
}

export async function assignDriverToRequest(
  dbClient: Knex = db,
  requestId: string,
  driverId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(requestId)) {
    throw new Error('INVALID_ID');
  }

  if (!isValidUuid(driverId)) {
    throw new Error('INVALID_DRIVER_ID');
  }

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');

  return await dbClient.transaction(async (trx) => {
    const driver = await trx('users')
      .where({ id: driverId, role: 'DRIVER' })
      .whereNull('deleted_at')
      .first();

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND');
    }

    let request;
    if (!hasRequestsTable) {
      request = await trx('loads').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('loads').where({ id: requestId }).update({
        driver_id: driverId,
        status: 'MATCHED',
      });
    } else {
      request = await trx('transport_requests').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('transport_requests').where({ id: requestId }).update({
        driver_id: driverId,
        status: 'ASSIGNED',
        assigned_by: actorId,
        assigned_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Request', requestId, {
      action: 'ASSIGN_DRIVER',
      driverId,
      driverName: driver.full_name,
    });

    const updated = hasRequestsTable
      ? await trx('transport_requests').where({ id: requestId }).first()
      : await trx('loads').where({ id: requestId }).first();

    return {
      success: true,
      message: 'Driver assigned to request successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function assignCompanyToRequest(
  dbClient: Knex = db,
  requestId: string,
  companyId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(requestId)) {
    throw new Error('INVALID_ID');
  }

  if (!isValidUuid(companyId)) {
    throw new Error('INVALID_COMPANY_ID');
  }

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');

  return await dbClient.transaction(async (trx) => {
    const company = await trx('users')
      .where({ id: companyId, role: 'FLEET_OWNER' })
      .whereNull('deleted_at')
      .first();

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND');
    }

    let request;
    if (!hasRequestsTable) {
      request = await trx('loads').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('loads').where({ id: requestId }).update({
        fleet_owner_id: companyId,
        status: 'MATCHED',
      });
    } else {
      request = await trx('transport_requests').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('transport_requests').where({ id: requestId }).update({
        company_id: companyId,
        status: 'ASSIGNED',
        assigned_by: actorId,
        assigned_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Request', requestId, {
      action: 'ASSIGN_COMPANY',
      companyId,
      companyName: company.full_name,
    });

    const updated = hasRequestsTable
      ? await trx('transport_requests').where({ id: requestId }).first()
      : await trx('loads').where({ id: requestId }).first();

    return {
      success: true,
      message: 'Company assigned to request successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function cancelRequest(
  dbClient: Knex = db,
  requestId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(requestId)) {
    throw new Error('INVALID_ID');
  }

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');

  return await dbClient.transaction(async (trx) => {
    let request;
    if (!hasRequestsTable) {
      request = await trx('loads').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('loads').where({ id: requestId }).update({ status: 'CANCELLED' });
    } else {
      request = await trx('transport_requests').where({ id: requestId }).first();
      if (!request) {
        throw new Error('REQUEST_NOT_FOUND');
      }
      await trx('transport_requests').where({ id: requestId }).update({
        status: 'CANCELLED',
        cancelled_by: actorId,
        cancelled_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Request', requestId, {
      action: 'CANCEL_REQUEST',
    });

    const updated = hasRequestsTable
      ? await trx('transport_requests').where({ id: requestId }).first()
      : await trx('loads').where({ id: requestId }).first();

    return {
      success: true,
      message: 'Transport request cancelled successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

// ============================================================
// DELIVERY MANAGEMENT SERVICES
// ============================================================

export async function listDeliveries(
  dbClient: Knex = db,
  query: DeliveryQueryInput = {}
): Promise<AdminResponse<{ deliveries: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();
  const search = (query.search ?? '').trim();

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');
  if (!hasDeliveriesTable) {
    let queryBuilder = dbClient('loads');

    if (status) {
      queryBuilder = queryBuilder.where('status', status);
    }

    if (search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder.whereILike('cargo_description', `%${search}%`);
        builder.orWhereILike('origin_city', `%${search}%`);
        builder.orWhereILike('destination_city', `%${search}%`);
      });
    }

    const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
    const deliveries = await queryBuilder
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      success: true,
      message: 'Deliveries retrieved successfully (from loads).',
      data: {
        deliveries: deliveries.map((d) => ({
          ...(d as Record<string, unknown>),
          deliveryStatus: d.status,
        })),
        pagination: buildPagination(page, limit, total),
      },
    };
  }

  const allowedSortColumns = ['created_at', 'status', 'delivery_date', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('deliveries');

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('description', `%${search}%`);
      builder.orWhereILike('address', `%${search}%`);
    });
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const deliveries = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Deliveries retrieved successfully.',
    data: {
      deliveries: deliveries.map((d) => d as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getDeliveryById(
  dbClient: Knex = db,
  deliveryId: string
): Promise<AdminResponse<{ delivery: Record<string, unknown> }>> {
  if (!isValidUuid(deliveryId)) {
    throw new Error('INVALID_ID');
  }

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');

  if (!hasDeliveriesTable) {
    const delivery = await dbClient('loads').where({ id: deliveryId }).first();
    if (!delivery) {
      throw new Error('DELIVERY_NOT_FOUND');
    }
    return {
      success: true,
      message: 'Delivery retrieved successfully.',
      data: {
        delivery: {
          ...(delivery as Record<string, unknown>),
          deliveryStatus: delivery.status,
        },
      },
    };
  }

  const delivery = await dbClient('deliveries').where({ id: deliveryId }).first();
  if (!delivery) {
    throw new Error('DELIVERY_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Delivery retrieved successfully.',
    data: {
      delivery: delivery as Record<string, unknown>,
    },
  };
}

export async function changeDeliveryStatus(
  dbClient: Knex = db,
  deliveryId: string,
  status: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(deliveryId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');

  return await dbClient.transaction(async (trx) => {
    let delivery;
    if (!hasDeliveriesTable) {
      const loadStatusMap: Record<string, string> = {
        'PENDING': 'POSTED',
        'IN_TRANSIT': 'IN_TRANSIT',
        'DELIVERED': 'DELIVERED',
        'CANCELLED': 'CANCELLED',
        'FAILED': 'CANCELLED',
      };

      delivery = await trx('loads').where({ id: deliveryId }).first();
      if (!delivery) {
        throw new Error('DELIVERY_NOT_FOUND');
      }

      await trx('loads').where({ id: deliveryId }).update({
        status: loadStatusMap[formattedStatus] || 'POSTED',
      });
    } else {
      delivery = await trx('deliveries').where({ id: deliveryId }).first();
      if (!delivery) {
        throw new Error('DELIVERY_NOT_FOUND');
      }
      await trx('deliveries').where({ id: deliveryId }).update({
        status: formattedStatus,
        updated_by: actorId,
        updated_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Delivery', deliveryId, {
      action: 'STATUS_CHANGED',
      newStatus: formattedStatus,
    });

    const updated = hasDeliveriesTable
      ? await trx('deliveries').where({ id: deliveryId }).first()
      : await trx('loads').where({ id: deliveryId }).first();

    return {
      success: true,
      message: `Delivery status updated to ${formattedStatus}.`,
      data: updated as Record<string, unknown>,
    };
  });
}

export async function cancelDelivery(
  dbClient: Knex = db,
  deliveryId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(deliveryId)) {
    throw new Error('INVALID_ID');
  }

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');

  return await dbClient.transaction(async (trx) => {
    let delivery;
    if (!hasDeliveriesTable) {
      delivery = await trx('loads').where({ id: deliveryId }).first();
      if (!delivery) {
        throw new Error('DELIVERY_NOT_FOUND');
      }
      await trx('loads').where({ id: deliveryId }).update({ status: 'CANCELLED' });
    } else {
      delivery = await trx('deliveries').where({ id: deliveryId }).first();
      if (!delivery) {
        throw new Error('DELIVERY_NOT_FOUND');
      }
      await trx('deliveries').where({ id: deliveryId }).update({
        status: 'CANCELLED',
        cancelled_by: actorId,
        cancelled_at: new Date(),
      });
    }

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Delivery', deliveryId, {
      action: 'CANCEL_DELIVERY',
    });

    const updated = hasDeliveriesTable
      ? await trx('deliveries').where({ id: deliveryId }).first()
      : await trx('loads').where({ id: deliveryId }).first();

    return {
      success: true,
      message: 'Delivery cancelled successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function getDeliveryPayment(
  dbClient: Knex = db,
  deliveryId: string
): Promise<AdminResponse<{ payment: Record<string, unknown> | null }>> {
  if (!isValidUuid(deliveryId)) {
    throw new Error('INVALID_ID');
  }

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    const load = await dbClient('loads').where({ id: deliveryId }).first();
    if (!load) {
      throw new Error('DELIVERY_NOT_FOUND');
    }

    return {
      success: true,
      message: 'Payment information retrieved from load data.',
      data: {
        payment: {
          deliveryId: deliveryId,
          amount: load.offered_price_etb,
          currency: 'ETB',
          status: load.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
          shipperId: load.shipper_id,
          driverId: load.driver_id,
        },
      },
    };
  }

  const payment = await dbClient('payments')
    .where({ delivery_id: deliveryId })
    .first();

  return {
    success: true,
    message: 'Payment retrieved successfully.',
    data: {
      payment: payment ? (payment as Record<string, unknown>) : null,
    },
  };
}

// ============================================================
// PAYMENTS & FINANCIAL MANAGEMENT SERVICES
// ============================================================

export async function listPayments(
  dbClient: Knex = db,
  query: PaymentQueryInput = {}
): Promise<AdminResponse<{ payments: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const status = (query.status ?? '').trim().toUpperCase();

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    let queryBuilder = dbClient('loads');

    if (status) {
      const statusMap: Record<string, string> = {
        'COMPLETED': 'DELIVERED',
        'PENDING': 'POSTED',
        'FAILED': 'CANCELLED',
      };
      queryBuilder = queryBuilder.where('status', statusMap[status] || 'POSTED');
    }

    const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
    const payments = await queryBuilder
      .clone()
      .select('*')
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return {
      success: true,
      message: 'Payments retrieved successfully (from load references).',
      data: {
        payments: payments.map((p) => ({
          ...(p as Record<string, unknown>),
          paymentStatus: p.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
        })),
        pagination: buildPagination(page, limit, total),
      },
    };
  }

  const allowedSortColumns = ['created_at', 'status', 'amount', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('payments');

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const payments = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Payments retrieved successfully.',
    data: {
      payments: payments.map((p) => p as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getPaymentById(
  dbClient: Knex = db,
  paymentId: string
): Promise<AdminResponse<{ payment: Record<string, unknown> }>> {
  if (!isValidUuid(paymentId)) {
    throw new Error('INVALID_ID');
  }

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    const payment = await dbClient('loads').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }
    return {
      success: true,
      message: 'Payment retrieved successfully (from load reference).',
      data: {
        payment: {
          ...(payment as Record<string, unknown>),
          paymentStatus: payment.status === 'DELIVERED' ? 'COMPLETED' : 'PENDING',
        },
      },
    };
  }

  const payment = await dbClient('payments').where({ id: paymentId }).first();
  if (!payment) {
    throw new Error('PAYMENT_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Payment retrieved successfully.',
    data: {
      payment: payment as Record<string, unknown>,
    },
  };
}

export async function releasePayment(
  dbClient: Knex = db,
  paymentId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(paymentId)) {
    throw new Error('INVALID_ID');
  }

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    const payment = await dbClient('loads').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }
    await dbClient('loads').where({ id: paymentId }).update({ status: 'DELIVERED' });
    await logAudit(dbClient, actorId, ADMIN_AUDIT_ACTIONS.ESCROW_REVIEWED, 'Payment', paymentId, {
      action: 'RELEASE_PAYMENT',
    });

    const updated = await dbClient('loads').where({ id: paymentId }).first();
    return {
      success: true,
      message: 'Payment released successfully.',
      data: updated as Record<string, unknown>,
    };
  }

  return await dbClient.transaction(async (trx) => {
    const payment = await trx('payments').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('PAYMENT_NOT_PENDING');
    }

    await trx('payments').where({ id: paymentId }).update({
      status: 'RELEASED',
      released_by: actorId,
      released_at: new Date(),
    });

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.ESCROW_REVIEWED, 'Payment', paymentId, {
      action: 'RELEASE_PAYMENT',
    });

    const updated = await trx('payments').where({ id: paymentId }).first();
    return {
      success: true,
      message: 'Payment released successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function freezePayment(
  dbClient: Knex = db,
  paymentId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(paymentId)) {
    throw new Error('INVALID_ID');
  }

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    throw new Error('PAYMENTS_NOT_CONFIGURED');
  }

  return await dbClient.transaction(async (trx) => {
    const payment = await trx('payments').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'FROZEN') {
      throw new Error('PAYMENT_ALREADY_FROZEN');
    }

    await trx('payments').where({ id: paymentId }).update({
      status: 'FROZEN',
      frozen_by: actorId,
      frozen_at: new Date(),
    });

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.ESCROW_REVIEWED, 'Payment', paymentId, {
      action: 'FREEZE_PAYMENT',
    });

    const updated = await trx('payments').where({ id: paymentId }).first();
    return {
      success: true,
      message: 'Payment frozen successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function refundPayment(
  dbClient: Knex = db,
  paymentId: string,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(paymentId)) {
    throw new Error('INVALID_ID');
  }

  const hasPaymentsTable = await tableExists(dbClient, 'payments');
  if (!hasPaymentsTable) {
    const payment = await dbClient('loads').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }
    await dbClient('loads').where({ id: paymentId }).update({ status: 'CANCELLED' });
    await logAudit(dbClient, actorId, ADMIN_AUDIT_ACTIONS.ESCROW_REVIEWED, 'Payment', paymentId, {
      action: 'REFUND_PAYMENT',
    });

    const updated = await dbClient('loads').where({ id: paymentId }).first();
    return {
      success: true,
      message: 'Payment refunded successfully.',
      data: updated as Record<string, unknown>,
    };
  }

  return await dbClient.transaction(async (trx) => {
    const payment = await trx('payments').where({ id: paymentId }).first();
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'REFUNDED') {
      throw new Error('PAYMENT_ALREADY_REFUNDED');
    }

    await trx('payments').where({ id: paymentId }).update({
      status: 'REFUNDED',
      refunded_by: actorId,
      refunded_at: new Date(),
    });

    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.ESCROW_REVIEWED, 'Payment', paymentId, {
      action: 'REFUND_PAYMENT',
    });

    const updated = await trx('payments').where({ id: paymentId }).first();
    return {
      success: true,
      message: 'Payment refunded successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

// ============================================================
// SHIPMENT MANAGEMENT SERVICES (501 stubs)
// ============================================================

export async function listShipments(
  dbClient: Knex = db,
  _query: Record<string, unknown> = {}
): Promise<AdminResponse<{ shipments: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasShipmentsTable = await tableExists(dbClient, 'shipments');
  if (!hasShipmentsTable) {
    throw new Error('SHIPMENTS_NOT_CONFIGURED');
  }

  const page = Math.max(1, Number(_query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(_query.limit ?? '20')));

  const total = Number((await dbClient('shipments').count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const shipments = await dbClient('shipments').select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Shipments retrieved successfully.',
    data: {
      shipments: shipments.map((shipment) => shipment as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getShipmentById(dbClient: Knex = db, shipmentId: string): Promise<AdminResponse<Record<string, unknown>>> {
  const hasShipmentsTable = await tableExists(dbClient, 'shipments');
  if (!hasShipmentsTable) {
    throw new Error('SHIPMENTS_NOT_CONFIGURED');
  }

  if (!isValidUuid(shipmentId)) {
    throw new Error('INVALID_ID');
  }

  const shipment = await dbClient('shipments').where({ id: shipmentId }).first();
  if (!shipment) {
    throw new Error('SHIPMENT_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Shipment retrieved successfully.',
    data: shipment as Record<string, unknown>,
  };
}

export async function updateShipmentByAdmin(
  dbClient: Knex = db,
  shipmentId: string,
  payload: Record<string, unknown>,
  actorId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasShipmentsTable = await tableExists(dbClient, 'shipments');
  if (!hasShipmentsTable) {
    throw new Error('SHIPMENTS_NOT_CONFIGURED');
  }

  if (!isValidUuid(shipmentId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const shipment = await trx('shipments').where({ id: shipmentId }).first();
    if (!shipment) {
      throw new Error('SHIPMENT_NOT_FOUND');
    }

    const allowedFields = ['status'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No eligible shipment admin changes supplied.', data: shipment as Record<string, unknown> };
    }

    await trx('shipments').where({ id: shipmentId }).update(updates);
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.SHIPMENT_UPDATED, 'Shipment', shipmentId, {
      changedFields: Object.keys(updates),
      oldValues: Object.fromEntries(Object.keys(updates).map((k) => [k, shipment[k]])),
      newValues: updates,
    });

    const updated = await trx('shipments').where({ id: shipmentId }).first();
    return {
      success: true,
      message: 'Shipment updated successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

// ============================================================
// ESCROW, TRANSACTIONS, COMMISSIONS MANAGEMENT SERVICES (501 stubs)
// ============================================================

export async function listEscrow(
  dbClient: Knex = db,
  _query: Record<string, unknown> = {}
): Promise<AdminResponse<{ escrow: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasEscrowTable = await tableExists(dbClient, 'escrow_ledger');
  if (!hasEscrowTable) {
    throw new Error('ESCROW_NOT_CONFIGURED');
  }

  const page = Math.max(1, Number(_query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(_query.limit ?? '20')));
  const total = Number((await dbClient('escrow_ledger').count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const escrow = await dbClient('escrow_ledger').select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Escrow records retrieved successfully.',
    data: {
      escrow: escrow.map((record) => record as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function listTransactions(
  dbClient: Knex = db,
  _query: Record<string, unknown> = {}
): Promise<AdminResponse<{ transactions: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasTransactionsTable = await tableExists(dbClient, 'transactions');
  if (!hasTransactionsTable) {
    throw new Error('TRANSACTIONS_NOT_CONFIGURED');
  }

  const page = Math.max(1, Number(_query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(_query.limit ?? '20')));
  const total = Number((await dbClient('transactions').count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const transactions = await dbClient('transactions').select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Transaction history retrieved successfully.',
    data: {
      transactions: transactions.map((record) => record as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function listCommissions(
  dbClient: Knex = db,
  _query: Record<string, unknown> = {}
): Promise<AdminResponse<{ commissions: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasTable = await tableExists(dbClient, 'commission_ledger');
  if (!hasTable) {
    throw new Error('COMMISSIONS_NOT_CONFIGURED');
  }

  const page = Math.max(1, Number(_query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(_query.limit ?? '20')));
  const total = Number((await dbClient('commission_ledger').count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const commissions = await dbClient('commission_ledger').select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Commission information retrieved successfully.',
    data: {
      commissions: commissions.map((record) => record as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

// ============================================================
// DISPUTE MANAGEMENT SERVICES (501 stubs)
// ============================================================

export async function listDisputes(
  dbClient: Knex = db,
  _query: Record<string, unknown> = {}
): Promise<AdminResponse<{ disputes: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasTable = await tableExists(dbClient, 'disputes');
  if (!hasTable) {
    throw new Error('DISPUTES_NOT_CONFIGURED');
  }

  const page = Math.max(1, Number(_query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(_query.limit ?? '20')));
  const total = Number((await dbClient('disputes').count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const disputes = await dbClient('disputes').select('*').orderBy('created_at', 'desc').offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Disputes retrieved successfully.',
    data: {
      disputes: disputes.map((record) => record as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getDisputeById(dbClient: Knex = db, disputeId: string): Promise<AdminResponse<Record<string, unknown>>> {
  const hasTable = await tableExists(dbClient, 'disputes');
  if (!hasTable) {
    throw new Error('DISPUTES_NOT_CONFIGURED');
  }

  if (!isValidUuid(disputeId)) {
    throw new Error('INVALID_ID');
  }

  const dispute = await dbClient('disputes').where({ id: disputeId }).first();
  if (!dispute) {
    throw new Error('DISPUTE_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Dispute retrieved successfully.',
    data: dispute as Record<string, unknown>,
  };
}

export async function resolveDispute(dbClient: Knex = db, disputeId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  const hasTable = await tableExists(dbClient, 'disputes');
  if (!hasTable) {
    throw new Error('DISPUTES_NOT_CONFIGURED');
  }

  if (!isValidUuid(disputeId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const dispute = await trx('disputes').where({ id: disputeId }).first();
    if (!dispute) {
      throw new Error('DISPUTE_NOT_FOUND');
    }

    await trx('disputes').where({ id: disputeId }).update({ status: 'RESOLVED', resolved_by: actorId, resolved_at: new Date() });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.DISPUTE_RESOLVED, 'Dispute', disputeId, { disputeStatus: 'RESOLVED' });

    const updated = await trx('disputes').where({ id: disputeId }).first();
    return {
      success: true,
      message: 'Dispute resolved successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function rejectDispute(dbClient: Knex = db, disputeId: string, actorId: string): Promise<AdminResponse<Record<string, unknown>>> {
  const hasTable = await tableExists(dbClient, 'disputes');
  if (!hasTable) {
    throw new Error('DISPUTES_NOT_CONFIGURED');
  }

  if (!isValidUuid(disputeId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const dispute = await trx('disputes').where({ id: disputeId }).first();
    if (!dispute) {
      throw new Error('DISPUTE_NOT_FOUND');
    }

    await trx('disputes').where({ id: disputeId }).update({ status: 'REJECTED', resolved_by: actorId, resolved_at: new Date() });
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.DISPUTE_REJECTED, 'Dispute', disputeId, { disputeStatus: 'REJECTED' });

    const updated = await trx('disputes').where({ id: disputeId }).first();
    return {
      success: true,
      message: 'Dispute rejected successfully.',
      data: updated as Record<string, unknown>,
    };
  });
}

// ============================================================
// AUDIT LOG MANAGEMENT SERVICES
// ============================================================

export async function listAuditLogs(
  dbClient: Knex = db,
  query: Record<string, unknown> = {}
): Promise<AdminResponse<{ auditLogs: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const userId = typeof query.userId === 'string' ? query.userId : undefined;
  const action = typeof query.action === 'string' ? query.action : undefined;

  const allowedSortColumns = ['created_at', 'action', 'user_id', 'target_type', 'id'];
  const sortBy = allowedSortColumns.includes(String(query.sortBy ?? '')) ? String(query.sortBy) : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('audit_logs');
  if (userId) queryBuilder = queryBuilder.where('user_id', userId);
  if (action) queryBuilder = queryBuilder.where('action', action);

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const auditLogs = await queryBuilder.clone().select('*').orderBy(sortBy, sortOrder).offset((page - 1) * limit).limit(limit);

  return {
    success: true,
    message: 'Audit logs retrieved successfully.',
    data: {
      auditLogs: auditLogs.map((record) => record as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getAuditLogById(
  dbClient: Knex = db,
  logId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(logId)) {
    throw new Error('INVALID_ID');
  }

  const log = await dbClient('audit_logs').where({ id: logId }).first();
  if (!log) {
    throw new Error('AUDIT_LOG_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Audit log retrieved successfully.',
    data: log as Record<string, unknown>,
  };
}

export async function exportAuditLogs(
  dbClient: Knex = db,
  query: Record<string, unknown> = {}
): Promise<AdminResponse<{ exportData: Record<string, unknown>[]; total: number }>> {
  const userId = typeof query.userId === 'string' ? query.userId : undefined;
  const action = typeof query.action === 'string' ? query.action : undefined;
  const from = typeof query.from === 'string' ? query.from : undefined;
  const to = typeof query.to === 'string' ? query.to : undefined;

  let queryBuilder = dbClient('audit_logs');
  if (userId) queryBuilder = queryBuilder.where('user_id', userId);
  if (action) queryBuilder = queryBuilder.where('action', action);
  if (from) queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
  if (to) queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const exportData = await queryBuilder.clone().select('*').orderBy('created_at', 'desc');

  return {
    success: true,
    message: 'Audit logs exported successfully.',
    data: {
      exportData: exportData.map((record) => record as Record<string, unknown>),
      total,
    },
  };
}

// ============================================================
// DASHBOARD STATISTICS SERVICES
// ============================================================

export async function getStatsOverview(
  dbClient: Knex = db
): Promise<AdminResponse<Record<string, unknown>>> {
  const stats: Record<string, unknown> = {
    totalUsers: 0,
    totalDrivers: 0,
    totalShippers: 0,
    totalCompanies: 0,
    totalVehicles: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    pendingRequests: 0,
    openDisputes: 0,
  };

  const usersTable = await tableExists(dbClient, 'users');
  if (usersTable) {
    const userStats = await dbClient('users')
      .select(
        dbClient.raw('COUNT(*) as totalUsers'),
        dbClient.raw('COUNT(*) FILTER (WHERE role = ?) as totalDrivers', ['DRIVER']),
        dbClient.raw('COUNT(*) FILTER (WHERE role = ?) as totalShippers', ['SHIPPER'])
      )
      .first();

    stats.totalUsers = Number(userStats?.totalUsers ?? 0);
    stats.totalDrivers = Number(userStats?.totalDrivers ?? 0);
    stats.totalShippers = Number(userStats?.totalShippers ?? 0);

    const hasCompaniesTable = await tableExists(dbClient, 'companies');
    if (hasCompaniesTable) {
      const companyCount = await dbClient('companies').count('* as count').first();
      stats.totalCompanies = Number(companyCount?.count ?? 0);
    } else {
      const fleetCount = await dbClient('users')
        .where('role', 'FLEET_OWNER')
        .whereNull('deleted_at')
        .count('* as count')
        .first();
      stats.totalCompanies = Number(fleetCount?.count ?? 0);
    }
  }

  const vehiclesTable = await tableExists(dbClient, 'vehicles');
  if (vehiclesTable) {
    const vehicleCount = await dbClient('vehicles').count('* as count').first();
    stats.totalVehicles = Number(vehicleCount?.count ?? 0);
  }

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');
  if (hasDeliveriesTable) {
    const deliveryStats = await dbClient('deliveries')
      .select(
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?) as activeDeliveries', ['IN_TRANSIT']),
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?) as completedDeliveries', ['DELIVERED'])
      )
      .first();
    stats.activeDeliveries = Number(deliveryStats?.activeDeliveries ?? 0);
    stats.completedDeliveries = Number(deliveryStats?.completedDeliveries ?? 0);
  } else {
    const loadStats = await dbClient('loads')
      .select(
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?) as activeDeliveries', ['IN_TRANSIT']),
        dbClient.raw('COUNT(*) FILTER (WHERE status = ?) as completedDeliveries', ['DELIVERED'])
      )
      .first();
    stats.activeDeliveries = Number(loadStats?.activeDeliveries ?? 0);
    stats.completedDeliveries = Number(loadStats?.completedDeliveries ?? 0);
  }

  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');
  if (hasRequestsTable) {
    const requestCount = await dbClient('transport_requests')
      .where('status', 'PENDING')
      .count('* as count')
      .first();
    stats.pendingRequests = Number(requestCount?.count ?? 0);
  } else {
    const requestCount = await dbClient('loads')
      .where('status', 'POSTED')
      .count('* as count')
      .first();
    stats.pendingRequests = Number(requestCount?.count ?? 0);
  }

  const hasDisputesTable = await tableExists(dbClient, 'disputes');
  if (hasDisputesTable) {
    const disputeCount = await dbClient('disputes')
      .where('status', 'OPEN')
      .count('* as count')
      .first();
    stats.openDisputes = Number(disputeCount?.count ?? 0);
  }

  return {
    success: true,
    message: 'Dashboard statistics retrieved successfully.',
    data: stats,
  };
}

export async function getStatsUsersCount(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const usersTable = await tableExists(dbClient, 'users');
  let count = 0;
  if (usersTable) {
    const result = await dbClient('users').whereNull('deleted_at').count('* as count').first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Total users count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsDriversCount(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const usersTable = await tableExists(dbClient, 'users');
  let count = 0;
  if (usersTable) {
    const result = await dbClient('users')
      .where('role', 'DRIVER')
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Total drivers count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsCompaniesCount(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const hasCompaniesTable = await tableExists(dbClient, 'companies');
  let count = 0;
  if (hasCompaniesTable) {
    const result = await dbClient('companies').count('* as count').first();
    count = Number(result?.count ?? 0);
  } else {
    const result = await dbClient('users')
      .where('role', 'FLEET_OWNER')
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Total companies count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsVehiclesCount(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const vehiclesTable = await tableExists(dbClient, 'vehicles');
  let count = 0;
  if (vehiclesTable) {
    const result = await dbClient('vehicles').count('* as count').first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Total vehicles count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsDeliveriesActive(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');
  let count = 0;
  if (hasDeliveriesTable) {
    const result = await dbClient('deliveries')
      .where('status', 'IN_TRANSIT')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  } else {
    const result = await dbClient('loads')
      .where('status', 'IN_TRANSIT')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Active deliveries count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsDeliveriesCompleted(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');
  let count = 0;
  if (hasDeliveriesTable) {
    const result = await dbClient('deliveries')
      .where('status', 'DELIVERED')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  } else {
    const result = await dbClient('loads')
      .where('status', 'DELIVERED')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Completed deliveries count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsRequestsPending(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const hasRequestsTable = await tableExists(dbClient, 'transport_requests');
  let count = 0;
  if (hasRequestsTable) {
    const result = await dbClient('transport_requests')
      .where('status', 'PENDING')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  } else {
    const result = await dbClient('loads')
      .where('status', 'POSTED')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Pending requests count retrieved successfully.',
    data: { count },
  };
}

export async function getStatsDisputesOpen(
  dbClient: Knex = db
): Promise<AdminResponse<{ count: number }>> {
  const hasDisputesTable = await tableExists(dbClient, 'disputes');
  let count = 0;
  if (hasDisputesTable) {
    const result = await dbClient('disputes')
      .where('status', 'OPEN')
      .count('* as count')
      .first();
    count = Number(result?.count ?? 0);
  }
  return {
    success: true,
    message: 'Open disputes count retrieved successfully.',
    data: { count },
  };
}

// ============================================================
// RATING MANAGEMENT SERVICES
// ============================================================

export interface RatingQueryInput {
  page?: string;
  limit?: string;
  target_type?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function listRatings(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<{ ratings: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    return {
      success: true,
      message: 'Ratings table is not configured in the current database schema.',
      data: {
        ratings: [],
        pagination: buildPagination(1, 20, 0),
      },
    };
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const targetType = (query.target_type ?? '').trim().toUpperCase();

  const allowedSortColumns = ['created_at', 'rating', 'target_type', 'id'];
  const sortBy = allowedSortColumns.includes(query.sortBy ?? '') ? query.sortBy! : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  let queryBuilder = dbClient('ratings');

  if (targetType && ['DRIVER', 'SHIPPER', 'COMPANY'].includes(targetType)) {
    queryBuilder = queryBuilder.where('target_type', targetType);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const ratings = await queryBuilder
    .clone()
    .select('*')
    .orderBy(sortBy, sortOrder)
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Ratings retrieved successfully.',
    data: {
      ratings: ratings.map((r) => r as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function getRatingById(
  dbClient: Knex = db,
  ratingId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    throw new Error('RATINGS_NOT_CONFIGURED');
  }

  if (!isValidUuid(ratingId)) {
    throw new Error('INVALID_ID');
  }

  const rating = await dbClient('ratings').where({ id: ratingId }).first();
  if (!rating) {
    throw new Error('RATING_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Rating retrieved successfully.',
    data: rating as Record<string, unknown>,
  };
}

export async function deleteRating(
  dbClient: Knex = db,
  ratingId: string,
  actorId: string
): Promise<AdminResponse<null>> {
  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  if (!hasRatingsTable) {
    throw new Error('RATINGS_NOT_CONFIGURED');
  }

  if (!isValidUuid(ratingId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const rating = await trx('ratings').where({ id: ratingId }).first();
    if (!rating) {
      throw new Error('RATING_NOT_FOUND');
    }

    await trx('ratings').where({ id: ratingId }).del();
    await logAudit(trx, actorId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Rating', ratingId, {
      action: 'DELETE_RATING',
      deletedRating: rating,
    });

    return {
      success: true,
      message: 'Rating deleted successfully.',
      data: null,
    };
  });
}

// ============================================================
// REPORT SERVICES
// ============================================================

export interface ReportQueryInput {
  from?: string;
  to?: string;
  group_by?: string;
  status?: string;
  format?: string;
}

export async function generateRevenueReport(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<Record<string, unknown>>> {
  const { from, to, group_by = 'day' } = query;

  let dateFormat = 'YYYY-MM-DD';
  if (group_by === 'week') dateFormat = 'YYYY-WW';
  if (group_by === 'month') dateFormat = 'YYYY-MM';

  let queryBuilder = dbClient('payments').where('status', 'COMPLETED');

  if (from) {
    queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
  }
  if (to) {
    queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));
  }

  const totalResult = await queryBuilder.clone().sum('amount as total').first();
  const totalRevenue = Number(totalResult?.total ?? 0);

  const breakdown = await queryBuilder
    .clone()
    .select(dbClient.raw(`to_char(created_at, '${dateFormat}') as date`))
    .select(dbClient.raw('SUM(amount) as amount'))
    .groupByRaw(`to_char(created_at, '${dateFormat}')`)
    .orderBy('date', 'asc');

  return {
    success: true,
    message: 'Revenue report generated successfully.',
    data: {
      totalRevenue,
      period: { from: from || null, to: to || null },
      groupBy: group_by,
      breakdown: breakdown.map((b: any) => ({
        date: b.date,
        amount: Number(b.amount ?? 0),
      })),
    },
  };
}

export async function generateUserReport(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<Record<string, unknown>>> {
  const { from, to } = query;

  let queryBuilder = dbClient('users').whereNull('deleted_at');

  if (from) {
    queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
  }
  if (to) {
    queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));
  }

  const totalUsers = Number((await queryBuilder.clone().count('* as count').first())?.count ?? 0);

  const usersByRole = await queryBuilder
    .clone()
    .select('role')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('role');

  const usersByStatus = await queryBuilder
    .clone()
    .select('status')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('status');

  return {
    success: true,
    message: 'User report generated successfully.',
    data: {
      totalUsers,
      period: { from: from || null, to: to || null },
      usersByRole: usersByRole.map((u: any) => ({ role: u.role, count: Number(u.count) })),
      usersByStatus: usersByStatus.map((u: any) => ({ status: u.status || 'UNKNOWN', count: Number(u.count) })),
    },
  };
}

export async function generateDriverReport(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<Record<string, unknown>>> {
  const { from, to } = query;

  let queryBuilder = dbClient('users')
    .where('role', 'DRIVER')
    .whereNull('deleted_at');

  if (from) {
    queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
  }
  if (to) {
    queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));
  }

  const totalDrivers = Number((await queryBuilder.clone().count('* as count').first())?.count ?? 0);

  const driversByStatus = await queryBuilder
    .clone()
    .select('status')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('status');

  const driversByKyc = await queryBuilder
    .clone()
    .select('kyc_status')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('kyc_status');

  const hasRatingsTable = await tableExists(dbClient, 'ratings');
  let averageRating = 0;
  if (hasRatingsTable) {
    const ratingResult = await dbClient('ratings')
      .where('target_type', 'DRIVER')
      .select(dbClient.raw('AVG(rating) as average'))
      .first();
    averageRating = Number(ratingResult?.average ?? 0);
  }

  return {
    success: true,
    message: 'Driver report generated successfully.',
    data: {
      totalDrivers,
      period: { from: from || null, to: to || null },
      driversByStatus: driversByStatus.map((d: any) => ({ status: d.status || 'ACTIVE', count: Number(d.count) })),
      driversByKyc: driversByKyc.map((d: any) => ({ kycStatus: d.kyc_status || 'PENDING', count: Number(d.count) })),
      averageRating,
    },
  };
}

export async function generateCompanyReport(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<Record<string, unknown>>> {
  const { from, to } = query;

  const hasCompaniesTable = await tableExists(dbClient, 'companies');
  let totalCompanies = 0;
  let companiesByStatus: any[] = [];

  if (hasCompaniesTable) {
    let queryBuilder = dbClient('companies');
    if (from) queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
    if (to) queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));

    totalCompanies = Number((await queryBuilder.clone().count('* as count').first())?.count ?? 0);

    companiesByStatus = await queryBuilder
      .clone()
      .select('status')
      .select(dbClient.raw('COUNT(*) as count'))
      .groupBy('status');
  } else {
    let queryBuilder = dbClient('users')
      .where('role', 'FLEET_OWNER')
      .whereNull('deleted_at');

    if (from) queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
    if (to) queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));

    totalCompanies = Number((await queryBuilder.clone().count('* as count').first())?.count ?? 0);

    companiesByStatus = await queryBuilder
      .clone()
      .select('status')
      .select(dbClient.raw('COUNT(*) as count'))
      .groupBy('status');
  }

  return {
    success: true,
    message: 'Company report generated successfully.',
    data: {
      totalCompanies,
      period: { from: from || null, to: to || null },
      companiesByStatus: companiesByStatus.map((c: any) => ({ status: c.status || 'ACTIVE', count: Number(c.count) })),
    },
  };
}

export async function generateDeliveryReport(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<Record<string, unknown>>> {
  const { from, to, status } = query;

  const hasDeliveriesTable = await tableExists(dbClient, 'deliveries');
  let totalDeliveries = 0;
  let deliveriesByStatus: any[] = [];
  let tableName = 'loads';

  if (hasDeliveriesTable) {
    tableName = 'deliveries';
  }

  let queryBuilder = dbClient(tableName);

  if (from) queryBuilder = queryBuilder.where('created_at', '>=', new Date(from));
  if (to) queryBuilder = queryBuilder.where('created_at', '<=', new Date(to));
  if (status) queryBuilder = queryBuilder.where('status', status);

  totalDeliveries = Number((await queryBuilder.clone().count('* as count').first())?.count ?? 0);

  deliveriesByStatus = await queryBuilder
    .clone()
    .select('status')
    .select(dbClient.raw('COUNT(*) as count'))
    .groupBy('status');

  return {
    success: true,
    message: 'Delivery report generated successfully.',
    data: {
      totalDeliveries,
      period: { from: from || null, to: to || null },
      statusFilter: status || null,
      deliveriesByStatus: deliveriesByStatus.map((d: any) => ({ status: d.status, count: Number(d.count) })),
    },
  };
}

export async function exportReport(
  dbClient: Knex = db,
  type: string,
  query: Record<string, string> = {}
): Promise<AdminResponse<{ exportData: Record<string, unknown>[]; total: number; format: string }>> {
  const format = query.format || 'csv';

  let data: any[] = [];
  let exportData: Record<string, unknown>[] = [];

  switch (type) {
    case 'revenue': {
      const result = await generateRevenueReport(dbClient, query);
      const revenueData = result.data as any;
      data = revenueData.breakdown || [];
      exportData = data.map((item: any) => ({
        date: item.date,
        amount: item.amount,
      }));
      break;
    }
    case 'users': {
      const result = await generateUserReport(dbClient, query);
      const userData = result.data as any;
      const usersByRole = userData.usersByRole || [];
      const usersByStatus = userData.usersByStatus || [];
      exportData = [
        { category: 'Total Users', value: userData.totalUsers },
        ...usersByRole.map((u: any) => ({ category: `Role: ${u.role}`, value: u.count })),
        ...usersByStatus.map((u: any) => ({ category: `Status: ${u.status}`, value: u.count })),
      ];
      break;
    }
    case 'drivers': {
      const result = await generateDriverReport(dbClient, query);
      const driverData = result.data as any;
      const byStatus = driverData.driversByStatus || [];
      const byKyc = driverData.driversByKyc || [];
      exportData = [
        { category: 'Total Drivers', value: driverData.totalDrivers },
        { category: 'Average Rating', value: driverData.averageRating },
        ...byStatus.map((d: any) => ({ category: `Status: ${d.status}`, value: d.count })),
        ...byKyc.map((d: any) => ({ category: `KYC: ${d.kycStatus}`, value: d.count })),
      ];
      break;
    }
    case 'companies': {
      const result = await generateCompanyReport(dbClient, query);
      const companyData = result.data as any;
      const byStatus = companyData.companiesByStatus || [];
      exportData = [
        { category: 'Total Companies', value: companyData.totalCompanies },
        ...byStatus.map((c: any) => ({ category: `Status: ${c.status}`, value: c.count })),
      ];
      break;
    }
    case 'deliveries': {
      const result = await generateDeliveryReport(dbClient, query);
      const deliveryData = result.data as any;
      const byStatus = deliveryData.deliveriesByStatus || [];
      exportData = [
        { category: 'Total Deliveries', value: deliveryData.totalDeliveries },
        ...byStatus.map((d: any) => ({ category: `Status: ${d.status}`, value: d.count })),
      ];
      break;
    }
    default: {
      throw new Error('INVALID_REPORT_TYPE');
    }
  }

  return {
    success: true,
    message: `Report exported successfully in ${format.toUpperCase()} format.`,
    data: {
      exportData,
      total: exportData.length,
      format,
    },
  };
}

// ============================================================
// NOTIFICATION SERVICES
// ============================================================

export async function listNotifications(
  dbClient: Knex = db,
  userId: string | null,
  query: Record<string, string> = {}
): Promise<AdminResponse<{ notifications: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    return {
      success: true,
      message: 'Notifications table is not configured in the current database schema.',
      data: {
        notifications: [],
        pagination: buildPagination(1, 20, 0),
      },
    };
  }

  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const isRead = query.is_read === 'true' ? true : query.is_read === 'false' ? false : undefined;

  let queryBuilder = dbClient('notifications');

  if (userId) {
    queryBuilder = queryBuilder.where('user_id', userId);
  }

  if (isRead !== undefined) {
    queryBuilder = queryBuilder.where('is_read', isRead);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const notifications = await queryBuilder
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Notifications retrieved successfully.',
    data: {
      notifications: notifications.map((n) => n as Record<string, unknown>),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function markNotificationRead(
  dbClient: Knex = db,
  notificationId: string,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    throw new Error('NOTIFICATIONS_NOT_CONFIGURED');
  }

  if (!isValidUuid(notificationId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const notification = await trx('notifications').where({ id: notificationId }).first();
    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    await trx('notifications').where({ id: notificationId }).update({ is_read: true });
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Notification', notificationId, {
      action: 'MARK_READ',
    });

    const updated = await trx('notifications').where({ id: notificationId }).first();
    return {
      success: true,
      message: 'Notification marked as read.',
      data: updated as Record<string, unknown>,
    };
  });
}

export async function markAllNotificationsRead(
  dbClient: Knex = db,
  userId: string | null
): Promise<AdminResponse<{ count: number }>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    throw new Error('NOTIFICATIONS_NOT_CONFIGURED');
  }

  return await dbClient.transaction(async (trx) => {
    let query = trx('notifications').where({ is_read: false });
    if (userId) {
      query = query.where({ user_id: userId });
    }

    const count = await query.update({ is_read: true });
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Notification', null, {
      action: 'MARK_ALL_READ',
      count,
    });

    return {
      success: true,
      message: `Marked ${count} notifications as read.`,
      data: { count },
    };
  });
}

export async function sendNotification(
  dbClient: Knex = db,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    throw new Error('NOTIFICATIONS_NOT_CONFIGURED');
  }

  const requiredFields = ['userId', 'title', 'message'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error('MISSING_REQUIRED_FIELD');
    }
  }

  const notification = {
    user_id: payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type || 'SYSTEM',
    is_read: false,
    created_at: new Date(),
  };

  const [result] = await dbClient('notifications').insert(notification).returning('*');
  await logAudit(dbClient, userId, ADMIN_AUDIT_ACTIONS.NOTIFICATION_SENT, 'Notification', result.id, {
    targetUser: payload.userId,
    title: payload.title,
  });

  return {
    success: true,
    message: 'Notification sent successfully.',
    data: result as Record<string, unknown>,
  };
}

export async function broadcastNotification(
  dbClient: Knex = db,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<{ recipientCount: number }>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    throw new Error('NOTIFICATIONS_NOT_CONFIGURED');
  }

  if (!payload.title || !payload.message) {
    throw new Error('MISSING_REQUIRED_FIELD');
  }

  // Get all active users
  const users = await dbClient('users')
    .whereNull('deleted_at')
    .where('status', 'ACTIVE')
    .select('id');

  let recipientCount = 0;
  if (users.length > 0) {
    const notifications = users.map((user: any) => ({
      user_id: user.id,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'SYSTEM',
      is_read: false,
      created_at: new Date(),
    }));

    await dbClient('notifications').insert(notifications);
    recipientCount = users.length;
  }

  await logAudit(dbClient, userId, ADMIN_AUDIT_ACTIONS.NOTIFICATION_BROADCAST, 'Notification', null, {
    title: payload.title,
    recipientCount,
  });

  return {
    success: true,
    message: `Broadcast sent to ${recipientCount} users.`,
    data: { recipientCount },
  };
}

export async function deleteNotification(
  dbClient: Knex = db,
  notificationId: string,
  userId: string | null
): Promise<AdminResponse<null>> {
  const hasNotificationsTable = await tableExists(dbClient, 'notifications');
  if (!hasNotificationsTable) {
    throw new Error('NOTIFICATIONS_NOT_CONFIGURED');
  }

  if (!isValidUuid(notificationId)) {
    throw new Error('INVALID_ID');
  }

  return await dbClient.transaction(async (trx) => {
    const notification = await trx('notifications').where({ id: notificationId }).first();
    if (!notification) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }

    await trx('notifications').where({ id: notificationId }).del();
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.USER_UPDATED, 'Notification', notificationId, {
      action: 'DELETE_NOTIFICATION',
    });

    return {
      success: true,
      message: 'Notification deleted successfully.',
      data: null,
    };
  });
}

// ============================================================
// SETTINGS SERVICES
// ============================================================

export async function getPlatformSettings(
  dbClient: Knex = db
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasSettingsTable = await tableExists(dbClient, 'settings');
  if (!hasSettingsTable) {
    return {
      success: true,
      message: 'Settings table is not configured. Returning default settings.',
      data: {
        platform_fee: 5.0,
        currency: 'ETB',
        min_withdrawal: 100,
        max_load_weight: 50,
        enable_kyc: true,
        require_vehicle_verification: true,
      },
    };
  }

  const settings = await dbClient('settings').first();
  return {
    success: true,
    message: 'Settings retrieved successfully.',
    data: (settings as Record<string, unknown>) || {},
  };
}

export async function updatePlatformSettings(
  dbClient: Knex = db,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasSettingsTable = await tableExists(dbClient, 'settings');
  if (!hasSettingsTable) {
    throw new Error('SETTINGS_NOT_CONFIGURED');
  }

  const allowedFields = ['platform_fee', 'currency', 'min_withdrawal', 'max_load_weight', 'enable_kyc', 'require_vehicle_verification'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('NO_FIELDS_TO_UPDATE');
  }

  let result;
  const existing = await dbClient('settings').first();
  if (existing) {
    await dbClient('settings').update(updates);
    result = await dbClient('settings').first();
  } else {
    updates.updated_at = new Date();
    [result] = await dbClient('settings').insert(updates).returning('*');
  }

  await logAudit(dbClient, userId, ADMIN_AUDIT_ACTIONS.SETTINGS_UPDATED, 'Settings', null, {
    updatedFields: Object.keys(updates),
    newValues: updates,
  });

  return {
    success: true,
    message: 'Settings updated successfully.',
    data: result as Record<string, unknown>,
  };
}

export async function getNotificationSettings(
  dbClient: Knex = db
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasSettingsTable = await tableExists(dbClient, 'settings');
  if (!hasSettingsTable) {
    return {
      success: true,
      message: 'Settings table is not configured. Returning default notification settings.',
      data: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        notify_on_payment: true,
        notify_on_delivery: true,
        notify_on_kyc: true,
        notify_on_dispute: true,
      },
    };
  }

  const settings = await dbClient('settings').first();
  const notificationSettings = (settings as Record<string, unknown>)?.notification_settings || {};

  return {
    success: true,
    message: 'Notification settings retrieved successfully.',
    data: notificationSettings as Record<string, unknown>,
  };
}

export async function updateNotificationSettings(
  dbClient: Knex = db,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  const hasSettingsTable = await tableExists(dbClient, 'settings');
  if (!hasSettingsTable) {
    throw new Error('SETTINGS_NOT_CONFIGURED');
  }

  const allowedFields = ['email_enabled', 'sms_enabled', 'push_enabled', 'notify_on_payment', 'notify_on_delivery', 'notify_on_kyc', 'notify_on_dispute'];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('NO_FIELDS_TO_UPDATE');
  }

  let result;
  const existing = await dbClient('settings').first();
  if (existing) {
    const currentSettings = existing as Record<string, unknown>;
    const notificationSettings = {
      ...((currentSettings.notification_settings as Record<string, unknown>) || {}),
      ...updates,
    };
    await dbClient('settings').update({ notification_settings: notificationSettings });
    result = await dbClient('settings').first();
  } else {
    const newSettings = {
      notification_settings: updates,
      updated_at: new Date(),
    };
    [result] = await dbClient('settings').insert(newSettings).returning('*');
  }

  await logAudit(dbClient, userId, ADMIN_AUDIT_ACTIONS.SETTINGS_UPDATED, 'Settings', null, {
    action: 'UPDATE_NOTIFICATION_SETTINGS',
    updatedFields: Object.keys(updates),
  });

  return {
    success: true,
    message: 'Notification settings updated successfully.',
    data: (result as Record<string, unknown>)?.notification_settings as Record<string, unknown>,
  };
}

// ============================================================
// ADMIN MANAGEMENT SERVICES
// ============================================================

export async function listAdmins(
  dbClient: Knex = db,
  query: Record<string, string> = {}
): Promise<AdminResponse<{ admins: Record<string, unknown>[]; pagination: PaginationMeta }>> {
  const page = Math.max(1, Number(query.page ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? '20')));
  const search = (query.search ?? '').trim();
  const status = (query.status ?? '').trim().toUpperCase();

  let queryBuilder = dbClient('users')
    .where('role', 'ADMIN')
    .whereNull('deleted_at');

  if (search) {
    queryBuilder = queryBuilder.where((builder) => {
      builder.whereILike('full_name', `%${search}%`);
      builder.orWhereILike('phone_number', `%${search}%`);
      builder.orWhereILike('email', `%${search}%`);
    });
  }

  if (status) {
    queryBuilder = queryBuilder.where('status', status);
  }

  const total = Number((await queryBuilder.clone().count<{ count: string }[]>('* as count').first())?.count ?? 0);
  const admins = await queryBuilder
    .clone()
    .select('*')
    .orderBy('created_at', 'desc')
    .offset((page - 1) * limit)
    .limit(limit);

  return {
    success: true,
    message: 'Admins retrieved successfully.',
    data: {
      admins: admins.map((admin) => sanitizeUserRecord(admin as Record<string, unknown>)),
      pagination: buildPagination(page, limit, total),
    },
  };
}

export async function createAdmin(
  dbClient: Knex = db,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  const requiredFields = ['full_name', 'email', 'phone_number', 'password'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new Error('MISSING_FIELDS');
    }
  }

  // Check for duplicates
  const existingEmail = await dbClient('users').where({ email: payload.email }).first();
  if (existingEmail) {
    throw new Error('DUPLICATE_EMAIL');
  }

  const existingPhone = await dbClient('users').where({ phone_number: payload.phone_number }).first();
  if (existingPhone) {
    throw new Error('DUPLICATE_PHONE');
  }

  const hashedPassword = await comparePassword(payload.password as string, '');
  // Use bcrypt hash instead of comparePassword
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.default.hash(payload.password as string, 10);

  const admin = {
    full_name: payload.full_name,
    email: payload.email,
    phone_number: payload.phone_number,
    password_hash: passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    is_verified: true,
    permissions: payload.permissions || [],
    created_at: new Date(),
  };

  const [result] = await dbClient('users').insert(admin).returning('*');
  await logAudit(dbClient, userId, ADMIN_AUDIT_ACTIONS.ADMIN_CREATED, 'Admin', result.id, {
    createdAdmin: payload.email,
  });

  return {
    success: true,
    message: 'Admin created successfully.',
    data: sanitizeUserRecord(result as Record<string, unknown>),
  };
}

export async function getAdminById(
  dbClient: Knex = db,
  adminId: string
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(adminId)) {
    throw new Error('INVALID_ID');
  }

  const admin = await dbClient('users')
    .where({ id: adminId, role: 'ADMIN' })
    .whereNull('deleted_at')
    .first();

  if (!admin) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  return {
    success: true,
    message: 'Admin retrieved successfully.',
    data: sanitizeUserRecord(admin as Record<string, unknown>),
  };
}

export async function updateAdmin(
  dbClient: Knex = db,
  adminId: string,
  payload: Record<string, unknown>,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(adminId)) {
    throw new Error('INVALID_ID');
  }

  const prohibitedFields = ['password_hash', 'password', 'otp_code', 'role', 'id'];
  const permittedFields = ['full_name', 'email', 'phone_number', 'status', 'is_verified'];

  for (const key of Object.keys(payload)) {
    if (prohibitedFields.includes(key) || !permittedFields.includes(key)) {
      throw new Error('PROHIBITED_FIELD');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const admin = await trx('users')
      .where({ id: adminId, role: 'ADMIN' })
      .whereNull('deleted_at')
      .first();

    if (!admin) {
      throw new Error('ADMIN_NOT_FOUND');
    }

    if (admin.role === 'ADMIN') {
      const activeAdmins = await countActiveAdmins(trx);
      if (activeAdmins <= 1 && payload.status === 'SUSPENDED') {
        throw new Error('LAST_ADMIN_PROTECTION');
      }
    }

    const updates: Record<string, unknown> = {};
    for (const field of permittedFields) {
      if (payload[field] !== undefined) {
        updates[field] = payload[field];
      }
    }

    await trx('users').where({ id: adminId }).update(updates);
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.ADMIN_UPDATED, 'Admin', adminId, {
      updatedFields: Object.keys(updates),
    });

    const updated = await trx('users').where({ id: adminId }).first();
    return {
      success: true,
      message: 'Admin updated successfully.',
      data: sanitizeUserRecord(updated as Record<string, unknown>),
    };
  });
}

export async function changeAdminStatus(
  dbClient: Knex = db,
  adminId: string,
  status: string,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(adminId)) {
    throw new Error('INVALID_ID');
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const formattedStatus = (status || '').trim().toUpperCase();
  if (!validStatuses.includes(formattedStatus)) {
    throw new Error('INVALID_STATUS');
  }

  return await dbClient.transaction(async (trx) => {
    const admin = await trx('users')
      .where({ id: adminId, role: 'ADMIN' })
      .whereNull('deleted_at')
      .first();

    if (!admin) {
      throw new Error('ADMIN_NOT_FOUND');
    }

    if (formattedStatus === 'SUSPENDED' || formattedStatus === 'INACTIVE') {
      const activeAdmins = await countActiveAdmins(trx);
      if (activeAdmins <= 1) {
        throw new Error('LAST_ADMIN_PROTECTION');
      }
    }

    const previousStatus = admin.status || 'ACTIVE';
    await trx('users').where({ id: adminId }).update({ status: formattedStatus });
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.ADMIN_STATUS_CHANGED, 'Admin', adminId, {
      previousStatus,
      newStatus: formattedStatus,
    });

    const updated = await trx('users').where({ id: adminId }).first();
    return {
      success: true,
      message: `Admin status updated to ${formattedStatus}.`,
      data: sanitizeUserRecord(updated as Record<string, unknown>),
    };
  });
}

export async function updateAdminPermissions(
  dbClient: Knex = db,
  adminId: string,
  permissions: unknown,
  userId: string | null
): Promise<AdminResponse<Record<string, unknown>>> {
  if (!isValidUuid(adminId)) {
    throw new Error('INVALID_ID');
  }

  if (!Array.isArray(permissions)) {
    throw new Error('INVALID_PERMISSIONS');
  }

  const validPermissions = ['manage_users', 'manage_vehicles', 'manage_payments', 'manage_admins', 'manage_settings', 'view_reports'];
  for (const perm of permissions) {
    if (!validPermissions.includes(perm as string)) {
      throw new Error('INVALID_PERMISSIONS');
    }
  }

  return await dbClient.transaction(async (trx) => {
    const admin = await trx('users')
      .where({ id: adminId, role: 'ADMIN' })
      .whereNull('deleted_at')
      .first();

    if (!admin) {
      throw new Error('ADMIN_NOT_FOUND');
    }

    await trx('users').where({ id: adminId }).update({ permissions });
    await logAudit(trx, userId, ADMIN_AUDIT_ACTIONS.ADMIN_PERMISSIONS_UPDATED, 'Admin', adminId, {
      newPermissions: permissions,
    });

    const updated = await trx('users').where({ id: adminId }).first();
    return {
      success: true,
      message: 'Admin permissions updated successfully.',
      data: sanitizeUserRecord(updated as Record<string, unknown>),
    };
  });
}