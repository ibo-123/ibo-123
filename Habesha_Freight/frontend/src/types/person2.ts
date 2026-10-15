export type BackendRole = 'SHIPPER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: { code: string };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface AuthUser {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string | null;
  role: BackendRole;
  is_verified?: boolean;
  status?: string;
  kyc_status?: string;
}

export interface LoadStat {
  total: number;
  active: number;
  completed: number;
  pendingBids: number;
  totalSpend: number;
}


export interface AdminDashboardStats {
  totalUsers: number;
  totalShippers: number;
  totalDrivers: number;
  totalFleetOwners: number;
  totalVehicles: number;
  totalLoads: number;
  pendingKyc: number;
  pendingVehicleVerifications: number;
  activeLoads: number;
  completedLoads: number;
}

export interface AdminUser {
  id: string;
  full_name: string;
  phone_number: string;
  email?: string | null;
  role: BackendRole;
  is_verified: boolean;
  is_active?: boolean;
  created_at: string;
}

export interface KycRecord {
  id: string;
  user_id: string;
  full_name?: string;
  phone_number?: string;
  role?: BackendRole;
  status: string;
  document_type?: string;
  submitted_at?: string;
}

export interface VehicleRecord {
  id: string;
  owner_id: string;
  plate_number: string;
  vehicle_type: string;
  capacity_tons?: number;
  verification_status: string;
  created_at?: string;
}

export interface LoadRecord {
  id: string;
  shipper_id: string;
  origin: string;
  destination: string;
  cargo_type?: string;
  weight_tons?: number;
  status: string;
  created_at?: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface DriverRequest {
  id: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: number;
  pickupDate: string;
  status: string;
  bidCount?: number;
}

export interface DriverBid {
  id: string;
  loadId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: string;
  route: string;
}

export interface DeliveryRecord {
  id: string;
  loadId: string;
  origin: string;
  destination: string;
  status: DeliveryStatus;
  driverName?: string;
  vehiclePlate?: string;
  eta?: string;
  updatedAt: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

export type Person2Role = 'driver' | 'company' | 'admin' | 'shipper';
