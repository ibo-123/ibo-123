import { api } from './api';
import type {
  AdminDashboardStats,
  AdminUser,
  ApiResponse,
  AuditLogRecord,
  KycRecord,
  LoadRecord,
  PaginatedData,
  VehicleRecord,
} from '../types/person2';

type QueryParams = Record<string, string | number | undefined>;

function toQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });
  const q = search.toString();
  return q ? `?${q}` : '';
}

export const adminApi = {
  getDashboard: () =>
    api.get<ApiResponse<AdminDashboardStats>>('/admin/dashboard'),

  getAnalytics: () => api.get<ApiResponse<Record<string, unknown>>>('/admin/analytics'),

  getSystemHealth: () =>
    api.get<ApiResponse<Record<string, unknown>>>('/admin/system-health'),

  listUsers: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<AdminUser>>>(`/admin/users${toQuery(params)}`),

  getUser: (id: string) => api.get<ApiResponse<AdminUser>>(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<AdminUser>) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}`, data),

  changeUserRole: (id: string, role: string) =>
    api.patch<ApiResponse<AdminUser>>(`/admin/users/${id}/role`, { role }),

  suspendUser: (id: string) =>
    api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/suspend`, undefined),

  activateUser: (id: string) =>
    api.post<ApiResponse<AdminUser>>(`/admin/users/${id}/activate`, undefined),

  deleteUser: (id: string) =>
    api.delete<ApiResponse<AdminUser>>(`/admin/users/${id}`),

  listKyc: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<KycRecord>>>(`/admin/kyc${toQuery(params)}`),

  getKyc: (id: string) => api.get<ApiResponse<KycRecord>>(`/admin/kyc/${id}`),

  approveKyc: (id: string) =>
    api.post<ApiResponse<KycRecord>>(`/admin/kyc/${id}/approve`, undefined),

  rejectKyc: (id: string, reason: string) =>
    api.post<ApiResponse<KycRecord>>(`/admin/kyc/${id}/reject`, { reason }),

  listVehicles: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<VehicleRecord>>>(
      `/admin/vehicles${toQuery(params)}`),

  getVehicle: (id: string) =>
    api.get<ApiResponse<VehicleRecord>>(`/admin/vehicles/${id}`),

  verifyVehicle: (id: string) =>
    api.post<ApiResponse<VehicleRecord>>(`/admin/vehicles/${id}/verify`, undefined),

  rejectVehicle: (id: string, reason: string) =>
    api.post<ApiResponse<VehicleRecord>>(
      `/admin/vehicles/${id}/reject`,
      { reason }),

  listLoads: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<LoadRecord>>>(`/admin/loads${toQuery(params)}`),

  getLoad: (id: string) => api.get<ApiResponse<LoadRecord>>(`/admin/loads/${id}`),

  updateLoad: (id: string, data: Partial<LoadRecord>) =>
    api.patch<ApiResponse<LoadRecord>>(`/admin/loads/${id}`, data),

  listAuditLogs: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<AuditLogRecord>>>(
      `/admin/audit-logs${toQuery(params)}`),

  listEscrow: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<Record<string, unknown>>>>(
      `/admin/escrow${toQuery(params)}`),

  listTransactions: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<Record<string, unknown>>>>(
      `/admin/transactions${toQuery(params)}`),

  listDisputes: (params?: QueryParams) =>
    api.get<ApiResponse<PaginatedData<Record<string, unknown>>>>(
      `/admin/disputes${toQuery(params)}`),
};
