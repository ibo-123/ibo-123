import type { Request, Response } from 'express';
import type { Knex } from 'knex';
import db from '../config/db';
import {
  activateUser,
  adminFaydaVerify,
  adminLogin,
  adminLogout,
  adminRefresh,
  approveKyc,
  assignCompanyToRequest,
  assignDriverToRequest,
  cancelDelivery,
  cancelRequest,
  changeCompanyStatus,
  changeDeliveryStatus,
  changeDriverStatus,
  changeShipperStatus,
  changeUserRoleByAdmin,
  deleteUserByAdmin,
  getAdminAnalytics,
  getAdminDashboard,
  getAdminMe,
  getAuditLogById,
  getCompanyById,
  getCompanyDrivers,
  getCompanyRatingStats,
  getCompanyTrips,
  getCompanyVehicles,
  getDeliveryById,
  getDeliveryPayment,
  getDisputeById,
  getDriverById,
  getDriverDocuments,
  getDriverRatingStats,
  getDriverRatings,
  getDriverTrips,
  getKycById,
  getLoadById,
  getPaymentById,
  getRequestById,
  getShipmentById,
  getShipperById,
  getShipperPayments,
  getShipperTrips,
  getSystemHealth,
  getUserById,
  getUserTrips,
  getVehicleById,
  listAuditLogs,
  listCommissions,
  listCompanies,
  listDeliveries,
  listDisputes,
  listDrivers,
  listEscrow,
  listKycRequests,
  listLoads,
  listPayments,
  listRequests,
  listShipments,
  listShippers,
  listTransactions,
  listUsers,
  listVehicles,
  releasePayment,
  freezePayment,
  refundPayment,
  rejectDispute,
  rejectKyc,
  rejectVehicle,
  resolveDispute,
  reviewDriverDocument,
  suspendUser,
  updateCompanyByAdmin,
  updateDriverByAdmin,
  updateLoadByAdmin,
  updateShipmentByAdmin,
  updateUserByAdmin,
  verifyCompanyByAdmin,
  verifyVehicle,
  exportAuditLogs,
  // New service imports
  getStatsOverview,
  getStatsUsersCount,
  getStatsDriversCount,
  getStatsCompaniesCount,
  getStatsVehiclesCount,
  getStatsDeliveriesActive,
  getStatsDeliveriesCompleted,
  getStatsRequestsPending,
  getStatsDisputesOpen,
  listRatings,
  getRatingById,
  deleteRating,
  generateRevenueReport,
  generateUserReport,
  generateDriverReport,
  generateCompanyReport,
  generateDeliveryReport,
  exportReport,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendNotification,
  broadcastNotification,
  deleteNotification,
  getPlatformSettings,
  updatePlatformSettings,
  getNotificationSettings,
  updateNotificationSettings,
  listAdmins,
  createAdmin,
  getAdminById,
  updateAdmin,
  changeAdminStatus,
  updateAdminPermissions,
  updateVehicle,
  updateVehicleStatus,
} from '../services/adminService';

// ============================================================
// Helper Functions
// ============================================================

const toErrorCode = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.toUpperCase().replace(/\s+/g, '_');
  }
  return 'UNKNOWN_ERROR';
};

const sendError = (res: Response, status: number, message: string, code: string) => {
  return res.status(status).json({ success: false, message, error: { code } });
};

// ============================================================
// AUTHENTICATION CONTROLLERS
// ============================================================

export async function adminLoginController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const { phone_number, password } = req.body;

    if (!phone_number || !password) {
      return sendError(res, 400, 'Phone number and password are required.', 'MISSING_CREDENTIALS');
    }

    const result = await adminLogin(database, phone_number, password);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'MISSING_CREDENTIALS') {
      return sendError(res, 400, 'Phone number and password are required.', code);
    }
    if (code === 'INVALID_CREDENTIALS') {
      return sendError(res, 401, 'Invalid phone number or password.', code);
    }
    if (code === 'NOT_ADMIN') {
      return sendError(res, 403, 'User is not an administrator.', code);
    }
    return sendError(res, 500, 'Unable to process admin login.', code);
  }
}

export async function adminLogoutController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    if (!actorId) {
      return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');
    }

    const result = await adminLogout(database, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') {
      return sendError(res, 400, 'Invalid user ID.', code);
    }
    return sendError(res, 500, 'Unable to process logout.', code);
  }
}

export async function adminRefreshController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    if (!actorId) {
      return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');
    }

    const result = await adminRefresh(database, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') {
      return sendError(res, 400, 'Invalid user ID.', code);
    }
    if (code === 'USER_NOT_FOUND') {
      return sendError(res, 404, 'User not found.', code);
    }
    if (code === 'NOT_ADMIN') {
      return sendError(res, 403, 'User is not an administrator.', code);
    }
    return sendError(res, 500, 'Unable to refresh token.', code);
  }
}

export async function adminFaydaVerifyController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    if (!actorId) {
      return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');
    }

    const result = await adminFaydaVerify(database, actorId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') {
      return sendError(res, 400, 'Invalid user ID.', code);
    }
    if (code === 'USER_NOT_FOUND') {
      return sendError(res, 404, 'User not found.', code);
    }
    if (code === 'NOT_ADMIN') {
      return sendError(res, 403, 'User is not an administrator.', code);
    }
    return sendError(res, 500, 'Unable to verify Fayda identity.', code);
  }
}

export async function adminMeController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    if (!actorId) {
      return sendError(res, 401, 'Unauthorized.', 'UNAUTHORIZED');
    }

    const result = await getAdminMe(database, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') {
      return sendError(res, 400, 'Invalid user ID.', code);
    }
    if (code === 'USER_NOT_FOUND') {
      return sendError(res, 404, 'User not found.', code);
    }
    if (code === 'NOT_ADMIN') {
      return sendError(res, 403, 'User is not an administrator.', code);
    }
    return sendError(res, 500, 'Unable to fetch admin profile.', code);
  }
}

// ============================================================
// DASHBOARD CONTROLLERS
// ============================================================

export async function dashboardController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getAdminDashboard(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to load dashboard summary.', toErrorCode(error));
  }
}

export async function analyticsController(req: Request, res: Response, database: Knex = db) {
  try {
    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const result = await getAdminAnalytics(database, from, to);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch analytics.', toErrorCode(error));
  }
}

export async function systemHealthController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getSystemHealth(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch system health.', toErrorCode(error));
  }
}

// ============================================================
// DASHBOARD STATISTICS CONTROLLERS
// ============================================================

export async function getStatsOverviewController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsOverview(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch dashboard statistics.', toErrorCode(error));
  }
}

export async function getStatsUsersCountController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsUsersCount(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch users count.', toErrorCode(error));
  }
}

export async function getStatsDriversCountController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsDriversCount(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch drivers count.', toErrorCode(error));
  }
}

export async function getStatsCompaniesCountController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsCompaniesCount(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch companies count.', toErrorCode(error));
  }
}

export async function getStatsVehiclesCountController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsVehiclesCount(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch vehicles count.', toErrorCode(error));
  }
}

export async function getStatsDeliveriesActiveController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsDeliveriesActive(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch active deliveries count.', toErrorCode(error));
  }
}

export async function getStatsDeliveriesCompletedController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsDeliveriesCompleted(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch completed deliveries count.', toErrorCode(error));
  }
}

export async function getStatsRequestsPendingController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsRequestsPending(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch pending requests count.', toErrorCode(error));
  }
}

export async function getStatsDisputesOpenController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getStatsDisputesOpen(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch open disputes count.', toErrorCode(error));
  }
}

// ============================================================
// USER MANAGEMENT CONTROLLERS
// ============================================================

export async function listUsersController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listUsers(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch users.', toErrorCode(error));
  }
}

export async function getUserController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getUserById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    return sendError(res, 500, 'Unable to fetch user.', code);
  }
}

export async function updateUserController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateUserByAdmin(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    return sendError(res, 500, 'Unable to update user.', code);
  }
}

export async function changeUserRoleController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeUserRoleByAdmin(database, req.params.id, req.body?.role ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    if (code === 'INVALID_ROLE') return sendError(res, 400, 'Invalid role value provided.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot remove or demote the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to update user role.', code);
  }
}

export async function suspendUserController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await suspendUser(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot suspend the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to suspend user.', code);
  }
}

export async function activateUserController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await activateUser(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    return sendError(res, 500, 'Unable to activate user.', code);
  }
}

export async function deleteUserController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await deleteUserByAdmin(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot deactivate the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to deactivate user.', code);
  }
}

export async function getUserTripsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getUserTrips(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid user ID.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'User not found.', code);
    return sendError(res, 500, 'Unable to fetch user trips.', code);
  }
}

// ============================================================
// KYC CONTROLLERS
// ============================================================

export async function listKycController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listKycRequests(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch KYC requests.', toErrorCode(error));
  }
}

export async function getKycController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getKycById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid KYC identifier.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'KYC record not found.', code);
    return sendError(res, 500, 'Unable to fetch KYC details.', code);
  }
}

export async function approveKycController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await approveKyc(database, req.params.id, actorId ?? '', req.body?.reason ?? undefined);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid KYC identifier.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'KYC record not found.', code);
    return sendError(res, 500, 'Unable to approve KYC.', code);
  }
}

export async function rejectKycController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await rejectKyc(database, req.params.id, actorId ?? '', req.body?.reason ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid KYC identifier.', code);
    if (code === 'USER_NOT_FOUND') return sendError(res, 404, 'KYC record not found.', code);
    if (code === 'REJECTION_REASON_REQUIRED') return sendError(res, 400, 'A rejection reason is required.', code);
    return sendError(res, 500, 'Unable to reject KYC.', code);
  }
}

// ============================================================
// DRIVER MANAGEMENT CONTROLLERS
// ============================================================

export async function listDriversController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listDrivers(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch drivers.', toErrorCode(error));
  }
}

export async function getDriverController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDriverById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to fetch driver.', code);
  }
}

export async function updateDriverController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateDriverByAdmin(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    return sendError(res, 500, 'Unable to update driver.', code);
  }
}

export async function changeDriverStatusController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeDriverStatus(database, req.params.id, req.body?.status ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value. Must be ACTIVE, INACTIVE, or SUSPENDED.', code);
    return sendError(res, 500, 'Unable to update driver status.', code);
  }
}

export async function getDriverDocumentsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDriverDocuments(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to fetch driver documents.', code);
  }
}

export async function reviewDriverDocumentController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await reviewDriverDocument(
      database,
      req.params.id,
      req.params.doc_id,
      req.body,
      actorId ?? ''
    );
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID' || code === 'INVALID_DOCUMENT_ID') {
      return sendError(res, 400, 'Invalid ID provided.', code);
    }
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle/document not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status. Must be VERIFIED or REJECTED.', code);
    return sendError(res, 500, 'Unable to review document.', code);
  }
}

export async function getDriverRatingsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDriverRatings(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to fetch driver ratings.', code);
  }
}

export async function getDriverRatingStatsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDriverRatingStats(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to fetch driver rating statistics.', code);
  }
}

export async function getDriverTripsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDriverTrips(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid driver ID.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to fetch driver trips.', code);
  }
}

// ============================================================
// SHIPPER MANAGEMENT CONTROLLERS
// ============================================================

export async function listShippersController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listShippers(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch shippers.', toErrorCode(error));
  }
}

export async function getShipperController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getShipperById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipper ID.', code);
    if (code === 'SHIPPER_NOT_FOUND') return sendError(res, 404, 'Shipper not found.', code);
    return sendError(res, 500, 'Unable to fetch shipper.', code);
  }
}

export async function changeShipperStatusController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeShipperStatus(database, req.params.id, req.body?.status ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipper ID.', code);
    if (code === 'SHIPPER_NOT_FOUND') return sendError(res, 404, 'Shipper not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value. Must be ACTIVE, INACTIVE, or SUSPENDED.', code);
    return sendError(res, 500, 'Unable to update shipper status.', code);
  }
}

export async function getShipperTripsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getShipperTrips(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipper ID.', code);
    if (code === 'SHIPPER_NOT_FOUND') return sendError(res, 404, 'Shipper not found.', code);
    return sendError(res, 500, 'Unable to fetch shipper trips.', code);
  }
}

export async function getShipperPaymentsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getShipperPayments(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipper ID.', code);
    if (code === 'SHIPPER_NOT_FOUND') return sendError(res, 404, 'Shipper not found.', code);
    return sendError(res, 500, 'Unable to fetch shipper payments.', code);
  }
}

// ============================================================
// COMPANY MANAGEMENT CONTROLLERS
// ============================================================

export async function listCompaniesController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listCompanies(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch companies.', toErrorCode(error));
  }
}

export async function getCompanyController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getCompanyById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to fetch company.', code);
  }
}

export async function updateCompanyController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateCompanyByAdmin(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    return sendError(res, 500, 'Unable to update company.', code);
  }
}

export async function changeCompanyStatusController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeCompanyStatus(database, req.params.id, req.body?.status ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value.', code);
    return sendError(res, 500, 'Unable to update company status.', code);
  }
}

export async function verifyCompanyController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await verifyCompanyByAdmin(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to verify company.', code);
  }
}

export async function getCompanyVehiclesController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getCompanyVehicles(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to fetch company vehicles.', code);
  }
}

export async function getCompanyDriversController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getCompanyDrivers(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to fetch company drivers.', code);
  }
}

export async function getCompanyTripsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getCompanyTrips(database, req.params.id, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to fetch company trips.', code);
  }
}

export async function getCompanyRatingStatsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getCompanyRatingStats(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid company ID.', code);
    return sendError(res, 500, 'Unable to fetch company rating statistics.', code);
  }
}

// ============================================================
// VEHICLE MANAGEMENT CONTROLLERS
// ============================================================

export async function listVehiclesController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listVehicles(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch vehicles.', toErrorCode(error));
  }
}

export async function getVehicleController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getVehicleById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid vehicle ID.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle not found.', code);
    return sendError(res, 500, 'Unable to fetch vehicle.', code);
  }
}

export async function updateVehicleController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateVehicle(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid vehicle ID.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    return sendError(res, 500, 'Unable to update vehicle.', code);
  }
}

export async function updateVehicleStatusController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateVehicleStatus(database, req.params.id, req.body?.status ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid vehicle ID.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value.', code);
    return sendError(res, 500, 'Unable to update vehicle status.', code);
  }
}

export async function verifyVehicleController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await verifyVehicle(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid vehicle ID.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle not found.', code);
    return sendError(res, 500, 'Unable to verify vehicle.', code);
  }
}

export async function rejectVehicleController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await rejectVehicle(database, req.params.id, actorId ?? '', req.body?.reason ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid vehicle ID.', code);
    if (code === 'VEHICLE_NOT_FOUND') return sendError(res, 404, 'Vehicle not found.', code);
    return sendError(res, 500, 'Unable to reject vehicle.', code);
  }
}

// ============================================================
// LOAD MANAGEMENT CONTROLLERS
// ============================================================

export async function listLoadsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listLoads(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch loads.', toErrorCode(error));
  }
}

export async function getLoadController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getLoadById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid load ID.', code);
    if (code === 'LOAD_NOT_FOUND') return sendError(res, 404, 'Load not found.', code);
    if (code === 'LOADS_NOT_CONFIGURED') return sendError(res, 501, 'Load management is not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch load.', code);
  }
}

export async function updateLoadController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateLoadByAdmin(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid load ID.', code);
    if (code === 'LOAD_NOT_FOUND') return sendError(res, 404, 'Load not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    if (code === 'LOADS_NOT_CONFIGURED') return sendError(res, 501, 'Load management is not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to update load.', code);
  }
}

// ============================================================
// TRANSPORT REQUEST CONTROLLERS
// ============================================================

export async function listRequestsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listRequests(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch transport requests.', toErrorCode(error));
  }
}

export async function getRequestController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getRequestById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid request ID.', code);
    if (code === 'REQUEST_NOT_FOUND') return sendError(res, 404, 'Request not found.', code);
    return sendError(res, 500, 'Unable to fetch request.', code);
  }
}

export async function assignDriverController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await assignDriverToRequest(
      database,
      req.params.id,
      req.body?.driver_id ?? '',
      actorId ?? ''
    );
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID' || code === 'INVALID_DRIVER_ID') {
      return sendError(res, 400, 'Invalid ID provided.', code);
    }
    if (code === 'REQUEST_NOT_FOUND') return sendError(res, 404, 'Request not found.', code);
    if (code === 'DRIVER_NOT_FOUND') return sendError(res, 404, 'Driver not found.', code);
    return sendError(res, 500, 'Unable to assign driver.', code);
  }
}

export async function assignCompanyController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await assignCompanyToRequest(
      database,
      req.params.id,
      req.body?.company_id ?? '',
      actorId ?? ''
    );
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID' || code === 'INVALID_COMPANY_ID') {
      return sendError(res, 400, 'Invalid ID provided.', code);
    }
    if (code === 'REQUEST_NOT_FOUND') return sendError(res, 404, 'Request not found.', code);
    if (code === 'COMPANY_NOT_FOUND') return sendError(res, 404, 'Company not found.', code);
    return sendError(res, 500, 'Unable to assign company.', code);
  }
}

export async function cancelRequestController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await cancelRequest(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid request ID.', code);
    if (code === 'REQUEST_NOT_FOUND') return sendError(res, 404, 'Request not found.', code);
    return sendError(res, 500, 'Unable to cancel request.', code);
  }
}

// ============================================================
// DELIVERY MANAGEMENT CONTROLLERS
// ============================================================

export async function listDeliveriesController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listDeliveries(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch deliveries.', toErrorCode(error));
  }
}

export async function getDeliveryController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDeliveryById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid delivery ID.', code);
    if (code === 'DELIVERY_NOT_FOUND') return sendError(res, 404, 'Delivery not found.', code);
    return sendError(res, 500, 'Unable to fetch delivery.', code);
  }
}

export async function changeDeliveryStatusController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeDeliveryStatus(database, req.params.id, req.body?.status ?? '', actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid delivery ID.', code);
    if (code === 'DELIVERY_NOT_FOUND') return sendError(res, 404, 'Delivery not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value.', code);
    return sendError(res, 500, 'Unable to update delivery status.', code);
  }
}

export async function cancelDeliveryController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await cancelDelivery(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid delivery ID.', code);
    if (code === 'DELIVERY_NOT_FOUND') return sendError(res, 404, 'Delivery not found.', code);
    return sendError(res, 500, 'Unable to cancel delivery.', code);
  }
}

export async function getDeliveryPaymentController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDeliveryPayment(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid delivery ID.', code);
    if (code === 'DELIVERY_NOT_FOUND') return sendError(res, 404, 'Delivery not found.', code);
    return sendError(res, 500, 'Unable to fetch delivery payment.', code);
  }
}

// ============================================================
// PAYMENTS & FINANCIAL MANAGEMENT CONTROLLERS
// ============================================================

export async function listPaymentsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listPayments(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch payments.', toErrorCode(error));
  }
}

export async function getPaymentController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getPaymentById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid payment ID.', code);
    if (code === 'PAYMENT_NOT_FOUND') return sendError(res, 404, 'Payment not found.', code);
    return sendError(res, 500, 'Unable to fetch payment.', code);
  }
}

export async function releasePaymentController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await releasePayment(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid payment ID.', code);
    if (code === 'PAYMENT_NOT_FOUND') return sendError(res, 404, 'Payment not found.', code);
    if (code === 'PAYMENT_NOT_PENDING') return sendError(res, 400, 'Payment is not in pending state.', code);
    return sendError(res, 500, 'Unable to release payment.', code);
  }
}

export async function freezePaymentController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await freezePayment(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid payment ID.', code);
    if (code === 'PAYMENT_NOT_FOUND') return sendError(res, 404, 'Payment not found.', code);
    if (code === 'PAYMENT_ALREADY_FROZEN') return sendError(res, 400, 'Payment is already frozen.', code);
    if (code === 'PAYMENTS_NOT_CONFIGURED') return sendError(res, 501, 'Payments are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to freeze payment.', code);
  }
}

export async function refundPaymentController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await refundPayment(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid payment ID.', code);
    if (code === 'PAYMENT_NOT_FOUND') return sendError(res, 404, 'Payment not found.', code);
    if (code === 'PAYMENT_ALREADY_REFUNDED') return sendError(res, 400, 'Payment has already been refunded.', code);
    return sendError(res, 500, 'Unable to refund payment.', code);
  }
}

// ============================================================
// RATING CONTROLLERS
// ============================================================

export async function listRatingsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await listRatings(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch ratings.', toErrorCode(error));
  }
}

export async function getRatingController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getRatingById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid rating ID.', code);
    if (code === 'RATING_NOT_FOUND') return sendError(res, 404, 'Rating not found.', code);
    if (code === 'RATINGS_NOT_CONFIGURED') return sendError(res, 501, 'Ratings are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch rating.', code);
  }
}

export async function deleteRatingController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await deleteRating(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid rating ID.', code);
    if (code === 'RATING_NOT_FOUND') return sendError(res, 404, 'Rating not found.', code);
    if (code === 'RATINGS_NOT_CONFIGURED') return sendError(res, 501, 'Ratings are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to delete rating.', code);
  }
}

// ============================================================
// REPORT CONTROLLERS
// ============================================================

export async function generateRevenueReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await generateRevenueReport(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to generate revenue report.', toErrorCode(error));
  }
}

export async function generateUserReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await generateUserReport(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to generate user report.', toErrorCode(error));
  }
}

export async function generateDriverReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await generateDriverReport(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to generate driver report.', toErrorCode(error));
  }
}

export async function generateCompanyReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await generateCompanyReport(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to generate company report.', toErrorCode(error));
  }
}

export async function generateDeliveryReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await generateDeliveryReport(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to generate delivery report.', toErrorCode(error));
  }
}

export async function exportReportController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await exportReport(database, req.params.type, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to export report.', toErrorCode(error));
  }
}

// ============================================================
// NOTIFICATION CONTROLLERS
// ============================================================

export async function listNotificationsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await listNotifications(database, actorId, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch notifications.', toErrorCode(error));
  }
}

export async function markNotificationReadController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await markNotificationRead(database, req.params.id, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid notification ID.', code);
    if (code === 'NOTIFICATION_NOT_FOUND') return sendError(res, 404, 'Notification not found.', code);
    return sendError(res, 500, 'Unable to mark notification as read.', code);
  }
}

export async function markAllReadController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await markAllNotificationsRead(database, actorId);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to mark all notifications as read.', toErrorCode(error));
  }
}

export async function sendNotificationController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await sendNotification(database, req.body, actorId);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to send notification.', toErrorCode(error));
  }
}

export async function broadcastNotificationController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await broadcastNotification(database, req.body, actorId);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to broadcast notification.', toErrorCode(error));
  }
}

export async function deleteNotificationController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await deleteNotification(database, req.params.id, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid notification ID.', code);
    if (code === 'NOTIFICATION_NOT_FOUND') return sendError(res, 404, 'Notification not found.', code);
    return sendError(res, 500, 'Unable to delete notification.', code);
  }
}

// ============================================================
// SETTINGS CONTROLLERS
// ============================================================

export async function getSettingsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getPlatformSettings(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch settings.', toErrorCode(error));
  }
}

export async function updateSettingsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updatePlatformSettings(database, req.body, actorId);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to update settings.', toErrorCode(error));
  }
}

export async function getNotificationSettingsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getNotificationSettings(database);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch notification settings.', toErrorCode(error));
  }
}

export async function updateNotificationSettingsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateNotificationSettings(database, req.body, actorId);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to update notification settings.', toErrorCode(error));
  }
}

// ============================================================
// ADMIN MANAGEMENT CONTROLLERS
// ============================================================

export async function listAdminsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await listAdmins(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch admins.', toErrorCode(error));
  }
}

export async function createAdminController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await createAdmin(database, req.body, actorId);
    return res.status(201).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'MISSING_FIELDS') return sendError(res, 400, 'Required fields are missing.', code);
    if (code === 'DUPLICATE_EMAIL') return sendError(res, 409, 'Email already in use.', code);
    if (code === 'DUPLICATE_PHONE') return sendError(res, 409, 'Phone number already in use.', code);
    return sendError(res, 500, 'Unable to create admin.', code);
  }
}

export async function getAdminController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const result = await getAdminById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid admin ID.', code);
    if (code === 'ADMIN_NOT_FOUND') return sendError(res, 404, 'Admin not found.', code);
    return sendError(res, 500, 'Unable to fetch admin.', code);
  }
}

export async function updateAdminController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateAdmin(database, req.params.id, req.body, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid admin ID.', code);
    if (code === 'ADMIN_NOT_FOUND') return sendError(res, 404, 'Admin not found.', code);
    if (code === 'PROHIBITED_FIELD') return sendError(res, 400, 'Attempt to modify a protected field.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot modify the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to update admin.', code);
  }
}

export async function changeAdminStatusController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await changeAdminStatus(database, req.params.id, req.body?.status, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid admin ID.', code);
    if (code === 'ADMIN_NOT_FOUND') return sendError(res, 404, 'Admin not found.', code);
    if (code === 'INVALID_STATUS') return sendError(res, 400, 'Invalid status value.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot change status of the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to update admin status.', code);
  }
}

export async function updateAdminPermissionsController(
  req: Request,
  res: Response,
  database: Knex = db
) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateAdminPermissions(database, req.params.id, req.body?.permissions, actorId);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid admin ID.', code);
    if (code === 'ADMIN_NOT_FOUND') return sendError(res, 404, 'Admin not found.', code);
    if (code === 'INVALID_PERMISSIONS') return sendError(res, 400, 'Invalid permissions format.', code);
    if (code === 'LAST_ADMIN_PROTECTION') return sendError(res, 400, 'Cannot modify permissions of the final remaining administrator.', code);
    return sendError(res, 500, 'Unable to update admin permissions.', code);
  }
}

// ============================================================
// SHIPMENT MANAGEMENT CONTROLLERS (501 stubs)
// ============================================================

export async function listShipmentsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listShipments(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'SHIPMENTS_NOT_CONFIGURED') return sendError(res, 501, 'Shipments are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch shipments.', code);
  }
}

export async function getShipmentController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getShipmentById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipment ID.', code);
    if (code === 'SHIPMENT_NOT_FOUND') return sendError(res, 404, 'Shipment not found.', code);
    if (code === 'SHIPMENTS_NOT_CONFIGURED') return sendError(res, 501, 'Shipments are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch shipment.', code);
  }
}

export async function updateShipmentController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await updateShipmentByAdmin(database, req.params.id, req.body ?? {}, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid shipment ID.', code);
    if (code === 'SHIPMENT_NOT_FOUND') return sendError(res, 404, 'Shipment not found.', code);
    if (code === 'SHIPMENTS_NOT_CONFIGURED') return sendError(res, 501, 'Shipments are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to update shipment.', code);
  }
}

// ============================================================
// ESCROW, TRANSACTIONS, COMMISSIONS CONTROLLERS (501 stubs)
// ============================================================

export async function listEscrowController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listEscrow(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'ESCROW_NOT_CONFIGURED') return sendError(res, 501, 'Escrow ledger is not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch escrow records.', code);
  }
}

export async function listTransactionsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listTransactions(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'TRANSACTIONS_NOT_CONFIGURED') return sendError(res, 501, 'Transactions are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch transactions.', code);
  }
}

export async function listCommissionsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listCommissions(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'COMMISSIONS_NOT_CONFIGURED') return sendError(res, 501, 'Commissions ledger is not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch commission details.', code);
  }
}

// ============================================================
// DISPUTE MANAGEMENT CONTROLLERS (501 stubs)
// ============================================================

export async function listDisputesController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listDisputes(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'DISPUTES_NOT_CONFIGURED') return sendError(res, 501, 'Disputes are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch disputes.', code);
  }
}

export async function getDisputeController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getDisputeById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid dispute ID.', code);
    if (code === 'DISPUTE_NOT_FOUND') return sendError(res, 404, 'Dispute not found.', code);
    if (code === 'DISPUTES_NOT_CONFIGURED') return sendError(res, 501, 'Disputes are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to fetch dispute.', code);
  }
}

export async function resolveDisputeController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await resolveDispute(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid dispute ID.', code);
    if (code === 'DISPUTE_NOT_FOUND') return sendError(res, 404, 'Dispute not found.', code);
    if (code === 'DISPUTES_NOT_CONFIGURED') return sendError(res, 501, 'Disputes are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to resolve dispute.', code);
  }
}

export async function rejectDisputeController(req: Request, res: Response, database: Knex = db) {
  try {
    const actorId = (req as { user?: { userId?: string } }).user?.userId ?? null;
    const result = await rejectDispute(database, req.params.id, actorId ?? '');
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid dispute ID.', code);
    if (code === 'DISPUTE_NOT_FOUND') return sendError(res, 404, 'Dispute not found.', code);
    if (code === 'DISPUTES_NOT_CONFIGURED') return sendError(res, 501, 'Disputes are not configured in the current database schema.', code);
    return sendError(res, 500, 'Unable to reject dispute.', code);
  }
}

// ============================================================
// AUDIT LOG MANAGEMENT CONTROLLERS
// ============================================================

export async function listAuditLogsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await listAuditLogs(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to fetch audit logs.', toErrorCode(error));
  }
}

export async function getAuditLogController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await getAuditLogById(database, req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const code = toErrorCode(error);
    if (code === 'INVALID_ID') return sendError(res, 400, 'Invalid audit log ID.', code);
    if (code === 'AUDIT_LOG_NOT_FOUND') return sendError(res, 404, 'Audit log not found.', code);
    return sendError(res, 500, 'Unable to fetch audit log.', code);
  }
}

export async function exportAuditLogsController(req: Request, res: Response, database: Knex = db) {
  try {
    const result = await exportAuditLogs(database, req.query as Record<string, string>);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, 500, 'Unable to export audit logs.', toErrorCode(error));
  }
}