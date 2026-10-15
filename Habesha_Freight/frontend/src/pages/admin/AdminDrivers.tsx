import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface DriverRecord {
  id: string;
  full_name: string;
  role: string;
  phone_number: string;
  status: 'Active' | 'Suspended' | 'Pending Approval';
  created_at: string;
  license_number: string;
  license_photo_url?: string;
  experience_years: number;
}

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriverModal, setSelectedDriverModal] = useState<DriverRecord | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/drivers');

      const items: any[] =
        res?.drivers ||
        res?.items ||
        res?.data?.drivers ||
        res?.data?.items ||
        (Array.isArray(res) ? res : []);

      if (Array.isArray(items) && items.length > 0) {
        const fetchedDrivers: DriverRecord[] = items.map((d, index) => {
          const rawStatus = (d.status as string) || (d.is_verified ? 'ACTIVE' : 'PENDING');
          let formattedStatus: 'Active' | 'Suspended' | 'Pending Approval' = 'Active';
          if (rawStatus.toUpperCase() === 'SUSPENDED') formattedStatus = 'Suspended';
          if (rawStatus.toUpperCase() === 'PENDING_APPROVAL' || rawStatus.toUpperCase() === 'PENDING') formattedStatus = 'Pending Approval';

          const joinedDate = d.created_at
            ? new Date(d.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent';

          return {
            id: (d.id as string) || `DRV-00${index + 1}`,
            full_name: (d.full_name as string) || 'Driver Name',
            role: 'Driver',
            phone_number: (d.phone_number as string) || 'No phone',
            status: formattedStatus,
            created_at: joinedDate,
            license_number: (d.license_number as string) || 'ET-LIC-88900',
            license_photo_url: d.license_photo_url || d.company_logo_url,
            experience_years: Number(d.experience_years ?? 3),
          };
        });
        setDrivers(fetchedDrivers);
      } else {
        setDrivers([]);
      }
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (driver: DriverRecord) => {
    const isCurrentlySuspended = driver.status === 'Suspended';
    const actionEndpoint = isCurrentlySuspended ? `/admin/users/${driver.id}/activate` : `/admin/users/${driver.id}/suspend`;

    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driver.id) {
          return {
            ...d,
            status: isCurrentlySuspended ? 'Active' : 'Suspended',
          };
        }
        return d;
      })
    );

    try {
      await api.post(actionEndpoint, {});
    } catch (err) {
      console.error('Failed to update driver status:', err);
      fetchDrivers();
    }
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone_number.includes(searchTerm) ||
      d.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusBadgeStyle = (status: DriverRecord['status']) => {
    switch (status) {
      case 'Active':
        return { backgroundColor: '#DCFCE7', color: '#15803D' };
      case 'Suspended':
        return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
      case 'Pending Approval':
        return { backgroundColor: '#FEF3C7', color: '#B45309' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#4B5563' };
    }
  };

  const getFullDocUrl = (fileUrl?: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `http://localhost:5000${fileUrl}`;
  };

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Registered Drivers
            </h1>
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
              <span>Pending Drivers: {drivers.filter(d => d.status === 'Pending Approval').length}</span>
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

        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              placeholder="Search drivers by name, phone or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Table Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>DRIVER NAME</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>PHONE</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>LICENSE NO.</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>REGISTERED</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    Loading live drivers database...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748B' }}>
                    No driver records found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <tr key={driver.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#EFF6FF',
                            color: '#2563EB',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                          }}
                        >
                          {driver.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{driver.full_name}</div>
                          {driver.license_photo_url && (
                            <span style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: 600 }}>📄 Document Attached</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#334155' }}>{driver.phone_number}</td>
                    <td style={{ padding: '1rem 1.25rem', color: '#334155', fontFamily: 'monospace' }}>{driver.license_number}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '1rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...getStatusBadgeStyle(driver.status),
                        }}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: '#64748B' }}>{driver.created_at}</td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedDriverModal(driver)}
                          style={{
                            backgroundColor: '#F1F5F9',
                            color: '#334155',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          View Details 👁️
                        </button>
                        <button
                          onClick={() => handleToggleStatus(driver)}
                          style={{
                            backgroundColor: driver.status === 'Suspended' ? '#DCFCE7' : '#FEE2E2',
                            color: driver.status === 'Suspended' ? '#15803D' : '#B91C1C',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {driver.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Details Modal */}
      {selectedDriverModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.85rem',
              padding: '2rem',
              width: '500px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Driver Profile & License Document</h3>
              <button
                onClick={() => setSelectedDriverModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.925rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>FULL NAME</span>
                <strong style={{ color: '#0F172A', fontSize: '1.05rem' }}>{selectedDriverModal.full_name}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>PHONE NUMBER</span>
                <span style={{ color: '#0F172A' }}>{selectedDriverModal.phone_number}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>LICENSE NUMBER</span>
                <span style={{ color: '#0F172A', fontFamily: 'monospace', fontWeight: 700 }}>{selectedDriverModal.license_number}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>STATUS</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '0.2rem',
                    ...getStatusBadgeStyle(selectedDriverModal.status),
                  }}
                >
                  {selectedDriverModal.status}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>REGISTERED DATE</span>
                <span style={{ color: '#0F172A' }}>{selectedDriverModal.created_at}</span>
              </div>

              {selectedDriverModal.license_photo_url ? (
                <div style={{ marginTop: '1rem', textAlign: 'center', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'left' }}>DRIVER LICENSE / DOCUMENT ATTACHMENT</span>
                  {selectedDriverModal.license_photo_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={getFullDocUrl(selectedDriverModal.license_photo_url)}
                      title="Driver License PDF"
                      style={{ width: '100%', height: '240px', border: '1px solid #CBD5E1', borderRadius: '0.375rem' }}
                    />
                  ) : (
                    <img
                      src={getFullDocUrl(selectedDriverModal.license_photo_url)}
                      crossOrigin="anonymous"
                      alt="Driver License Attachment"
                      style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '0.375rem', objectFit: 'contain', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF' }}
                    />
                  )}
                  <a
                    href={getFullDocUrl(selectedDriverModal.license_photo_url)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-block', color: '#2563EB', fontWeight: 600, fontSize: '0.85rem', marginTop: '0.5rem' }}
                  >
                    Open Document in New Tab ↗
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                  No binary photo uploaded. Registered License No: <strong>{selectedDriverModal.license_number}</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedDriverModal(null)}
                style={{
                  backgroundColor: '#0F172A',
                  color: '#FFFFFF',
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
