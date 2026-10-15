import { useState } from 'react';
import DataTable, { Column } from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ChatModal from '../../components/ChatModal';
import { useDriverBids, DriverBid } from '../../hooks/useDriverBids';

export default function BidHistory() {
  const { bids, loading, error } = useDriverBids();
  const [selectedChatBid, setSelectedChatBid] = useState<DriverBid | null>(null);

  const columns: Column<DriverBid>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (b) =>
        b.origin_city && b.destination_city
          ? `${b.origin_city} → ${b.destination_city}`
          : b.load_id.slice(0, 8),
    },
    { key: 'cargo', header: 'Cargo', render: (b) => b.cargo_description ?? '—' },
    { key: 'amount', header: 'Bid (ETB)', render: (b) => Number(b.bid_amount_etb).toLocaleString() },
    { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'date',
      header: 'Submitted',
      render: (b) =>
        b.created_at
          ? new Date(b.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          : '—',
    },
    {
      key: 'action',
      header: 'Chat',
      render: (b) => (
        <button
          onClick={() => setSelectedChatBid(b)}
          style={{
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            padding: '0.35rem 0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          💬 Chat Shipper
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-5 w-full space-y-6">
      <PageHeader title="Bid History" subtitle="Track all bids you have submitted and communicate with shippers" />

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Loading bids…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : bids.length === 0 ? (
        <EmptyState
          title="No bids yet"
          description="Your submitted bids will appear here once you bid on available loads."
        />
      ) : (
        <DataTable columns={columns} rows={bids} rowKey={(b) => b.id} />
      )}

      {selectedChatBid && (
        <ChatModal
          isOpen={!!selectedChatBid}
          onClose={() => setSelectedChatBid(null)}
          receiverId={(selectedChatBid as any).shipper_id || ''}
          receiverName={(selectedChatBid as any).shipper_name || 'Shipper'}
          receiverPhone={(selectedChatBid as any).shipper_phone}
          loadTitle={
            selectedChatBid.origin_city && selectedChatBid.destination_city
              ? `${selectedChatBid.origin_city} → ${selectedChatBid.destination_city}`
              : undefined
          }
        />
      )}
    </div>
  );
}
