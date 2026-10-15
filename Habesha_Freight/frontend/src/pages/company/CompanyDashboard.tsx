import { Link } from 'react-router-dom';
import { useCompanyData } from '../../hooks/useCompanyData';

export default function CompanyDashboard() {
  const { companyName, vehicles, requests, stats, loading, refresh } = useCompanyData();

  const totalFleetSize = vehicles.length;
  const availableTrucks = vehicles.filter((v) => v.status === 'AVAILABLE' || v.status === 'Available').length;
  const activeDeliveries = vehicles.filter((v) => v.status === 'IN_TRANSIT' || v.status === 'In Transit').length;
  const pendingRequests = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="p-4 sm:p-5 space-y-6 w-full">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Loading live data...</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{companyName || 'Company Dashboard'}</h1>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
              ✓ Verified Carrier
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Transport Company Operations Overview &amp; Real-Time Dispatch Metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/company/vehicles"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
          >
            + Add Vehicle
          </Link>
          <button
            onClick={refresh}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl mb-2">🚛</div>
          <p className="text-xs text-slate-500 font-medium">Total Fleet</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalFleetSize}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl mb-2">✅</div>
          <p className="text-xs text-slate-500 font-medium">Available Trucks</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{availableTrucks}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-2">🚚</div>
          <p className="text-xs text-slate-500 font-medium">Active Deliveries</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{activeDeliveries}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl mb-2">📋</div>
          <p className="text-xs text-slate-500 font-medium">Pending Requests</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingRequests}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-2">💳</div>
          <p className="text-xs text-slate-500 font-medium">Est. Revenue</p>
          <p className="text-xl font-black text-slate-900 mt-1">ETB {Number(stats?.totalEarnings || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-lg p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 bg-amber-100 text-amber-500 rounded-xl flex items-center justify-center text-xl mb-2">⭐</div>
          <p className="text-xs text-slate-500 font-medium">Fleet Rating</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.ratingAverage ? Number(stats.ratingAverage).toFixed(1) : '5.0'} / 5</p>
        </div>
      </div>

      {/* Two Column Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Requests */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Recent Fleet Requests</h2>
            <Link to="/company/fleet-requests" className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              View All →
            </Link>
          </div>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">No recent requests.</p>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 4).map((req) => (
                <div key={req.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.id}</span>
                      <span className="text-xs text-slate-400">· {req.date}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          req.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{req.from} → {req.to}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📦 {req.cargo} · 🚛 {req.trucks} Trucks · <span className="font-bold text-slate-700">{req.amount}</span>
                    </p>
                  </div>
                  {req.status === 'Pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Placeholder – real API call would go here
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          // Placeholder – real API call would go here
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1 rounded-lg text-xs"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right: Fleet Status */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Fleet Status</h2>
            <Link to="/company/vehicles" className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            {vehicles.length === 0 ? (
              <p className="text-sm text-slate-500">No vehicles registered.</p>
            ) : (
              vehicles.slice(0, 5).map((v) => (
                <div key={v.plate} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{v.plate}</p>
                    <p className="text-[11px] text-slate-500">{v.model} · {v.driver}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      v.status === 'AVAILABLE' || v.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
