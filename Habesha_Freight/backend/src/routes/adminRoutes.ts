import { Router } from 'express';
import type { Knex } from 'knex';
import db from '../config/db';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import {
  activateUserController,
  adminFaydaVerifyController,
  adminLoginController,
  adminLogoutController,
  adminMeController,
  adminRefreshController,
  analyticsController,
  approveKycController,
  assignCompanyController,
  assignDriverController,
  broadcastNotificationController,
  cancelDeliveryController,
  cancelRequestController,
  changeAdminStatusController,
  changeCompanyStatusController,
  changeDeliveryStatusController,
  changeDriverStatusController,
  changeShipperStatusController,
  changeUserRoleController,
  createAdminController,
  dashboardController,
  deleteNotificationController,
  deleteRatingController,
  deleteUserController,
  exportAuditLogsController,
  exportReportController,
  freezePaymentController,
  generateCompanyReportController,
  generateDeliveryReportController,
  generateDriverReportController,
  generateRevenueReportController,
  generateUserReportController,
  getAdminController,
  getAuditLogController,
  getCompanyController,
  getCompanyDriversController,
  getCompanyRatingStatsController,
  getCompanyTripsController,
  getCompanyVehiclesController,
  getDeliveryController,
  getDeliveryPaymentController,
  getDisputeController,
  getDriverController,
  getDriverDocumentsController,
  getDriverRatingStatsController,
  getDriverRatingsController,
  getDriverTripsController,
  getKycController,
  getLoadController,
  getNotificationSettingsController,
  getPaymentController,
  getRatingController,
  getRequestController,
  getSettingsController,
  getShipmentController,
  getShipperController,
  getShipperPaymentsController,
  getShipperTripsController,
  getStatsCompaniesCountController,
  getStatsDeliveriesActiveController,
  getStatsDeliveriesCompletedController,
  getStatsDisputesOpenController,
  getStatsDriversCountController,
  getStatsOverviewController,
  getStatsRequestsPendingController,
  getStatsUsersCountController,
  getStatsVehiclesCountController,
  getUserController,
  getUserTripsController,
  getVehicleController,
  listAdminsController,
  listAuditLogsController,
  listCommissionsController,
  listCompaniesController,
  listDeliveriesController,
  listDisputesController,
  listDriversController,
  listEscrowController,
  listKycController,
  listLoadsController,
  listNotificationsController,
  listPaymentsController,
  listRatingsController,
  listRequestsController,
  listShipmentsController,
  listShippersController,
  listTransactionsController,
  listUsersController,
  listVehiclesController,
  markAllReadController,
  markNotificationReadController,
  refundPaymentController,
  rejectDisputeController,
  rejectKycController,
  rejectVehicleController,
  releasePaymentController,
  resolveDisputeController,
  reviewDriverDocumentController,
  sendNotificationController,
  suspendUserController,
  systemHealthController,
  updateAdminController,
  updateAdminPermissionsController,
  updateCompanyController,
  updateDriverController,
  updateLoadController,
  updateNotificationSettingsController,
  updateSettingsController,
  updateShipmentController,
  updateUserController,
  updateVehicleController,
  updateVehicleStatusController,
  verifyCompanyController,
  verifyVehicleController,
} from '../controllers/adminController';

export function createAdminRouter(database: Knex = db) {
  const router = Router();

  // ============================================================
  // AUTHENTICATION & AUTHORIZATION
  // ============================================================
  // NOTE: Auth routes (/auth/login, /auth/refresh, etc.) are placed BEFORE
  // the authentication middleware to allow unauthenticated access.
  // Protected routes are placed AFTER the middleware.

  // ============================================================
  // SECTION 1 — ADMIN AUTHENTICATION (Public - No Auth Required)
  // ============================================================
  router.post('/auth/login', (req, res) => adminLoginController(req, res, database));
  router.post('/auth/refresh', (req, res) => adminRefreshController(req, res, database));
  router.post('/auth/fayda-verify', (req, res) => adminFaydaVerifyController(req, res, database));

  // ============================================================
  // PROTECTED ROUTES — All routes below require authentication
  // ============================================================
  router.use(authenticateToken);
  router.use(authorizeRoles('ADMIN'));

  // Auth routes that require authentication
  router.post('/auth/logout', (req, res) => adminLogoutController(req, res, database));
  router.get('/auth/me', (req, res) => adminMeController(req, res, database));

  // ============================================================
  // SECTION 2 — DASHBOARD STATISTICS
  // ============================================================
  router.get('/dashboard', (req, res) => dashboardController(req, res, database));
  router.get('/analytics', (req, res) => analyticsController(req, res, database));
  router.get('/system-health', (req, res) => systemHealthController(req, res, database));

  // ============================================================
  // SECTION 2.1 — DASHBOARD STATISTICS (Detailed)
  // ============================================================
  router.get('/stats/overview', (req, res) => getStatsOverviewController(req, res, database));
  router.get('/stats/users/count', (req, res) => getStatsUsersCountController(req, res, database));
  router.get('/stats/drivers/count', (req, res) => getStatsDriversCountController(req, res, database));
  router.get('/stats/companies/count', (req, res) => getStatsCompaniesCountController(req, res, database));
  router.get('/stats/vehicles/count', (req, res) => getStatsVehiclesCountController(req, res, database));
  router.get('/stats/deliveries/active', (req, res) => getStatsDeliveriesActiveController(req, res, database));
  router.get('/stats/deliveries/completed', (req, res) => getStatsDeliveriesCompletedController(req, res, database));
  router.get('/stats/requests/pending', (req, res) => getStatsRequestsPendingController(req, res, database));
  router.get('/stats/disputes/open', (req, res) => getStatsDisputesOpenController(req, res, database));

  // ============================================================
  // SECTION 3 — USER MANAGEMENT
  // ============================================================
  router.get('/users', (req, res) => listUsersController(req, res, database));
  router.get('/users/:id', (req, res) => getUserController(req, res, database));
  router.put('/users/:id', (req, res) => updateUserController(req, res, database));
  router.patch('/users/:id', (req, res) => updateUserController(req, res, database));
  router.patch('/users/:id/status', (req, res) => updateUserController(req, res, database));
  router.patch('/users/:id/role', (req, res) => changeUserRoleController(req, res, database));
  router.post('/users/:id/suspend', (req, res) => suspendUserController(req, res, database));
  router.post('/users/:id/activate', (req, res) => activateUserController(req, res, database));
  router.delete('/users/:id', (req, res) => deleteUserController(req, res, database));
  router.get('/users/:id/trips', (req, res) => getUserTripsController(req, res, database));

  // ============================================================
  // SECTION 4 — DRIVER MANAGEMENT
  // ============================================================
  router.get('/drivers', (req, res) => listDriversController(req, res, database));
  router.get('/drivers/:id', (req, res) => getDriverController(req, res, database));
  router.put('/drivers/:id', (req, res) => updateDriverController(req, res, database));
  router.patch('/drivers/:id/status', (req, res) => changeDriverStatusController(req, res, database));
  router.get('/drivers/:id/documents', (req, res) => getDriverDocumentsController(req, res, database));
  router.patch('/drivers/:id/documents/:doc_id', (req, res) => reviewDriverDocumentController(req, res, database));
  router.get('/drivers/:id/ratings', (req, res) => getDriverRatingsController(req, res, database));
  router.get('/drivers/:id/rating-stats', (req, res) => getDriverRatingStatsController(req, res, database));
  router.get('/drivers/:id/trips', (req, res) => getDriverTripsController(req, res, database));

  // ============================================================
  // SECTION 5 — SHIPPER MANAGEMENT
  // ============================================================
  router.get('/shippers', (req, res) => listShippersController(req, res, database));
  router.get('/shippers/:id', (req, res) => getShipperController(req, res, database));
  router.patch('/shippers/:id/status', (req, res) => changeShipperStatusController(req, res, database));
  router.get('/shippers/:id/trips', (req, res) => getShipperTripsController(req, res, database));
  router.get('/shippers/:id/payments', (req, res) => getShipperPaymentsController(req, res, database));

  // ============================================================
  // SECTION 6 — COMPANY MANAGEMENT
  // ============================================================
  router.get('/companies', (req, res) => listCompaniesController(req, res, database));
  router.get('/companies/:id', (req, res) => getCompanyController(req, res, database));
  router.put('/companies/:id', (req, res) => updateCompanyController(req, res, database));
  router.patch('/companies/:id/status', (req, res) => changeCompanyStatusController(req, res, database));
  router.patch('/companies/:id/verify', (req, res) => verifyCompanyController(req, res, database));
  router.get('/companies/:id/vehicles', (req, res) => getCompanyVehiclesController(req, res, database));
  router.get('/companies/:id/drivers', (req, res) => getCompanyDriversController(req, res, database));
  router.get('/companies/:id/trips', (req, res) => getCompanyTripsController(req, res, database));
  router.get('/companies/:id/rating-stats', (req, res) => getCompanyRatingStatsController(req, res, database));

  // ============================================================
  // SECTION 7 — VEHICLE MANAGEMENT
  // ============================================================
  router.get('/vehicles', (req, res) => listVehiclesController(req, res, database));
  router.get('/vehicles/:id', (req, res) => getVehicleController(req, res, database));
  router.put('/vehicles/:id', (req, res) => updateVehicleController(req, res, database));
  router.patch('/vehicles/:id/status', (req, res) => updateVehicleStatusController(req, res, database));
  router.post('/vehicles/:id/verify', (req, res) => verifyVehicleController(req, res, database));
  router.post('/vehicles/:id/reject', (req, res) => rejectVehicleController(req, res, database));

  // ============================================================
  // SECTION 8 — LOAD MANAGEMENT
  // ============================================================
  router.get('/loads', (req, res) => listLoadsController(req, res, database));
  router.get('/loads/:id', (req, res) => getLoadController(req, res, database));
  router.patch('/loads/:id', (req, res) => updateLoadController(req, res, database));

  // ============================================================
  // SECTION 9 — DELIVERY MANAGEMENT
  // ============================================================
  router.get('/deliveries', (req, res) => listDeliveriesController(req, res, database));
  router.get('/deliveries/:id', (req, res) => getDeliveryController(req, res, database));
  router.patch('/deliveries/:id/status', (req, res) => changeDeliveryStatusController(req, res, database));
  router.patch('/deliveries/:id/cancel', (req, res) => cancelDeliveryController(req, res, database));
  router.get('/deliveries/:id/payment', (req, res) => getDeliveryPaymentController(req, res, database));

  // ============================================================
  // SECTION 10 — TRANSPORT REQUEST MANAGEMENT
  // ============================================================
  router.get('/requests', (req, res) => listRequestsController(req, res, database));
  router.get('/requests/:id', (req, res) => getRequestController(req, res, database));
  router.patch('/requests/:id/assign-driver', (req, res) => assignDriverController(req, res, database));
  router.patch('/requests/:id/assign-company', (req, res) => assignCompanyController(req, res, database));
  router.patch('/requests/:id/cancel', (req, res) => cancelRequestController(req, res, database));

  // ============================================================
  // SECTION 11 — VERIFICATION & COMPLIANCE (KYC)
  // ============================================================
  router.get('/kyc', (req, res) => listKycController(req, res, database));
  router.get('/kyc/:id', (req, res) => getKycController(req, res, database));
  router.post('/kyc/:id/approve', (req, res) => approveKycController(req, res, database));
  router.post('/kyc/:id/reject', (req, res) => rejectKycController(req, res, database));

  // ============================================================
  // SECTION 12 — RATINGS
  // ============================================================
  router.get('/ratings', (req, res) => listRatingsController(req, res, database));
  router.get('/ratings/:id', (req, res) => getRatingController(req, res, database));
  router.delete('/ratings/:id', (req, res) => deleteRatingController(req, res, database));

  // ============================================================
  // SECTION 13 — PAYMENTS & FINANCIAL MANAGEMENT
  // ============================================================
  router.get('/payments', (req, res) => listPaymentsController(req, res, database));
  router.get('/payments/:id', (req, res) => getPaymentController(req, res, database));
  router.patch('/payments/:id/release', (req, res) => releasePaymentController(req, res, database));
  router.patch('/payments/:id/freeze', (req, res) => freezePaymentController(req, res, database));
  router.post('/payments/:id/refund', (req, res) => refundPaymentController(req, res, database));

  // ============================================================
  // SECTION 14 — DISPUTES
  // ============================================================
  router.get('/disputes', (req, res) => listDisputesController(req, res, database));
  router.get('/disputes/:id', (req, res) => getDisputeController(req, res, database));
  // POST methods as expected by tests
  router.post('/disputes/:id/resolve', (req, res) => resolveDisputeController(req, res, database));
  router.post('/disputes/:id/reject', (req, res) => rejectDisputeController(req, res, database));

  // ============================================================
  // SECTION 15 — REPORTS & ANALYTICS
  // ============================================================
  router.get('/reports/revenue', (req, res) => generateRevenueReportController(req, res, database));
  router.get('/reports/users', (req, res) => generateUserReportController(req, res, database));
  router.get('/reports/drivers', (req, res) => generateDriverReportController(req, res, database));
  router.get('/reports/companies', (req, res) => generateCompanyReportController(req, res, database));
  router.get('/reports/deliveries', (req, res) => generateDeliveryReportController(req, res, database));
  router.get('/reports/:type/export', (req, res) => exportReportController(req, res, database));

  // ============================================================
  // SECTION 16 — NOTIFICATIONS
  // ============================================================
  router.get('/notifications', (req, res) => listNotificationsController(req, res, database));
  router.patch('/notifications/:id/read', (req, res) => markNotificationReadController(req, res, database));
  router.patch('/notifications/read-all', (req, res) => markAllReadController(req, res, database));
  router.post('/notifications/send', (req, res) => sendNotificationController(req, res, database));
  router.post('/notifications/broadcast', (req, res) => broadcastNotificationController(req, res, database));
  router.delete('/notifications/:id', (req, res) => deleteNotificationController(req, res, database));

  // ============================================================
  // SECTION 17 — PLATFORM SETTINGS
  // ============================================================
  router.get('/settings', (req, res) => getSettingsController(req, res, database));
  router.put('/settings', (req, res) => updateSettingsController(req, res, database));
  router.get('/settings/notifications', (req, res) => getNotificationSettingsController(req, res, database));
  router.put('/settings/notifications', (req, res) => updateNotificationSettingsController(req, res, database));

  // ============================================================
  // SECTION 18 — ADMIN MANAGEMENT
  // ============================================================
  router.get('/admins', (req, res) => listAdminsController(req, res, database));
  router.post('/admins', (req, res) => createAdminController(req, res, database));
  router.get('/admins/:id', (req, res) => getAdminController(req, res, database));
  router.put('/admins/:id', (req, res) => updateAdminController(req, res, database));
  router.patch('/admins/:id/status', (req, res) => changeAdminStatusController(req, res, database));
  router.patch('/admins/:id/permissions', (req, res) => updateAdminPermissionsController(req, res, database));

  // ============================================================
  // SECTION 19 — AUDIT LOGS
  // ============================================================
  router.get('/audit-logs', (req, res) => listAuditLogsController(req, res, database));
  router.get('/audit-logs/:id', (req, res) => getAuditLogController(req, res, database));
  router.get('/audit-logs/export', (req, res) => exportAuditLogsController(req, res, database));

  // ============================================================
  // LEGACY / COMPATIBILITY ENDPOINTS (501 stubs)
  // ============================================================
  router.get('/shipments', (req, res) => listShipmentsController(req, res, database));
  router.get('/shipments/:id', (req, res) => getShipmentController(req, res, database));
  router.patch('/shipments/:id', (req, res) => updateShipmentController(req, res, database));

  router.get('/escrow', (req, res) => listEscrowController(req, res, database));
  router.get('/transactions', (req, res) => listTransactionsController(req, res, database));
  router.get('/commissions', (req, res) => listCommissionsController(req, res, database));

  return router;
}

export default createAdminRouter;