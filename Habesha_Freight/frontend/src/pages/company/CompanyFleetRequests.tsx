import { useState } from 'react';
import { useCompanyFleetRequests } from '../../hooks/useCompanyFleetRequests';

export default function CompanyFleetRequests() {
  const { requests, loading, refresh, updateRequestStatus } = useCompanyFleetRequests();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateStatus = (id: string, newStatus: 'Accepted' | 'Declined') => {
    updateRequestStatus(id, newStatus);
    showNotification(`Request ${id} marked as ${newStatus}`);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = filterStatus === 'ALL' || r.status.toUpperCase() === filterStatus.toUpperCase();
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.to.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-5 w-full space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border-l-4 border-amber-500 text-sm font-medium">
          🔔 {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet Dispatch Requests</h1>
          <p className="text-xs text-slate-500 mt-1">Review, accept, and allocate fleet capacity for commercial load requests</p>
        </div>
        <button onClick={refresh} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-colors self-start sm:self-auto">
          🔄 Refresh Requests
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search by ID, shipper, origin, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'PENDING', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'DECLINED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${filterStatus === status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading requests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Shipper</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Cargo Details</th>
                  <th className="p-3">Trucks Required</th>
                  <th className="p-3">Quote Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{req.id}</td>
                    <td className="p-3 font-medium text-slate-700">{req.customer}</td>
                    <td className="p-3 font-semibold text-slate-800">{req.from} → {req.to}</td>
                    <td className="p-3 text-slate-600">{req.cargo}</td>
                    <td className="p-3 font-bold text-slate-700">{req.trucks} Trucks</td>
                    <td className="p-3 font-extrabold text-amber-600">{req.amount}</td>
                    <td className="p-3">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                        req.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                        req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        req.status === 'Declined' ? 'bg-red-100 text-red-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>{req.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateStatus(req.id, 'Accepted')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-xs">
                            Accept
                          </button>
                          <button onClick={() => handleUpdateStatus(req.id, 'Declined')} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1 rounded-lg text-xs">
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
