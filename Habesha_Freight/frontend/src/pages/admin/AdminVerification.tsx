import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface VerificationItem {
  id: string;
  applicant_name: string;
  role: string;
  document_type: string;
  reference_number: string;
  submitted_date: string;
  file_name: string;
  file_url?: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
}

export default function AdminVerification() {
  const [loading, setLoading] = useState(false);
  const [previewFileModal, setPreviewFileModal] = useState<VerificationItem | null>(null);
  const [queue, setQueue] = useState<VerificationItem[]>([]);
  const [filterRole, setFilterRole] = useState<'ALL' | 'DRIVER' | 'FLEET_OWNER'>('ALL');

  useEffect(() => {
    fetchKYCQueue();
  }, []);

  const fetchKYCQueue = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/kyc');
      const userList: any[] =
        res?.users ||
        res?.items ||
        res?.data?.users ||
        res?.data?.items ||
        (Array.isArray(res) ? res : []);

      if (Array.isArray(userList)) {
        const fetchedQueue: VerificationItem[] = userList
          .filter((item) => item.role === 'DRIVER' || item.role === 'FLEET_OWNER')
          .map((item) => {
            const rawStatus = (item.kyc_status as string) || (item.status as string) || 'PENDING';
            let formattedStatus: 'Pending Review' | 'Approved' | 'Rejected' = 'Pending Review';
            if (rawStatus.toUpperCase() === 'APPROVED' || rawStatus.toUpperCase() === 'VERIFIED' || item.status === 'ACTIVE') {
              formattedStatus = 'Approved';
            }
            if (rawStatus.toUpperCase() === 'REJECTED') {
              formattedStatus = 'Rejected';
            }

            const submitted = item.created_at
              ? `Submitted ${new Date(item.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Recent Application';

            const isDriver = item.role === 'DRIVER';
            const docType = isDriver ? 'Driver License' : 'Company Business License';
            const refNo = isDriver
              ? (item.license_number || `LIC-${item.id.slice(0, 8)}`)
              : (item.company_registration_number || `REG-${item.id.slice(0, 8)}`);

            const fileUrl = item.license_photo_url || item.company_logo_url;
            const fileName = fileUrl ? fileUrl.split('/').pop()! : (isDriver ? 'license_document.png' : 'business_license.pdf');

            return {
              id: item.id,
              applicant_name: item.full_name || (isDriver ? 'Driver Applicant' : 'Fleet Owner Applicant'),
              role: item.role,
              document_type: docType,
              reference_number: refNo,
              submitted_date: submitted,
              file_name: fileName,
              file_url: fileUrl,
              status: formattedStatus,
            };
          });

        setQueue(fetchedQueue);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: VerificationItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'Approved' } : q))
    );

    try {
      await api.post(`/admin/kyc/${item.id}/approve`, { reason: 'Approved by Admin' });
    } catch (err) {
      console.warn(`Approval call failed for ${item.id}`, err);
    }
  };

  const handleReject = async (item: VerificationItem) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'Rejected' } : q))
    );

    try {
      await api.post(`/admin/kyc/${item.id}/reject`, { reason: 'Verification requirements not met' });
    } catch (err) {
      console.warn(`Rejection call failed for ${item.id}`, err);
    }
  };

  const filteredQueue = queue.filter((item) => {
    if (filterRole === 'ALL') return true;
    return item.role === filterRole;
  });

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
              Verification & KYC Approvals
            </h1>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{formattedDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/admin/disputes"
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
              <span>⚠️</span>
              <span>Pending Queue: {queue.filter(q => q.status === 'Pending Review').length}</span>
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

        {/* Role Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setFilterRole('ALL')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: filterRole === 'ALL' ? '#0F172A' : '#E2E8F0',
              color: filterRole === 'ALL' ? '#FFFFFF' : '#475569',
            }}
          >
            All Requests ({queue.length})
          </button>
          <button
            onClick={() => setFilterRole('DRIVER')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: filterRole === 'DRIVER' ? '#0F172A' : '#E2E8F0',
              color: filterRole === 'DRIVER' ? '#FFFFFF' : '#475569',
            }}
          >
            Drivers ({queue.filter(q => q.role === 'DRIVER').length})
          </button>
          <button
            onClick={() => setFilterRole('FLEET_OWNER')}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              backgroundColor: filterRole === 'FLEET_OWNER' ? '#0F172A' : '#E2E8F0',
              color: filterRole === 'FLEET_OWNER' ? '#FFFFFF' : '#475569',
            }}
          >
            Fleet Owners ({queue.filter(q => q.role === 'FLEET_OWNER').length})
          </button>
        </div>

        {/* Verification Queue Stacked Cards */}
        {loading ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.85rem',
              padding: '3rem',
              textAlign: 'center',
              color: '#64748B',
            }}
          >
            Loading live verification requests...
          </div>
        ) : filteredQueue.length === 0 ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.85rem',
              padding: '3rem',
              textAlign: 'center',
              color: '#64748B',
              border: '1px solid #E2E8F0',
            }}
          >
            No verification requests found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {filteredQueue.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.85rem',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #E2E8F0',
                }}
              >
                {/* Title Row & Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {item.applicant_name}
                  </h3>
                  <span
                    style={{
                      backgroundColor:
                        item.role === 'DRIVER' ? '#DBEAFE' : '#E0E7FF',
                      color:
                        item.role === 'DRIVER' ? '#1D4ED8' : '#4338CA',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {item.role === 'DRIVER' ? 'DRIVER' : 'FLEET OWNER'}
                  </span>
                  <span
                    style={{
                      backgroundColor:
                        item.status === 'Approved' ? '#DCFCE7' : item.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                      color:
                        item.status === 'Approved' ? '#15803D' : item.status === 'Rejected' ? '#B91C1C' : '#B45309',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    {item.status === 'Pending Review' ? '⏳ Pending Review' : item.status}
                  </span>
                </div>

                {/* Subtitle Information */}
                <div style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.25rem' }}>
                  {item.document_type} · Ref: <strong style={{ color: '#1E293B' }}>{item.reference_number}</strong> · {item.submitted_date}
                </div>

                {/* Attachment Box Container */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '0.6rem',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.9rem' }}>
                    <span style={{ fontSize: '1.1rem', color: '#64748B' }}>📄</span>
                    <span style={{ fontWeight: 500 }}>{item.file_name}</span>
                  </div>

                  <button
                    onClick={() => setPreviewFileModal(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    View Document 👁️
                  </button>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={item.status === 'Approved'}
                    style={{
                      flex: 1,
                      backgroundColor: item.status === 'Approved' ? '#86EFAC' : '#00A651',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      cursor: item.status === 'Approved' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>✓</span>
                    <span>{item.status === 'Approved' ? 'Approved & Activated' : 'Approve Application'}</span>
                  </button>

                  <button
                    onClick={() => handleReject(item)}
                    disabled={item.status === 'Rejected'}
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      color: item.status === 'Rejected' ? '#9CA3AF' : '#DC2626',
                      border: `1px solid ${item.status === 'Rejected' ? '#E5E7EB' : '#FEE2E2'}`,
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      fontSize: '0.925rem',
                      fontWeight: 700,
                      cursor: item.status === 'Rejected' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>✕</span>
                    <span>{item.status === 'Rejected' ? 'Rejected' : 'Reject Application'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewFileModal && (
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
              width: '580px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Document Inspection & Preview
              </h3>
              <button
                onClick={() => setPreviewFileModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '0.5rem',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: '#0F172A', fontSize: '1.1rem' }}>{previewFileModal.applicant_name}</strong>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginTop: '0.1rem' }}>
                  {previewFileModal.role === 'DRIVER' ? 'DRIVER APPLICANT' : 'FLEET OWNER APPLICANT'}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
                <div>Document Type: <strong>{previewFileModal.document_type}</strong></div>
                <div>Reference / License No: <strong>{previewFileModal.reference_number}</strong></div>
                <div>Application Status: <strong>{previewFileModal.status}</strong></div>
              </div>

              {previewFileModal.file_url ? (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  {previewFileModal.file_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={getFullDocUrl(previewFileModal.file_url)}
                      title="Document PDF Preview"
                      style={{
                        width: '100%',
                        height: '320px',
                        borderRadius: '0.5rem',
                        border: '1px solid #CBD5E1',
                      }}
                    />
                  ) : (
                    <img
                      src={getFullDocUrl(previewFileModal.file_url)}
                      crossOrigin="anonymous"
                      alt="License or Document Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '0.5rem',
                        objectFit: 'contain',
                        border: '1px solid #CBD5E1',
                        backgroundColor: '#FFFFFF',
                      }}
                      onError={() => {
                        console.warn('Image fail to load:', previewFileModal.file_url);
                      }}
                    />
                  )}

                  <a
                    href={getFullDocUrl(previewFileModal.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      marginTop: '0.75rem',
                    }}
                  >
                    Open Original File in New Tab ↗
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                  Digital document reference registered: <strong>{previewFileModal.reference_number}</strong>.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setPreviewFileModal(null)}
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
