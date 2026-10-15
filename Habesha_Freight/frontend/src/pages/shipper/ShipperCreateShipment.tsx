// src/pages/shipper/ShipperCreateShipment.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { post } from '../../services/api';
import { getStoredUser } from '../../services/authService';

interface FormData {
  origin_city: string;
  destination_city: string;
  cargo_description: string;
  weight_tons: string;
  offered_price_etb: string;
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'addis ababa': { lat: 8.9806, lng: 38.7578 },
  'addis': { lat: 8.9806, lng: 38.7578 },
  'adama': { lat: 8.5414, lng: 39.2689 },
  'nazret': { lat: 8.5414, lng: 39.2689 },
  'hawassa': { lat: 7.0621, lng: 38.4763 },
  'dire dawa': { lat: 9.6009, lng: 41.8501 },
  'mekelle': { lat: 13.4967, lng: 39.4768 },
  'bahir dar': { lat: 11.5742, lng: 37.3614 },
  'gondar': { lat: 12.6030, lng: 37.4521 },
  'dessie': { lat: 11.1298, lng: 39.6387 },
  'jimma': { lat: 7.6667, lng: 36.8333 },
  'harar': { lat: 9.3139, lng: 42.1181 },
};

function getCityCoords(cityName: string) {
  const normalized = cityName.trim().toLowerCase();
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }
  const offsetLat = (Math.random() - 0.5) * 0.1;
  const offsetLng = (Math.random() - 0.5) * 0.1;
  return {
    lat: 8.9806 + offsetLat,
    lng: 38.7578 + offsetLng,
  };
}

export default function CreateShipment() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [view, setView] = useState<'selection' | 'form'>('selection');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    origin_city: '',
    destination_city: '',
    cargo_description: '',
    weight_tons: '',
    offered_price_etb: '',
  });

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.origin_city.trim()) newErrors.origin_city = 'Origin is required';
    if (!formData.destination_city.trim()) newErrors.destination_city = 'Destination is required';
    if (!formData.cargo_description.trim()) newErrors.cargo_description = 'Cargo description is required';
    if (!formData.weight_tons.trim() || Number(formData.weight_tons) <= 0) {
      newErrors.weight_tons = 'Valid weight in tons is required';
    }
    if (!formData.offered_price_etb.trim() || Number(formData.offered_price_etb) <= 0) {
      newErrors.offered_price_etb = 'Valid offered price in ETB is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const originCoords = getCityCoords(formData.origin_city);
    const destCoords = getCityCoords(formData.destination_city);

    const payload = {
      cargo_description: formData.cargo_description,
      weight_tons: Number(formData.weight_tons),
      origin_city: formData.origin_city,
      destination_city: formData.destination_city,
      origin_lat: originCoords.lat,
      origin_lng: originCoords.lng,
      destination_lat: destCoords.lat,
      destination_lng: destCoords.lng,
      offered_price_etb: Number(formData.offered_price_etb),
    };

    try {
      await post('/loads', payload);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/shipments');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to post shipment', err);
      setErrorMessage(err.message || 'Failed to post shipment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Header ──
  const renderHeader = (title: string) => (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">{title}</h1>
        <p className="text-sm text-slate-500">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer" onClick={() => navigate('/profile')}>
          {initials}
        </div>
      </div>
    </header>
  );

  if (submitSuccess) {
    return (
      <div className="p-4 sm:p-5 w-full flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md">
          <span className="text-5xl block mb-4">✅</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Shipment Posted!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Your shipment from <span className="font-semibold text-slate-800">{formData.origin_city}</span> to{' '}
            <span className="font-semibold text-slate-800">{formData.destination_city}</span> has been posted to the driver bidding pool.
          </p>
          <button
            onClick={() => navigate('/shipments')}
            className="w-full py-3 bg-[#071426] text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Requests
          </button>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="p-4 sm:p-5 max-w-2xl mx-auto font-sans">
        {renderHeader('Post a Shipment')}

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <button
            type="button"
            onClick={() => setView('selection')}
            className="text-xs text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1"
          >
            ← Back to options
          </button>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Cargo description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-800">Cargo Description *</label>
              <textarea
                name="cargo_description"
                value={formData.cargo_description}
                onChange={handleChange}
                placeholder="e.g. Construction Cement Bags (500 Bags)"
                className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 ${
                  errors.cargo_description ? 'border-red-500' : 'border-slate-200'
                }`}
                rows={3}
              />
              {errors.cargo_description && (
                <span className="text-xs text-red-500 font-medium">{errors.cargo_description}</span>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-800">Weight (Tons) *</label>
              <input
                type="number"
                name="weight_tons"
                step="any"
                value={formData.weight_tons}
                onChange={handleChange}
                placeholder="e.g. 25"
                className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 ${
                  errors.weight_tons ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.weight_tons && (
                <span className="text-xs text-red-500 font-medium">{errors.weight_tons}</span>
              )}
            </div>

            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800">Origin City *</label>
                <input
                  type="text"
                  name="origin_city"
                  value={formData.origin_city}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa"
                  className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 ${
                    errors.origin_city ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.origin_city && (
                  <span className="text-xs text-red-500 font-medium">{errors.origin_city}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800">Destination City *</label>
                <input
                  type="text"
                  name="destination_city"
                  value={formData.destination_city}
                  onChange={handleChange}
                  placeholder="e.g. Hawassa"
                  className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 ${
                    errors.destination_city ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.destination_city && (
                  <span className="text-xs text-red-500 font-medium">{errors.destination_city}</span>
                )}
              </div>
            </div>

            {/* Offered Price */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-800">Offered Price (ETB) *</label>
              <input
                type="number"
                name="offered_price_etb"
                value={formData.offered_price_etb}
                onChange={handleChange}
                placeholder="e.g. 45000"
                className={`w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#071426]/20 ${
                  errors.offered_price_etb ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.offered_price_etb && (
                <span className="text-xs text-red-500 font-medium">{errors.offered_price_etb}</span>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => setView('selection')}
                className="px-6 py-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-850 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Post Load'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Render Selection Screen (Matching Screenshot) ──
  return (
    <div className="p-4 sm:p-5 w-full font-sans">
      {renderHeader('Find Truck')}

      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <h2 className="text-3xl font-bold text-slate-900 font-serif mb-2">What do you need?</h2>
        <p className="text-slate-500 text-sm mb-12">Choose how you want to move your cargo.</p>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl justify-center items-stretch">
          {/* Card 1: Single Truck */}
          <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-950 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-6">🚚</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Single Truck</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                One vehicle for your shipment. Search individual drivers directly.
              </p>
              <ul className="flex flex-col gap-2.5 mb-8 text-sm">
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> Direct driver search
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> Bidding system
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> View driver profile & ratings
                </li>
              </ul>
            </div>
            <button
              onClick={() => setView('form')}
              className="w-full py-3 bg-[#071426] text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
            >
              Find a Driver →
            </button>
          </div>

          {/* Card 2: Multiple Trucks */}
          <div className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-4xl mb-6">🏢</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multiple Trucks</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Large shipment requiring a fleet. Connect with transport companies.
              </p>
              <ul className="flex flex-col gap-2.5 mb-8 text-sm">
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> Fleet providers prioritized
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> Company verification
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="text-slate-300">✓</span> View company profile & fleet
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/fleet')}
              className="w-full py-3 bg-[#C8933A] text-white rounded-lg text-sm font-semibold hover:bg-brand-goldHover transition-colors flex items-center justify-center gap-1"
            >
              Find a Company →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}