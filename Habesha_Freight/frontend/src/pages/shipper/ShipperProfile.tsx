// src/pages/shipper/ShipperProfile.tsx
import { useState, useEffect } from 'react';
import { get } from '../../services/api';
import { getStoredUser, fetchCurrentUser, updateUserProfile } from '../../services/authService';

interface UserProfile {
  id?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  role?: string;
  is_verified?: boolean;
  created_at?: string;
  location?: string;
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatCurrency = (n: number) => `ETB ${Number(n).toLocaleString()}`;

export default function ShipperProfile() {
  const storedUser = getStoredUser();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalShipmentsCount, setTotalShipmentsCount] = useState<number>(0);
  const [totalSpentAmount, setTotalSpentAmount] = useState<number>(0);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchProfileAndMetrics = async () => {
    setLoading(true);
    try {
      // 1. Fetch live user profile (GET /api/auth/me)
      let userData: UserProfile | null = null;
      try {
        const fetched = await fetchCurrentUser();
        userData = { ...fetched, email: fetched.email ?? undefined };
      } catch (err) {
        console.warn('Could not fetch GET /api/auth/me, using stored session user', err);
        if (storedUser) {
          userData = { ...storedUser, email: storedUser.email ?? undefined };
        }
      }

      if (userData) {
        setProfile({
          ...userData,
          location: userData.location || 'Addis Ababa',
        });
        setEditName(userData.full_name || '');
        setEditEmail(userData.email || '');
        setEditLocation(userData.location || 'Addis Ababa');
      }

      // 2. Fetch live shipments (GET /api/shipments) to calculate Total Shipments & Total Spent
      try {
        const shipmentsRes = await get<any>('/shipments');
        const shipmentsList: any[] = Array.isArray(shipmentsRes)
          ? shipmentsRes
          : shipmentsRes?.data ?? [];

        // Exact live database count
        setTotalShipmentsCount(shipmentsList.length);

        // Exact live database sum
        const spentSum = shipmentsList.reduce(
          (acc, s) => acc + (Number(s.offered_price_etb) || 0),
          0
        );
        setTotalSpentAmount(spentSum);
      } catch (err) {
        console.warn('Could not load shipments metrics:', err);
        setTotalShipmentsCount(0);
        setTotalSpentAmount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndMetrics();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setUpdateError(null);

    try {
      // Update profile via PATCH /api/auth/profile
      const updated = await updateUserProfile({
        full_name: editName,
        email: editEmail,
      });

      setProfile((prev) => ({
        ...prev,
        ...updated,
        email: updated.email ?? undefined,
        location: editLocation,
        full_name: editName,
      }));
      setIsEditing(false);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setUpdateError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.full_name ?? storedUser?.full_name ?? 'User')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatMemberDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900 min-h-screen">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Profile</h1>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full bg-[#071426] text-white flex items-center justify-center text-sm font-bold cursor-pointer"
          >
            {initials}
          </div>
        </div>
      </header>

      {/* ── Main Profile Card ── */}
      <div className="max-w-[600px]">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          {loading ? (
            <p className="text-slate-500 py-8 text-center">Loading profile details…</p>
          ) : (
            <div>
              {/* Profile Top Banner: Avatar + Name + Subtitle + Upload Photo */}
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-[#071426] text-white text-2xl font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {profile?.full_name}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium mt-0.5 capitalize">
                    {profile?.role ? profile.role.toLowerCase() : 'Shipper'} · {profile?.location || 'Addis Ababa'}
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('Photo upload dialog opened.')}
                    className="mt-2.5 px-3 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer bg-white"
                  >
                    Upload Photo
                  </button>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="flex flex-col text-sm divide-y divide-slate-100">
                {/* Phone */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Phone</span>
                  <span className="text-slate-900 font-semibold">
                    {profile?.phone_number}
                  </span>
                </div>

                {/* Email */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Email</span>
                  <span className="text-slate-900 font-semibold">
                    {profile?.email || 'Not provided'}
                  </span>
                </div>

                {/* Location */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Location</span>
                  <span className="text-slate-900 font-semibold">
                    {profile?.location || 'Addis Ababa'}
                  </span>
                </div>

                {/* Member Since */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Member Since</span>
                  <span className="text-slate-900 font-semibold">
                    {formatMemberDate(profile?.created_at)}
                  </span>
                </div>

                {/* Total Shipments */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total Shipments</span>
                  <span className="text-slate-900 font-semibold">{totalShipmentsCount}</span>
                </div>

                {/* Total Spent */}
                <div className="py-3.5 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Total Spent</span>
                  <span className="text-slate-900 font-semibold">
                    {formatCurrency(totalSpentAmount)}
                  </span>
                </div>
              </div>

              {/* Edit Profile Action Button */}
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl transition-colors cursor-pointer bg-white"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Profile</h3>

            {updateError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                {updateError}
              </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-4 py-2 bg-[#071426] hover:bg-[#0c203b] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}