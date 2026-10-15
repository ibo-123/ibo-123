import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalCompanies: number;
  totalVehicles: number;
  activeDeliveries: number;
  completedDeliveries: number;
  pendingRequests: number;
  openDisputes: number;
}

interface ShipmentItem {
  id: string;
  origin: string;
  destination: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalCompanies: 0,
    totalVehicles: 0,
    activeDeliveries: 0,
    completedDeliveries: 0,
    pendingRequests: 0,
    openDisputes: 0,
  });

  const [recentShipments, setRecentShipments] = useState<ShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/dashboard');

      const data = res?.data ?? res;

      if (data) {
        setStats({
          totalUsers: Number(data.totalUsers ?? 0),
          totalDrivers: Number(data.totalDrivers ?? 0),
          totalCompanies: Number(data.totalFleetOwners ?? data.totalCompanies ?? 0),
          totalVehicles: Number(data.totalVehicles ?? 0),
          activeDeliveries: Number(data.activeShipments ?? data.totalLoads ?? 0),
          completedDeliveries: Number(data.completedShipments ?? 0),
          pendingRequests: Number(data.pendingKyc ?? 0),
          openDisputes: Number(data.activeDisputes ?? 0),
        });
      }

      // Fetch recent loads to display as live shipments
      try {
        const loadsRes: any = await api.get('/admin/loads');
        const loadList: any[] =
          loadsRes?.loads ||
          loadsRes?.items ||
          loadsRes?.deliveries ||
          loadsRes?.data?.loads ||
          loadsRes?.data?.items ||
          (Array.isArray(loadsRes) ? loadsRes : []);

        if (Array.isArray(loadList) && loadList.length > 0) {
          const formatted: ShipmentItem[] = loadList.slice(0, 5).map((l, i) => ({
            id: l.id ? `LOAD-${l.id.slice(0, 6)}` : `SHP-00${i + 1}`,
            origin: l.origin_city || l.origin || 'Addis Ababa',
            destination: l.destination_city || l.destination || 'Regional Corridor',
            status: l.status ? String(l.status).replace(/_/g, ' ') : 'POSTED',
          }));
          setRecentShipments(formatted);
        }
      } catch (err) {
        console.warn('Load summary note:', err);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes('TRANSIT') || s.includes('ASSIGNED')) {
      return { backgroundColor: '#E0F2FE', color: '#0284C7' };
    }
    if (s.includes('BID') || s.includes('POSTED') || s.includes('PENDING')) {
      return { backgroundColor: '#FEF3C7', color: '#D97706' };
    }
    if (s.includes('DELIVERED') || s.includes('COMPLETED')) {
      return { backgroundColor: '#DCFCE7', color: '#16A34A' };
    }
    return { backgroundColor: '#F3F4F6', color: '#4B5563' };
  };

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>System Overview</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{formattedDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/admin/verification"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                padding: '0.4rem 0.9rem',
                borderRadius: '2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>⏳</span>
              <span>{stats.pendingRequests} Pending Verifications</span>
            </Link>

            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#C8933A',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              AD
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#EFF6FF', color: '#3B82F6' }}>👥</div>
            <div style={valStyle}>{loading ? '…' : stats.totalUsers}</div>
            <div style={labelStyle}>Total System Users</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#FEF2F2', color: '#EF4444' }}>🚛</div>
            <div style={valStyle}>{loading ? '…' : stats.totalDrivers}</div>
            <div style={labelStyle}>Registered Drivers</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#F0FDF4', color: '#16A34A' }}>🏢</div>
            <div style={valStyle}>{loading ? '…' : stats.totalCompanies}</div>
            <div style={labelStyle}>Transport Companies</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#EFF6FF', color: '#2563EB' }}>🚚</div>
            <div style={valStyle}>{loading ? '…' : stats.totalVehicles}</div>
            <div style={labelStyle}>Registered Vehicles</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#FFF7ED', color: '#EA580C' }}>📦</div>
            <div style={valStyle}>{loading ? '…' : stats.activeDeliveries}</div>
            <div style={labelStyle}>Active Freight Loads</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#F0FDF4', color: '#16A34A' }}>✅</div>
            <div style={valStyle}>{loading ? '…' : stats.completedDeliveries}</div>
            <div style={labelStyle}>Completed Trips</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#FEFCE8', color: '#CA8A04' }}>⏳</div>
            <div style={valStyle}>{loading ? '…' : stats.pendingRequests}</div>
            <div style={labelStyle}>Pending Approvals</div>
          </div>

          <div style={cardStyle}>
            <div style={{ ...iconStyle, backgroundColor: '#FEF2F2', color: '#DC2626' }}>⚠️</div>
            <div style={valStyle}>{loading ? '…' : stats.openDisputes}</div>
            <div style={labelStyle}>Open Disputes</div>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Recent Freight Loads</h3>
              <Link to="/admin/deliveries" style={{ fontSize: '0.85rem', color: '#C8933A', fontWeight: 600, textDecoration: 'none' }}>
                View all
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {recentShipments.length === 0 ? (
                <div style={{ fontSize: '0.875rem', color: '#64748B', textAlign: 'center', padding: '1.5rem 0' }}>
                  No recent freight loads found.
                </div>
              ) : (
                recentShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>{shipment.id}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {shipment.origin} → {shipment.destination}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        ...getStatusBadgeStyle(shipment.status),
                      }}
                    >
                      {shipment.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Verification Queue Summary</h3>
              <Link to="/admin/verification" style={{ fontSize: '0.85rem', color: '#C8933A', fontWeight: 600, textDecoration: 'none' }}>
                Review Queue →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  backgroundColor: '#FEF3C7',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  border: '1px solid #FDE68A',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#92400E' }}>
                    {stats.pendingRequests} Driver & Fleet Owner Applications
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#B45309', marginBottom: '0.75rem' }}>
                  Awaiting license and registration document approval.
                </div>
                <Link
                  to="/admin/verification"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#B45309',
                    textDecoration: 'none',
                  }}
                >
                  Review Applications →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '0.85rem',
  padding: '1.25rem 1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  border: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
};

const iconStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.1rem',
  marginBottom: '1rem',
};

const valStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 800,
  color: '#0F172A',
  lineHeight: 1.1,
  marginBottom: '0.35rem',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.825rem',
  color: '#64748B',
  fontWeight: 500,
};

const sectionCardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '0.85rem',
  padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  border: '1px solid #E2E8F0',
};
