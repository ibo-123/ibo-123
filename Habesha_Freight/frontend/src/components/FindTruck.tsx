interface FindTruckProps {
  onSelectSingle?: () => void;
  onSelectMultiple?: () => void;
}

export default function FindTruck({ onSelectSingle, onSelectMultiple }: FindTruckProps) {
  return (
    <div className="find-truck-container">
      <div className="find-truck-header">
        <h2 className="find-truck-title">What do you need?</h2>
        <p className="find-truck-subtitle">Choose how you want to move your cargo.</p>
      </div>

      <div className="find-truck-grid">
        {/* Single Truck Card */}
        <div className="find-truck-card">
          <div className="find-truck-icon-wrapper">
            <svg
              className="find-truck-icon"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Single Truck Icon"
            >
              {/* Green Truck Cab & Trailer Pixel/Flat Style */}
              <rect x="6" y="22" width="34" height="24" rx="2" fill="#22C55E" stroke="#111827" strokeWidth="2.5" />
              <rect x="40" y="28" width="18" height="18" rx="2" fill="#22C55E" stroke="#111827" strokeWidth="2.5" />
              <rect x="44" y="32" width="10" height="7" rx="1" fill="#FEF08A" stroke="#111827" strokeWidth="2" />
              <rect x="52" y="40" width="6" height="4" fill="#F97316" />
              {/* Wheels */}
              <circle cx="15" cy="48" r="5.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
              <circle cx="15" cy="48" r="2.5" fill="#9CA3AF" />
              <circle cx="29" cy="48" r="5.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
              <circle cx="29" cy="48" r="2.5" fill="#9CA3AF" />
              <circle cx="49" cy="48" r="5.5" fill="#1F2937" stroke="#111827" strokeWidth="2" />
              <circle cx="49" cy="48" r="2.5" fill="#9CA3AF" />
            </svg>
          </div>

          <h3 className="find-truck-card-title">Single Truck</h3>
          <p className="find-truck-card-desc">
            One vehicle for your shipment. Search individual drivers directly.
          </p>

          <ul className="find-truck-feature-list">
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>Direct driver search</span>
            </li>
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>Bidding system</span>
            </li>
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>View driver profile & ratings</span>
            </li>
          </ul>

          <button
            type="button"
            className="find-truck-btn find-truck-btn-driver"
            onClick={onSelectSingle}
          >
            Find a Driver &rarr;
          </button>
        </div>

        {/* Multiple Trucks Card */}
        <div className="find-truck-card">
          <div className="find-truck-icon-wrapper">
            <svg
              className="find-truck-icon"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Multiple Trucks / Transport Company Icon"
            >
              {/* Blue Office Building */}
              <rect x="14" y="14" width="36" height="38" rx="2" fill="#E0F2FE" stroke="#0F172A" strokeWidth="2.5" />
              {/* Windows Grid */}
              <rect x="20" y="20" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="29" y="20" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="38" y="20" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="20" y="28" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="29" y="28" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="38" y="28" width="6" height="5" rx="0.5" fill="#38BDF8" stroke="#0F172A" strokeWidth="1.5" />
              {/* Entrance Door */}
              <rect x="28" y="38" width="8" height="14" rx="1" fill="#0284C7" stroke="#0F172A" strokeWidth="1.5" />
            </svg>
          </div>

          <h3 className="find-truck-card-title">Multiple Trucks</h3>
          <p className="find-truck-card-desc">
            Large shipment requiring a fleet. Connect with transport companies.
          </p>

          <ul className="find-truck-feature-list">
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>Fleet providers prioritized</span>
            </li>
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>Company verification</span>
            </li>
            <li className="find-truck-feature-item">
              <span className="find-truck-check">&#10003;</span>
              <span>View company profile & fleet</span>
            </li>
          </ul>

          <button
            type="button"
            className="find-truck-btn find-truck-btn-company"
            onClick={onSelectMultiple}
          >
            Find a Company &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
