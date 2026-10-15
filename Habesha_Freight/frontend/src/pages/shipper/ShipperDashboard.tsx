// src/pages/shipper/ShipperDashboard.tsx
import { useNavigate } from 'react-router-dom';
import { useShipperDashboard } from '../../hooks/useShipperDashboard';
import { getStoredUser } from '../../services/authService';

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatCurrency = (n: number) => `ETB ${Number(n).toLocaleString()}`;

export default function ShipperDashboard() {
  const navigate = useNavigate();
  const { stats, loads, loading, error } = useShipperDashboard();
  const user = getStoredUser();

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('transit')) return 'bg-blue-100 text-blue-800';
    if (s.includes('assigned')) return 'bg-pink-100 text-pink-800';
    if (s.includes('progress') || s.includes('active')) return 'bg-purple-100 text-purple-800';
    if (s.includes('pending')) return 'bg-amber-100 text-amber-800';
    if (s.includes('complete')) return 'bg-emerald-100 text-emerald-800';
    return 'bg-amber-100 text-amber-800';
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Only show active deliveries in the main list
  const activeDeliveries = loads.filter(l => 
    !['COMPLETED', 'CANCELLED'].includes(l.status)
  ).slice(0, 5);

  const activeEscrowAmount = loads
    .filter(l => ['IN_TRANSIT', 'ASSIGNED', 'DISPATCHED'].includes(l.status))
    .reduce((sum, l) => sum + (Number(l.offered_price_etb) || 45000), 0);

  return (
    <div className="p-4 sm:p-5 font-sans text-slate-900 w-full">
      {/* ── Top header ── */}
      <header className="flex justify-between items-center gap-3 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Shipper Dashboard</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer" onClick={() => navigate('/profile')}>
            {initials}
          </div>
        </div>
      </header>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* ── Stat cards (Includes Escrow Protection Card) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/shipments')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-amber-50 text-amber-600 mb-2">🚚</div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '…' : (stats?.active ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Active Deliveries</p>
        </article>

        <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/bids')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-amber-50 text-amber-500 mb-2">💰</div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '…' : (stats?.pendingBids ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Bids</p>
        </article>

        <article className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-xl p-5 shadow-sm border border-blue-800 flex flex-col cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden" onClick={() => navigate('/payments')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-blue-800/60 text-blue-200 mb-2">🔒</div>
          <p className="text-xl font-extrabold text-white">
            {loading ? '…' : formatCurrency(Number(stats?.totalEscrow ?? 0) > 0 ? Number(stats?.totalEscrow) : activeEscrowAmount)}
          </p>
          <p className="text-xs text-blue-200 mt-1 font-semibold">Held in Escrow</p>
        </article>

        <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/shipments')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-green-50 text-green-500 mb-2">✅</div>
          <p className="text-2xl font-bold text-slate-900">{loading ? '…' : (stats?.completed ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Completed</p>
        </article>

        <article className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/payments')}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-amber-50 text-amber-500 mb-2">💳</div>
          <p className="text-xl font-bold text-slate-900">{loading ? '…' : formatCurrency(Number(stats?.totalSpend ?? 0))}</p>
          <p className="text-xs text-slate-500 mt-1">Total Spent</p>
        </article>
      </section>

      {/* Escrow Milestone Guarantee Banner */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">🛡️</span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900">Escrow Milestone Protection Active</h4>
            <p className="text-xs text-slate-600">Your funds are safely locked in Telebirr / Chapa escrow and only released to drivers after 6-digit OTP delivery verification.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/payments')}
          className="px-4 py-2 bg-[#C8933A] hover:bg-[#b07e2e] text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer self-start sm:self-auto"
        >
          Manage Escrow
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Active Deliveries ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Active Deliveries & Escrow Status</h2>
            <button className="text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors" onClick={() => navigate('/shipments')}>View all</button>
          </div>
          
          {loading ? (
             <p className="text-slate-500 py-4">Loading deliveries…</p>
          ) : activeDeliveries.length === 0 ? (
             <p className="text-slate-500 py-4">No active deliveries found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeDeliveries.map((load) => (
                <div key={load.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => navigate('/tracking')}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="text-xl shrink-0">📦</div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-slate-800 mb-1 truncate">
                        {load.origin_city} → {load.destination_city}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {load.cargo_description} · {load.weight_tons} tons
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      Escrow Protected
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(load.status)}`}>
                      {getStatusDisplay(load.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <aside className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-3 p-4 rounded-lg text-sm font-medium border border-transparent bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer w-full text-left" onClick={() => navigate('/shipments/create')}>
              <span>🚚</span> Find Single Truck
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer w-full text-left" onClick={() => navigate('/payments')}>
              <span>🔒</span> Escrow Payments & Ledger
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer w-full text-left" onClick={() => navigate('/fleet')}>
              <span>🏢</span> Find Fleet Company
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer w-full text-left" onClick={() => navigate('/shipments')}>
              <span>📋</span> View Requests
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer w-full text-left" onClick={() => navigate('/tracking')}>
              <span>🗂️</span> Delivery History
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}