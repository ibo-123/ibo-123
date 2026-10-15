import { useState, FormEvent } from 'react';
import { useCompanySettings } from '../../hooks/useCompanySettings';

export default function CompanySettings() {
  const { profile, setProfile, loading, saving, saveProfile } = useCompanySettings();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await saveProfile(profile);
    setToastMessage('Company settings saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-5 w-full max-w-4xl">
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 w-full max-w-4xl space-y-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border-l-4 border-amber-500 text-sm font-medium">
          🔔 {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Company Profile &amp; Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage company details, license numbers, and dispatch settings
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="name">
                Company Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={profile.name}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="email">
                Contact Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={profile.phone}
                onChange={handleChange}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="tin">
                TIN / Business Reg No.
              </label>
              <input
                id="tin"
                name="tin"
                type="text"
                value={profile.tin}
                readOnly
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="address">
              Headquarters Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={profile.address}
              onChange={handleChange}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Company Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
