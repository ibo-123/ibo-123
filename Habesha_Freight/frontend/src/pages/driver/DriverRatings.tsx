import React, { useState, useEffect } from 'react';
import { get } from '../../services/api';

interface ReviewItem {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RatingsResponse {
  average: number;
  totalTrips: number;
  totalReviews: number;
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ReviewItem[];
}

const DashboardCard: React.FC<{
  title: string;
  value: string;
  icon: string;
  iconBg: string;
}> = ({ title, value, icon, iconBg }) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e8e8f0',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', color: '#8b8b9f' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>{value}</div>
      </div>
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
        }}
      >
        {icon}
      </div>
    </div>
  );
};

const DriverRatings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RatingsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'breakdown' | 'reviews'>('breakdown');

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const res = await get<any>('/driver/ratings');
      const payload = res?.data ?? res;
      setData(payload);
    } catch (err) {
      console.error('Failed to load ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const ratingVal = data?.average ?? 5.0;
  const totalTrips = data?.totalTrips ?? 0;
  const breakdown = data?.breakdown ?? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const reviews = data?.reviews ?? [];

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px', fontSize: '16px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ color: star <= rating ? '#fbbf24' : '#d1d5db' }}>
            {star <= rating ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const labels: Record<number, string> = {
      5: '5 stars',
      4: '4 stars',
      3: '3 stars',
      2: '2 stars',
      1: '1 star',
    };

    return (
      <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#6b6b80', width: '60px' }}>{labels[stars]}</span>
        <div style={{ flex: 1, height: '6px', backgroundColor: '#f0f0f5', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', backgroundColor: '#fbbf24', borderRadius: '4px', width: `${percentage}%` }} />
        </div>
        <span style={{ fontSize: '13px', color: '#8b8b9f', width: '30px', textAlign: 'right' }}>{count}</span>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px' }}>
      <h1 className="text-xl font-bold text-slate-900 mb-4">Ratings & Performance</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <DashboardCard
          title="Average Rating"
          value={loading ? '…' : `${ratingVal} ⭐`}
          icon="⭐"
          iconBg="#fef3c7"
        />
        <DashboardCard
          title="Total Trips"
          value={loading ? '…' : totalTrips.toString()}
          icon="📈"
          iconBg="#dbeafe"
        />
        <DashboardCard
          title="Completion Rate"
          value="100%"
          icon="🏆"
          iconBg="#dcfce7"
        />
        <DashboardCard
          title="On Time Punctuality"
          value="99%"
          icon="✅"
          iconBg="#ede9fe"
        />
      </div>

      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid #e8e8f0', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('breakdown')}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'breakdown' ? '#3b82f6' : '#6b6b80',
            borderBottom: activeTab === 'breakdown' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          Rating Breakdown
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: 500,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: activeTab === 'reviews' ? '#3b82f6' : '#6b6b80',
            borderBottom: activeTab === 'reviews' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          Shipper Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'breakdown' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e8e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              ⭐
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e' }}>
                {ratingVal} / 5.0
              </div>
              <div style={{ fontSize: '13px', color: '#6b6b80' }}>
                {data?.totalReviews ? `${data.totalReviews} verified reviews` : 'Top Rated Verified Driver'}
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#3a3a52', marginBottom: '16px' }}>
            Rating Distribution
          </h3>
          <div>
            {renderRatingBar(5, breakdown[5] || 0, data?.totalReviews || 1)}
            {renderRatingBar(4, breakdown[4] || 0, data?.totalReviews || 1)}
            {renderRatingBar(3, breakdown[3] || 0, data?.totalReviews || 1)}
            {renderRatingBar(2, breakdown[2] || 0, data?.totalReviews || 1)}
            {renderRatingBar(1, breakdown[1] || 0, data?.totalReviews || 1)}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e8e8f0', overflow: 'hidden' }}>
          {reviews.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#8b8b9f' }}>
              No written reviews received yet.
            </div>
          ) : (
            reviews.map((r, index) => (
              <div
                key={r.id}
                style={{
                  padding: '20px 24px',
                  borderBottom: index < reviews.length - 1 ? '1px solid #f0f0f5' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#4a4a62',
                    }}
                  >
                    {(r.reviewer_name || 'S').charAt(0)}
                  </div>
                  <span style={{ fontWeight: 500, color: '#1a1a2e' }}>{r.reviewer_name || 'Shipper'}</span>
                </div>
                <div style={{ marginLeft: '44px' }}>
                  {renderStars(r.rating)}
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#5a5a72' }}>"{r.comment}"</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DriverRatings;