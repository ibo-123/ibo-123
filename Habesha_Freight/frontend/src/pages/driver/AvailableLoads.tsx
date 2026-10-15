import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { Column } from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import SearchBar from '../../components/SearchBar';
import StatusBadge from '../../components/StatusBadge';
import { useAvailableLoads, AvailableLoad } from '../../hooks/useAvailableLoads';

export default function AvailableLoads() {
  const [search, setSearch] = useState('');
  const { loads, loading, error } = useAvailableLoads();

  const filtered = useMemo(() => {
    if (!search) return loads;
    const q = search.toLowerCase();
    return loads.filter(
      (l) =>
        (l.origin_city ?? '').toLowerCase().includes(q) ||
        (l.destination_city ?? '').toLowerCase().includes(q) ||
        (l.cargo_description ?? '').toLowerCase().includes(q)
    );
  }, [loads, search]);

  const columns: Column<AvailableLoad>[] = [
    {
      key: 'route',
      header: 'Route',
      render: (l) => `${l.origin_city} → ${l.destination_city}`,
    },
    {
      key: 'distance',
      header: 'Proximity',
      render: (l) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          📍 {l.distance_km ?? 0} km
        </span>
      ),
    },
    { key: 'cargo', header: 'Cargo', render: (l) => l.cargo_description },
    { key: 'weight', header: 'Weight (t)', render: (l) => l.weight_tons },
    {
      key: 'price',
      header: 'Price (ETB)',
      render: (l) => Number(l.offered_price_etb).toLocaleString(),
    },
    { key: 'status', header: 'Status', render: (l) => <StatusBadge status={l.status} /> },
    {
      key: 'action',
      header: '',
      render: (l) => (
        <Link
          to={`/driver/requests/${l.id}`}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          View &amp; Bid
        </Link>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-5 w-full space-y-6">
      <PageHeader
        title="Available Shipments"
        subtitle="Browse open loads and submit your bid"
        actions={
          <Link
            to="/driver/bids"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
          >
            Bid History
          </Link>
        }
      />
      <SearchBar value={search} onChange={setSearch} placeholder="Search by route or cargo..." />

      {loading ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 text-sm">Fetching available loads…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No available loads"
          description="Open shipment loads matching your routes will appear here."
        />
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(l) => l.id} />
      )}
    </div>
  );
}
