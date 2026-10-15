import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function CompanyRatings() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/company/stats')
      .then((res) => {
        setStats(res?.data || res);
      })
      .catch((err) => console.error('Failed to fetch company stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const ratingAvg = stats?.rating?.average ? Number(stats.rating.average).toFixed(1) : '5.0';
  const ratingTotal = stats?.rating?.total || 0;
  const deliveredCount = stats?.shipments?.delivered || 0;

  return (
    <div className="p-4 sm:p-5 w-full space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Company Ratings &amp; Reviews</h1>
        <p className="text-xs text-slate-500 mt-1">Track shipper evaluations and delivery service performance</p>
      </div>

      {loading ? (
        <div className="p-4 sm:p-5 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading live ratings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Rating</p>
            <p className="text-4xl font-extrabold text-slate-900 mt-1">{ratingAvg} / 5.0</p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              ★★★★★ ({ratingTotal || deliveredCount} Verified Shipments)
            </p>
          </div>

          <div className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Deliveries</p>
            <p className="text-4xl font-extrabold text-emerald-600 mt-1">{deliveredCount}</p>
            <p className="text-xs text-slate-500 mt-1">Verified freight corridor deliveries</p>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Fleet Size</p>
            <p className="text-4xl font-extrabold text-blue-600 mt-1">{stats?.vehicles?.active || 0} Trucks</p>
            <p className="text-xs text-slate-500 mt-1">Registered heavy cargo vehicles</p>
          </div>
        </div>
      )}
    </div>
  );
}
