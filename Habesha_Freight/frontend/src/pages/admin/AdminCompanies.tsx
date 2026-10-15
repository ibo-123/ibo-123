import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface CompanyRecord {
  id: string;
  name: string;
  reg_number: string;
  fleet_size: number;
  contact_person: string;
  phone_number: string;
  email?: string;
  status: 'Active' | 'Suspended' | 'Pending Approval';
  created_at: string;
}

export default function AdminCompanies() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<CompanyRecord | null>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);

  useEffect(() => {
    fetchCompanies(searchTerm);
  }, [searchTerm]);

  const fetchCompanies = async (searchQuery: string) => {
    try {
      setLoading(true);
      const queryParam = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const res: any = await api.get(`/admin/companies${queryParam}`);

      const items: any[] =
        res?.companies ||
        res?.items ||
        res?.users ||
        res?.data?.companies ||
        res?.data?.items ||
        (Array.isArray(res) ? res : []);

      if (Array.isArray(items) && items.length > 0) {
        const fetchedCompanies: CompanyRecord[] = items.map((c, index) => {
          const rawStatus = (c.status as string) || (c.is_verified ? 'ACTIVE' : 'PENDING');
          let formattedStatus: 'Active' | 'Suspended' | 'Pending Approval' = 'Active';
          if (rawStatus.toUpperCase() === 'SUSPENDED') formattedStatus = 'Suspended';
          if (rawStatus.toUpperCase() === 'PENDING_APPROVAL' || rawStatus.toUpperCase() === 'PENDING') formattedStatus = 'Pending Approval';

          const joinedDate = c.created_at
            ? new Date(c.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Recent';

          return {
            id: (c.id as string) || `CMP-00${index + 1}`,
            name: (c.company_name as string) || (c.full_name as string) || 'Logistics Company',
            reg_number: (c.company_registration_number as string) || `ETH-REG-${1000 + index}`,
            fleet_size: Number(c.fleet_size ?? c.vehicles_count ?? 12),
            contact_person: (c.full_name as string) || 'Manager',
            phone_number: (c.phone_number as string) || 'No phone',
            email: c.email || '',
            status: formattedStatus,
            created_at: joinedDate,
          };
        });
        setCompanies(fetchedCompanies);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (company: CompanyRecord) => {
    const isCurrentlySuspended = company.status === 'Suspended';
    const actionEndpoint = isCurrentlySuspended ? `/admin/users/${company.id}/activate` : `/admin/users/${company.id}/suspend`;

    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id === company.id) {
          return {
            ...c,
            status: isCurrentlySuspended ? 'Active' : 'Suspended',
          };
        }
        return c;
      })
    );

    try {
      await api.post(actionEndpoint, {});
    } catch (err) {
      console.warn(`Status toggle error for company ${company.id}`, err);
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

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Transport Companies</h1>
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
              <span>Pending Companies: {companies.filter(c => c.status === 'Pending Approval').length}</span>
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

        {/* Companies Table Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '0.85rem',
            padding: '1.75rem 2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0',
          }}
        >
          {/* Card Header & Search Input */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Registered Fleet Companies ({companies.length})
            </h2>

            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                placeholder="Search by company, reg # or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 1rem 0.55rem 2.25rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.875rem',
                  outline: 'none',
                  color: '#0F172A',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  fontSize: '0.9rem',
                }}
              >
                🔍
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem 0.75rem 0' }}>Company Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reg Number</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Manager / Contact</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Joined</th>
                  <th style={{ padding: '0.75rem 0 0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Loading transport companies...
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No transport companies registered yet.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem', color: '#0F172A' }}>
                      <td style={{ padding: '1rem 1rem 1rem 0', fontWeight: 700 }}>{company.name}</td>
                      <td style={{ padding: '1rem', color: '#475569', fontWeight: 600 }}>{company.reg_number}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>
                        <div>{company.contact_person}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{company.phone_number}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(company.status),
                          }}
                        >
                          {company.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#64748B' }}>{company.created_at}</td>
                      <td style={{ padding: '1rem 0 1rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <button
                            onClick={() => setSelectedCompanyModal(company)}
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
                            View
                          </button>
                          <button
                            onClick={() => handleToggleStatus(company)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: company.status === 'Suspended' ? '#2563EB' : '#EF4444',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {company.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
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
      </div>

      {/* Company Details Modal */}
      {selectedCompanyModal && (
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Company Profile</h3>
              <button
                onClick={() => setSelectedCompanyModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.925rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>COMPANY NAME</span>
                <strong style={{ color: '#0F172A' }}>{selectedCompanyModal.name}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>REGISTRATION NUMBER</span>
                <span style={{ color: '#0F172A' }}>{selectedCompanyModal.reg_number}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>PRIMARY CONTACT</span>
                <span style={{ color: '#0F172A' }}>{selectedCompanyModal.contact_person} ({selectedCompanyModal.phone_number})</span>
                {selectedCompanyModal.email && <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{selectedCompanyModal.email}</div>}
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
                    ...getStatusBadgeStyle(selectedCompanyModal.status),
                  }}
                >
                  {selectedCompanyModal.status}
                </span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>REGISTERED DATE</span>
                <span style={{ color: '#0F172A' }}>{selectedCompanyModal.created_at}</span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCompanyModal(null)}
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
