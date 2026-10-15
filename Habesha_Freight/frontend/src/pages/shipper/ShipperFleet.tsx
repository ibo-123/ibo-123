import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '../../services/api';
import { getStoredUser } from '../../services/authService';

interface FleetCompany {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  company_logo_url?: string;
  registration_number?: string;
  description?: string;
  is_verified: boolean;
  kyc_status: string;
  territory: string;
  rating: number;
  reviews_count: number;
  experience_years: number;
  fleet_size: number;
  available_trucks: number;
  vehicle_types: string[];
  estimated_price_etb: number;
}

interface CompanyDetailsData extends FleetCompany {
  vehicles: Array<{
    id: string;
    plate_number: string;
    vehicle_type: string;
    capacity_tons: number;
    is_active: boolean;
    verification_status: string;
  }>;
  drivers: Array<{
    id: string;
    full_name: string;
    phone_number: string;
    status: string;
  }>;
  reviews: Array<{
    id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

const CITIES = [
  'Select city',
  'Addis Ababa',
  'Adama',
  'Hawassa',
  'Dire Dawa',
  'Mekelle',
  'Bahir Dar',
  'Gondar',
  'Dessie',
  'Jimma',
  'Harar',
];

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export default function ShipperFleet() {
  const navigate = useNavigate();
  const user = getStoredUser();

  // Search Filters
  const [fromCity, setFromCity] = useState('Select city');
  const [toCity, setToCity] = useState('Select city');
  const [trucksNeeded, setTrucksNeeded] = useState<number>(2);

  // Data & Loading
  const [companies, setCompanies] = useState<FleetCompany[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Active Selections
  const [selectedCompany, setSelectedCompany] = useState<CompanyDetailsData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [requestModalCompany, setRequestModalCompany] = useState<FleetCompany | null>(null);

  // Fleet Request Form State
  const [requestForm, setRequestForm] = useState({
    cargo_description: '',
    weight_tons: '25',
    offered_price_etb: '',
  });
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);
  const [requestSuccess, setRequestSuccess] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Fetch Companies on Load & Filter
  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        trucks_needed: trucksNeeded,
      };
      if (fromCity !== 'Select city') params.origin_city = fromCity;
      if (toCity !== 'Select city') params.destination_city = toCity;

      const res = await get<any>('/shipper/companies', params);
      if (res?.data) {
        setCompanies(res.data);
      } else if (Array.isArray(res)) {
        setCompanies(res);
      }
    } catch (err: any) {
      console.error('Error fetching fleet companies:', err);
      setError(err.message || 'Failed to load fleet companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompanies();
  };

  // Open Company Detail View
  const handleViewCompany = async (companyId: string) => {
    setLoadingDetails(true);
    try {
      const res = await get<any>(`/shipper/companies/${companyId}`);
      if (res?.data) {
        setSelectedCompany(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching company details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Request Fleet Modal
  const handleOpenRequestModal = (company: FleetCompany) => {
    setRequestModalCompany(company);
    setRequestForm({
      cargo_description: '',
      weight_tons: '25',
      offered_price_etb: String(company.estimated_price_etb || 38000),
    });
    setRequestSuccess(false);
    setRequestError(null);
  };

  // Submit Direct Fleet Request
  const handleSubmitFleetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestModalCompany) return;

    if (!requestForm.cargo_description.trim()) {
      setRequestError('Cargo description is required.');
      return;
    }

    setSubmittingRequest(true);
    setRequestError(null);

    try {
      const payload = {
        company_id: requestModalCompany.id,
        origin_city: fromCity !== 'Select city' ? fromCity : 'Addis Ababa',
        destination_city: toCity !== 'Select city' ? toCity : 'Adama',
        cargo_description: requestForm.cargo_description,
        weight_tons: Number(requestForm.weight_tons),
        offered_price_etb: Number(requestForm.offered_price_etb),
        trucks_needed: trucksNeeded,
      };

      await post('/shipper/fleet-requests', payload);
      setRequestSuccess(true);
      setTimeout(() => {
        setRequestModalCompany(null);
        setRequestSuccess(false);
        navigate('/shipments');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating fleet request:', err);
      setRequestError(err.message || 'Failed to submit fleet request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Multiple Trucks</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── Back button & Search Box Section ── */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/shipments/create')}
            className="text-slate-400 hover:text-slate-700 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            ← Back
          </button>
          <span className="text-slate-300">|</span>
          <h2 className="text-lg font-bold text-slate-900">Search Fleet Providers</h2>
        </div>

        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* From City */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</label>
            <select
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* To City */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</label>
            <select
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Trucks Needed */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trucks Needed</label>
            <input
              type="number"
              min={1}
              max={50}
              value={trucksNeeded}
              onChange={(e) => setTrucksNeeded(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full p-3 bg-[#C8933A] text-white font-semibold text-sm rounded-lg hover:bg-[#b07e2e] transition-colors shadow-sm"
          >
            Search Companies
          </button>
        </form>
      </div>

      {/* ── Summary Line ── */}
      <div className="text-sm text-slate-500 mb-6 font-medium">
        {companies.length} fleet providers available · {trucksNeeded} {trucksNeeded === 1 ? 'truck' : 'trucks'} requested
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-6 text-sm">{error}</div>}

      {/* ── Company Cards List ── */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading fleet providers...</div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-500">
          No fleet providers found matching your search criteria. Try selecting different cities or truck count.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-6"
            >
              {/* Top Header Row */}
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#071426] text-white font-bold text-lg flex items-center justify-center shadow-inner">
                    {getCompanyInitials(company.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">{company.name}</h3>
                      {company.is_verified && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>⭐ {company.rating} ({company.reviews_count} reviews)</span>
                      <span>·</span>
                      <span>{company.experience_years} years</span>
                      <span>·</span>
                      <span>{company.territory}</span>
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">
                    ETB {company.estimated_price_etb.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Est. for {trucksNeeded} trucks</div>
                </div>
              </div>

              {/* Stats Grid Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Fleet Size</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{company.fleet_size} trucks</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Available</div>
                  <div className="font-semibold text-emerald-600 mt-0.5 flex items-center gap-1">
                    {company.available_trucks} trucks ✓
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Experience</div>
                  <div className="font-semibold text-slate-800 mt-0.5">{company.experience_years} years</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Vehicle Types</div>
                  <div className="font-semibold text-slate-800 mt-0.5 truncate">
                    {company.vehicle_types.join(', ')}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex gap-4 items-center">
                <button
                  type="button"
                  onClick={() => handleViewCompany(company.id)}
                  disabled={loadingDetails}
                  className="flex-1 py-3 px-4 rounded-lg border border-slate-900 text-slate-900 font-semibold text-sm hover:bg-slate-50 transition-colors text-center disabled:opacity-50"
                >
                  {loadingDetails && selectedCompany?.id === company.id ? 'Loading...' : 'View Company'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenRequestModal(company)}
                  className="flex-1 py-3 px-4 rounded-lg bg-[#C8933A] text-white font-semibold text-sm hover:bg-[#b07e2e] transition-colors text-center shadow-sm"
                >
                  Request Fleet →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── View Company Details Overlay Modal ── */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-2"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-[#071426] text-white font-bold text-xl flex items-center justify-center shadow-inner">
                {getCompanyInitials(selectedCompany.name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{selectedCompany.name}</h2>
                  {selectedCompany.is_verified && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Reg No: {selectedCompany.registration_number || 'ET-REG-99182'} · {selectedCompany.email}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Company Overview</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {selectedCompany.description ||
                  'Leading freight and heavy transport provider operating nationwide across Ethiopia.'}
              </p>
            </div>

            {/* Fleet Vehicles Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Registered Fleet Vehicles</h4>
              <div className="flex flex-col gap-2">
                {selectedCompany.vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🚚</span>
                      <div>
                        <span className="font-bold text-slate-800">{v.plate_number}</span>
                        <span className="text-slate-400 ml-2">({v.vehicle_type})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-600">{v.capacity_tons} Tons</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded">
                        Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-800 mb-3">Recent Customer Reviews</h4>
              <div className="flex flex-col gap-3">
                {selectedCompany.reviews.map((r) => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">{r.reviewer_name}</span>
                      <span className="text-amber-500 font-semibold">{'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p className="text-slate-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="flex-1 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const companyToReq = selectedCompany;
                  setSelectedCompany(null);
                  handleOpenRequestModal(companyToReq);
                }}
                className="flex-1 py-3 bg-[#C8933A] text-white rounded-lg text-sm font-semibold hover:bg-[#b07e2e] transition-colors"
              >
                Request Fleet →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Fleet Modal ── */}
      {requestModalCompany && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setRequestModalCompany(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold p-2"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Request Fleet</h2>
            <p className="text-xs text-slate-500 mb-6">
              Send direct request to <strong className="text-slate-800">{requestModalCompany.name}</strong> for{' '}
              {trucksNeeded} trucks.
            </p>

            {requestSuccess ? (
              <div className="py-8 text-center">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Fleet Request Sent!</h3>
                <p className="text-xs text-slate-500">
                  {requestModalCompany.name} has received your fleet request. You will be notified when they accept.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFleetRequest} className="flex flex-col gap-4 text-xs">
                {requestError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{requestError}</div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Cargo Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Industrial Steel Beams (2 Shipments)"
                    value={requestForm.cargo_description}
                    onChange={(e) =>
                      setRequestForm((prev) => ({ ...prev, cargo_description: e.target.value }))
                    }
                    className="p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Weight (Tons) *</label>
                    <input
                      type="number"
                      required
                      value={requestForm.weight_tons}
                      onChange={(e) =>
                        setRequestForm((prev) => ({ ...prev, weight_tons: e.target.value }))
                      }
                      className="p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-slate-700">Offered Price (ETB) *</label>
                    <input
                      type="number"
                      required
                      value={requestForm.offered_price_etb}
                      onChange={(e) =>
                        setRequestForm((prev) => ({ ...prev, offered_price_etb: e.target.value }))
                      }
                      className="p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8933A]/30"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 mt-2">
                  📍 Route: <strong>{fromCity !== 'Select city' ? fromCity : 'Addis Ababa'}</strong> →{' '}
                  <strong>{toCity !== 'Select city' ? toCity : 'Adama'}</strong> ({trucksNeeded} Trucks)
                </div>

                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRequestModalCompany(null)}
                    className="px-5 py-2.5 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2.5 bg-[#C8933A] text-white rounded-lg font-semibold hover:bg-[#b07e2e] transition-colors disabled:opacity-50"
                  >
                    {submittingRequest ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}