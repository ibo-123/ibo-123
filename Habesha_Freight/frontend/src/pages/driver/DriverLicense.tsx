import PageHeader from '../../components/PageHeader';

export default function DriverLicense() {
  // TODO: Replace with API response from GET /api/driver/license

  return (
    <div>
      <PageHeader title="Driver License" subtitle="Your license and verification details" />

      <div className="p2-card" style={{ maxWidth: '640px' }}>
        <div className="p2-form-group">
          <label className="p2-form-label">License Number</label>
          <input className="p2-input" placeholder="Enter license number" />
        </div>
        <div className="p2-form-row">
          <div className="p2-form-group">
            <label className="p2-form-label">Issue Date</label>
            <input className="p2-input" type="date" />
          </div>
          <div className="p2-form-group">
            <label className="p2-form-label">Expiry Date</label>
            <input className="p2-input" type="date" />
          </div>
        </div>
        <div className="p2-form-group">
          <label className="p2-form-label">License Class</label>
          <select className="p2-select" defaultValue="">
            <option value="" disabled>Select class</option>
            <option value="C">Class C — Heavy Truck</option>
            <option value="D">Class D — Trailer</option>
          </select>
        </div>
        <p style={{ color: '#6b7c8f', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {/* TODO: Backend endpoint required: PATCH /api/driver/license */}
          License verification is managed through the KYC process.
        </p>
        <button type="button" className="btn-primary">Save License Info</button>
      </div>
    </div>
  );
}
