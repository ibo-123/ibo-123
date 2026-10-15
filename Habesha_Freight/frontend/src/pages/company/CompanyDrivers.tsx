import { useCompanyDrivers } from '../../hooks/useCompanyDrivers';
import { useCompanySettings } from '../../hooks/useCompanySettings';

export default function CompanyDrivers() {
  const { profile, loading: profileLoading } = useCompanySettings();
  const companyId = profile?.id ?? '';
  const { drivers, loading, error } = useCompanyDrivers(companyId);
  if (profileLoading) {
    return (
      <div className="p-4 sm:p-5 w-full">
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading company directory...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-5 w-full space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Drivers Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Licensed heavy truck operators registered under your fleet company</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                <th className="p-3">Driver Name</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">License Grade</th>
                <th className="p-3">Assigned Vehicle</th>
                <th className="p-3">Duty Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">{loading ? (
              <tr><td colSpan={5} className="p-3 text-center">Loading drivers...</td></tr>
            ) : error ? (
              <tr><td colSpan={5} className="p-3 text-center text-red-500">{error}</td></tr>
            ) : drivers.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold text-slate-900">{d.name}</td>
                <td className="p-3 font-mono text-slate-600">{d.phone}</td>
                <td className="p-3 text-slate-700 font-medium">{d.licenseGrade}</td>
                <td className="p-3 font-semibold text-slate-800">{d.assignedVehicle}</td>
                <td className="p-3">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                      d.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}</tbody>



          </table>
        </div>
      </div>
    </div>
  );
}
