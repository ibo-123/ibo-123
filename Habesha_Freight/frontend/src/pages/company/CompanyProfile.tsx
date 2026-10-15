import { useCompanySettings } from '../../hooks/useCompanySettings';
import { Link } from 'react-router-dom';

export default function CompanyProfile() {
  const { profile, loading } = useCompanySettings();

  if (loading) {
    return (
      <div className="p-4 sm:p-5 w-full max-w-4xl">
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 w-full max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Overview of the company details fetched from the backend.</p>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Name</label>
          <p className="col-span-1 sm:col-span-2 text-lg font-semibold text-slate-800">{profile.name}</p>

          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
          <p className="text-lg font-semibold text-slate-800">{profile.email}</p>

          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
          <p className="text-lg font-semibold text-slate-800">{profile.phone}</p>

          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">TIN / Business Reg No.</label>
          <p className="text-lg font-semibold text-slate-800">{profile.tin}</p>

          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Headquarters Address</label>
          <p className="text-lg font-semibold text-slate-800">{profile.address}</p>
        </div>
        <div className="pt-4 flex justify-end">
          <Link
            to="/company/settings"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md"
          >
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
