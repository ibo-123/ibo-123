import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface VehicleRecord {
  id: string;
  plate_number: string;
  vehicle_type: string;
  model: string;
  capacity: string;
  driver_name: string;
  status: 'Verified' | 'Pending Verification' | 'Rejected';
}

export default function AdminVehicles() {
  const [loading, setLoading] = useState(false);
  const [selectedVehicleModal, setSelectedVehicleModal] = useState<VehicleRecord | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/vehicles');

      const items: any[] =
        res?.vehicles ||
        res?.items ||
        res?.data?.vehicles ||
        res?.data?.items ||
        (Array.isArray(res) ? res : []);

      if (Array.isArray(items) && items.length > 0) {
        const fetchedVehicles: VehicleRecord[] = items.map((v, index) => {
          const rawStatus = (v.verification_status as string) || (v.status as string) || (v.is_active ? 'VERIFIED' : 'PENDING');
          let formattedStatus: 'Verified' | 'Pending Verification' | 'Rejected' = 'Verified';
          if (rawStatus.toUpperCase() === 'PENDING' || rawStatus.toUpperCase().includes('PENDING')) formattedStatus = 'Pending Verification';
          if (rawStatus.toUpperCase() === 'REJECTED') formattedStatus = 'Rejected';

          const formattedType = v.vehicle_type ? String(v.vehicle_type).replace('_', ' ') : 'Sino Truck';

          return {
            id: (v.id as string) || `VH-${100 + index}`,
            plate_number: (v.plate_number as string) || 'ET-3-45892',
            vehicle_type: formattedType,
            model: (v.model as string) || `${formattedType} Heavy Carrier`,
            capacity: v.capacity_tons ? `${v.capacity_tons} tons` : (v.capacity ? `${v.capacity} tons` : '25 tons'),
            driver_name: (v.driver_name as string) || (v.owner_name as string) || 'Assigned Driver',
            status: formattedStatus,
          };
        });
        setVehicles(fetchedVehicles);
      } else {
        setVehicles([]);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVehicle = async (vehicle: VehicleRecord, newStatus: 'Verified' | 'Rejected') => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicle.id) {
          return { ...v, status: newStatus };
        }
        return v;
      })
    );

    try {
      const endpoint = newStatus === 'Verified' ? `/admin/vehicles/${vehicle.id}/verify` : `/admin/vehicles/${vehicle.id}/reject`;
      await api.post(endpoint, {});
    } catch (err) {
      console.warn(`Verification update error for vehicle ${vehicle.id}`, err);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Verified':
        return { backgroundColor: '#DCFCE7', color: '#15803D' };
      case 'Pending Verification':
        return { backgroundColor: '#FEF3C7', color: '#B45309' };
      case 'Rejected':
        return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#4B5563' };
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Registered Fleet Vehicles</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{formattedDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

        {/* Vehicles Table Container */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0',
          }}
        >
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              All Registered Trucks & Heavy Equipment ({vehicles.length})
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem 0.75rem 0' }}>Plate Number</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vehicle Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Capacity</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assigned Driver</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Verification Status</th>
                  <th style={{ padding: '0.75rem 0 0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Loading fleet vehicles...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No vehicles registered yet.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem', color: '#0F172A' }}>
                      <td style={{ padding: '1rem 1rem 1rem 0', fontWeight: 700 }}>{v.plate_number}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{v.vehicle_type}</td>
                      <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>{v.capacity}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{v.driver_name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(v.status),
                          }}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0 1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <button
                            onClick={() => setSelectedVehicleModal(v)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#2563EB',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Details
                          </button>
                          {v.status === 'Pending Verification' && (
                            <>
                              <button
                                onClick={() => handleVerifyVehicle(v, 'Verified')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#16A34A',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyVehicle(v, 'Rejected')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#DC2626',
                                  fontWeight: 600,
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicleModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
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
              width: '450px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Vehicle Specifications</h3>
              <button
                onClick={() => setSelectedVehicleModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.925rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>PLATE NUMBER</span>
                <strong style={{ color: '#0F172A', fontSize: '1.1rem' }}>{selectedVehicleModal.plate_number}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>VEHICLE TYPE</span>
                <span style={{ color: '#0F172A' }}>{selectedVehicleModal.vehicle_type}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>LOAD CAPACITY</span>
                <strong style={{ color: '#2563EB' }}>{selectedVehicleModal.capacity}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>VERIFICATION STATUS</span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '0.2rem',
                    ...getStatusBadgeStyle(selectedVehicleModal.status),
                  }}
                >
                  {selectedVehicleModal.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedVehicleModal(null)}
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
