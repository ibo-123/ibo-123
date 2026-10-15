import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Bid {
  id: string;
  driverName: string;
  driverInitials: string;
  truckModel: string;
  capacity: string;
  rating: number;
  price: string;
  phone?: string;
  tripsCompleted?: number;
  experience?: string;
}

export default function Requests() {
  const navigate = useNavigate();
  const [acceptedBids, setAcceptedBids] = useState<string[]>([]);
  const [activeCounterId, setActiveCounterId] = useState<string | null>(null);
  const [counterValues, setCounterValues] = useState<Record<string, string>>({});
  const [counterSent, setCounterSent] = useState<Record<string, string>>({});
  const [selectedDriver, setSelectedDriver] = useState<Bid | null>(null);

  const initialBids: Bid[] = [
    {
      id: 'bid-1',
      driverName: 'Abebe Girma',
      driverInitials: 'AG',
      truckModel: 'Isuzu FSR',
      capacity: '10 tons',
      rating: 4.8,
      price: 'ETB 8,500',
      phone: '+251 91 123 4567',
      tripsCompleted: 142,
      experience: '5 years',
    },
    {
      id: 'bid-2',
      driverName: 'Tesfaye Haile',
      driverInitials: 'TH',
      truckModel: 'Mercedes Actros',
      capacity: '20 tons',
      rating: 4.9,
      price: 'ETB 9,200',
      phone: '+251 92 345 6789',
      tripsCompleted: 210,
      experience: '8 years',
    },
    {
      id: 'bid-3',
      driverName: 'Dawit Tadesse',
      driverInitials: 'DT',
      truckModel: 'Volvo FMX',
      capacity: '15 tons',
      rating: 4.7,
      price: 'ETB 8,900',
      phone: '+251 93 456 7890',
      tripsCompleted: 98,
      experience: '4 years',
    },
  ];

  const handlePostShipment = () => {
    navigate('/shipments/create');
  };

  const handleAcceptBid = (id: string) => {
    if (!acceptedBids.includes(id)) {
      setAcceptedBids((prev) => [...prev, id]);
    }
  };

  const handleToggleCounter = (id: string) => {
    setActiveCounterId((prev) => (prev === id ? null : id));
  };

  const handleSendCounter = (id: string) => {
    const val = counterValues[id];
    if (val && val.trim()) {
      setCounterSent((prev) => ({ ...prev, [id]: val.trim() }));
      setActiveCounterId(null);
    }
  };

  return (
    <div className="requests-container">
      {/* Top Action Bar */}
      <div className="requests-top-bar">
        <button
          type="button"
          className="requests-post-btn"
          onClick={handlePostShipment}
        >
          + Post Shipment
        </button>
      </div>

      {/* Highlighted Yellow Notification Banner */}
      <div className="requests-banner">
        <strong>3 new bids</strong> on SHP-001 (Addis Ababa &rarr; Dire Dawa, 8 tons Electronics)
      </div>

      {/* Bids List */}
      <div className="requests-bids-list">
        {initialBids.map((bid) => {
          const isAccepted = acceptedBids.includes(bid.id);
          const isCountering = activeCounterId === bid.id;
          const sentCounter = counterSent[bid.id];

          return (
            <div key={bid.id} className={`requests-bid-card ${isAccepted ? 'requests-bid-card--accepted' : ''}`}>
              <div className="requests-bid-header">
                <div className="requests-driver-info">
                  <div className="requests-driver-avatar">
                    {bid.driverInitials}
                  </div>
                  <div className="requests-driver-details">
                    <h3 className="requests-driver-name">{bid.driverName}</h3>
                    <p className="requests-driver-truck">
                      {bid.truckModel} &middot; {bid.capacity}
                    </p>
                    <div className="requests-driver-rating">
                      <span className="requests-star-icon">&#11088;</span>
                      <span className="requests-rating-value">{bid.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="requests-price-box">
                  <div className="requests-price-value">
                    {sentCounter ? `ETB ${Number(sentCounter).toLocaleString()}` : bid.price}
                  </div>
                  <span className="requests-price-label">
                    {sentCounter ? 'Counter offered' : 'Offered price'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="requests-bid-actions">
                <button
                  type="button"
                  className={`requests-btn-accept ${isAccepted ? 'requests-btn-accepted' : ''}`}
                  onClick={() => handleAcceptBid(bid.id)}
                  disabled={isAccepted}
                >
                  {isAccepted ? 'Bid Accepted ✓' : 'Accept Bid ✓'}
                </button>

                <button
                  type="button"
                  className="requests-btn-secondary"
                  onClick={() => setSelectedDriver(bid)}
                >
                  View Profile
                </button>

                <button
                  type="button"
                  className="requests-btn-secondary"
                  onClick={() => handleToggleCounter(bid.id)}
                  disabled={isAccepted}
                >
                  {isCountering ? 'Cancel' : sentCounter ? 'Update Counter' : 'Counter Offer'}
                </button>
              </div>

              {/* Interactive Inline Counter Offer Form */}
              {isCountering && (
                <div className="requests-counter-box">
                  <div className="requests-counter-input-wrap">
                    <span className="requests-counter-currency">ETB</span>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      className="requests-counter-input"
                      value={counterValues[bid.id] || ''}
                      onChange={(e) =>
                        setCounterValues((prev) => ({ ...prev, [bid.id]: e.target.value }))
                      }
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    className="requests-counter-send-btn"
                    onClick={() => handleSendCounter(bid.id)}
                    disabled={!counterValues[bid.id]?.trim()}
                  >
                    Send Offer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Driver Profile Modal */}
      {selectedDriver && (
        <div className="requests-modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="requests-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="requests-modal-header">
              <div className="requests-driver-avatar requests-modal-avatar">
                {selectedDriver.driverInitials}
              </div>
              <div>
                <h3 className="requests-modal-title">{selectedDriver.driverName}</h3>
                <p className="requests-modal-subtitle">Verified Carrier &middot; &#11088; {selectedDriver.rating.toFixed(1)} rating</p>
              </div>
              <button
                type="button"
                className="requests-modal-close"
                onClick={() => setSelectedDriver(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="requests-modal-body">
              <div className="requests-modal-item">
                <span className="requests-modal-label">Vehicle Type</span>
                <span className="requests-modal-value">{selectedDriver.truckModel}</span>
              </div>
              <div className="requests-modal-item">
                <span className="requests-modal-label">Max Payload Capacity</span>
                <span className="requests-modal-value">{selectedDriver.capacity}</span>
              </div>
              <div className="requests-modal-item">
                <span className="requests-modal-label">Experience</span>
                <span className="requests-modal-value">{selectedDriver.experience}</span>
              </div>
              <div className="requests-modal-item">
                <span className="requests-modal-label">Completed Shipments</span>
                <span className="requests-modal-value">{selectedDriver.tripsCompleted} trips</span>
              </div>
              <div className="requests-modal-item">
                <span className="requests-modal-label">Phone Contact</span>
                <span className="requests-modal-value">{selectedDriver.phone}</span>
              </div>
            </div>

            <div className="requests-modal-footer">
              <button
                type="button"
                className="requests-btn-secondary"
                onClick={() => setSelectedDriver(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="requests-btn-accept"
                onClick={() => {
                  handleAcceptBid(selectedDriver.id);
                  setSelectedDriver(null);
                }}
              >
                Accept Offer ({selectedDriver.price})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
