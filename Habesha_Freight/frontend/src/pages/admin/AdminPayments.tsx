import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';

interface EscrowTransaction {
  id: string;
  shipment_id: string;
  amount: number;
  status: 'Held' | 'Released' | 'Pending' | 'Refunded';
  payee_name: string;
}

export default function AdminPayments() {
  const [loading, setLoading] = useState(false);
  const [selectedTxModal, setSelectedTxModal] = useState<EscrowTransaction | null>(null);

  const [totalInEscrow, setTotalInEscrow] = useState(0);
  const [releasedToday, setReleasedToday] = useState(0);
  const [pendingRelease, setPendingRelease] = useState(0);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);

  useEffect(() => {
    fetchEscrowDetails();
  }, []);

  const fetchEscrowDetails = async () => {
    try {
      setLoading(true);
      let res = await api.get<any>('/escrow/ledger/all', true);

      let items: any[] = res?.data?.items || res?.data?.payments || res?.items || [];

      if (!items || items.length === 0) {
        // Fallback check to admin endpoint
        res = await api.get<any>('/admin/payments', true);
        items = res?.data?.items || res?.data?.payments || res?.items || [];
      }

      if (Array.isArray(items) && items.length > 0) {
        let total = 0;
        let released = 0;
        let pending = 0;

        const fetched: EscrowTransaction[] = items.map((item, index) => {
          const rawStatus = (item.status as string) || 'LOCKED';
          let formattedStatus: 'Held' | 'Released' | 'Pending' | 'Refunded' = 'Held';
          if (rawStatus.toUpperCase() === 'RELEASED') formattedStatus = 'Released';
          if (rawStatus.toUpperCase() === 'PENDING') formattedStatus = 'Pending';
          if (rawStatus.toUpperCase() === 'REFUNDED') formattedStatus = 'Refunded';

          const amt = Number(item.amount_etb ?? item.amount ?? item.price ?? 45000);
          if (formattedStatus === 'Held') total += amt;
          if (formattedStatus === 'Released') released += amt;
          if (formattedStatus === 'Pending') pending += amt;

          return {
            id: item.id ? `ESC-${String(item.id).slice(0, 6)}` : `ESC-00${index + 1}`,
            shipment_id: item.shipment_id || item.load_id || `SHP-00${index + 1}`,
            amount: amt,
            status: formattedStatus,
            payee_name: item.carrier_name || item.payee_name || item.driver_name || 'Carrier',
          };
        });

        setTransactions(fetched);
        setTotalInEscrow(total);
        setReleasedToday(released);
        setPendingRelease(pending);
      } else {
        setTransactions([]);
        setTotalInEscrow(0);
        setReleasedToday(0);
        setPendingRelease(0);
      }
    } catch (err) {
      console.error('Error loading payments/escrow:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async (tx: EscrowTransaction) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === tx.id) {
          return { ...t, status: 'Released' };
        }
        return t;
      })
    );

    setReleasedToday((prev) => prev + tx.amount);
    setTotalInEscrow((prev) => Math.max(0, prev - tx.amount));

    try {
      await api.post(`/escrow/${tx.shipment_id}/release`, {}, true);
    } catch (err) {
      console.warn(`Payment release error for ${tx.id}`, err);
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
      case 'Held':
        return { backgroundColor: '#E0F2FE', color: '#0284C7' };
      case 'Released':
        return { backgroundColor: '#DCFCE7', color: '#16A34A' };
      case 'Pending':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'Refunded':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payments & Escrow Management</h1>
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

        {/* 3 Metric Cards Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.85rem',
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginBottom: '0.35rem' }}>
              ETB {totalInEscrow.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3B82F6' }}>Total Held in Escrow</div>
          </div>

          <div
            style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '0.85rem',
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16A34A', marginBottom: '0.35rem' }}>
              ETB {releasedToday.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#22C55E' }}>Total Released</div>
          </div>

          <div
            style={{
              backgroundColor: '#FEFCE8',
              border: '1px solid #FEF08A',
              borderRadius: '0.85rem',
              padding: '1.5rem 1.75rem',
            }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B45309', marginBottom: '0.35rem' }}>
              ETB {pendingRelease.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#D97706' }}>Pending Clearance</div>
          </div>
        </div>

        {/* Escrow Transactions Table Container */}
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
              Escrow & Financial Ledger ({transactions.length})
            </h2>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                  <th style={{ padding: '0.75rem 1rem 0.75rem 0' }}>Escrow ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Shipment / Load</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payee</th>
                  <th style={{ padding: '0.75rem 0 0.75rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      Loading escrow transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                      No escrow transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.9rem', color: '#0F172A' }}>
                      <td style={{ padding: '1rem 1rem 1rem 0', fontWeight: 700 }}>{tx.id}</td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{tx.shipment_id}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: '#0F172A' }}>
                        ETB {tx.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            ...getStatusBadgeStyle(tx.status),
                          }}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: '#475569' }}>{tx.payee_name}</td>
                      <td style={{ padding: '1rem 0 1rem 1rem' }}>
                        {tx.status === 'Held' ? (
                          <button
                            onClick={() => handleReleaseEscrow(tx)}
                            style={{
                              backgroundColor: '#00A651',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '0.5rem',
                              padding: '0.4rem 1.1rem',
                              fontSize: '0.825rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Release
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedTxModal(tx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748B',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxModal && (
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Escrow Details ({selectedTxModal.id})
              </h3>
              <button
                onClick={() => setSelectedTxModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.925rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>ESCROW ID</span>
                <strong style={{ color: '#0F172A', fontSize: '1.05rem' }}>{selectedTxModal.id}</strong>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>ASSOCIATED SHIPMENT</span>
                <span style={{ color: '#0F172A' }}>{selectedTxModal.shipment_id}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.8rem' }}>HELD AMOUNT</span>
                <strong style={{ color: '#2563EB', fontSize: '1.1rem' }}>
                  ETB {selectedTxModal.amount.toLocaleString()}
                </strong>
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
                    ...getStatusBadgeStyle(selectedTxModal.status),
                  }}
                >
                  {selectedTxModal.status}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTxModal(null)}
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
