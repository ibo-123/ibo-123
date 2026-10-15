import React, { useState, useEffect } from 'react';
import { get } from '../../services/api';
import ErrorState from '../../components/ErrorState';

interface DriverProfileResponse {
  id: string;
  full_name: string;
  phone_number: string;
  email: string;
  profile_photo_url?: string;
  kyc_status: string;
  is_verified: boolean;
  status: string;
  license_number?: string;
  vehicle?: {
    model?: string;
    plate_number?: string;
    capacity_tons?: number;
    vehicle_type?: string;
    verification_status?: string;
  };
  stats?: {
    total_shipments: number;
    active_shipments: number;
    completed_shipments: number;
  };
}

const DriverInfo: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DriverProfileResponse | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await get<any>('/driver/profile');
      const data = res?.data ?? res;
      setProfile(data);
    } catch (err: any) {
      console.error('Error loading driver profile:', err);
      setError(err.message || 'Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        alert(`Photo "${target.files[0].name}" selected for upload`);
      }
    };
    fileInput.click();
  };

  if (loading) {
    return <div className="p-4 sm:p-5 text-center text-slate-500">Loading driver profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="driver-profile-container">
        <ErrorState message={error || 'Profile not found.'} />
      </div>
    );
  }

  const nameParts = profile.full_name ? profile.full_name.split(' ') : ['Driver'];
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : profile.full_name.slice(0, 2).toUpperCase();

  const vehicle = profile.vehicle;
  const stats = profile.stats;
  const isKycApproved = profile.kyc_status === 'APPROVED';

  return (
    <div className="driver-profile-container">
      {/* Page Header */}
      <div className="profile-page-header">
        <div className="profile-header-left">
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-page-date">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="profile-header-right">
          <div className="status-pill">
            <span className="status-dot"></span>
            {isOnline ? 'Online & Available' : 'Offline'}
          </div>
          <button
            className="status-toggle-btn"
            onClick={() => setIsOnline(!isOnline)}
            title="Toggle online status"
          >
            {isOnline ? '🌙' : '☀️'}
          </button>
          <div className="header-avatar">{initials}</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Profile Introduction */}
        <div className="profile-intro">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <h2 className="profile-name">{profile.full_name}</h2>
            <div className="profile-meta">
              <span className="profile-trips">{stats?.completed_shipments ?? 0} completed trips</span>
              {isKycApproved ? (
                <span className="verified-badge bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-semibold">
                  ✓ Verified Driver
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                  ⏳ Pending Verification
                </span>
              )}
            </div>
            <p className="profile-phone">{profile.phone_number}</p>
            <p className="text-xs text-slate-500">{profile.email}</p>
            <button className="upload-photo-btn mt-2" onClick={handleUploadPhoto}>
              Upload Photo
            </button>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">License Number</span>
            <span className="detail-value">{profile.license_number ? profile.license_number : 'Not Provided'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Truck Model</span>
            <span className="detail-value">{vehicle?.model ? vehicle.model : 'Not Assigned'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Plate Number</span>
            <span className="detail-value">{vehicle?.plate_number ? vehicle.plate_number : 'Not Assigned'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Capacity</span>
            <span className="detail-value">{vehicle?.capacity_tons ? `${vehicle.capacity_tons} tons` : 'Not Assigned'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Truck Type</span>
            <span className="detail-value">{vehicle?.vehicle_type ? vehicle.vehicle_type : 'Not Assigned'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Verification Status</span>
            <span className="detail-value font-medium text-slate-800">
              {profile.kyc_status === 'APPROVED' ? 'Verified' : 'Pending Verification'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverInfo;