// src/pages/shipper/ShipperRatings.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../../services/api';
import { getStoredUser } from '../../services/authService';

interface Review {
  id: string;
  shipment_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_name?: string;
  reviewee_name?: string;
  reviewee_role?: string;
  rating: number;
  comment?: string;
  created_at: string;
  tags?: string[];
}

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

// Helper to derive smart badges based on rating and comment text
const getDerivedTags = (rating: number, comment: string = ''): string[] => {
  const tags: string[] = [];
  const lower = comment.toLowerCase();

  if (lower.includes('on time') || lower.includes('timely')) tags.push('On Time');
  if (lower.includes('professional') || lower.includes('excellent')) tags.push('Professional');
  if (lower.includes('coordination') || lower.includes('reliable') || lower.includes('good')) tags.push('Reliable');
  if (lower.includes('safe') || lower.includes('secure')) tags.push('Cargo Safe');

  if (tags.length === 0) {
    if (rating === 5) tags.push('On Time', 'Professional');
    else if (rating >= 4) tags.push('Reliable');
    else tags.push('Feedback Logged');
  }

  return tags;
};

export default function ShipperRatings() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initials = (user?.full_name ?? 'Sara Bekele')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const fetchRatings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch live reviews given by this shipper from GET /api/reviews
      const res = await get<any>(`/reviews${user?.id ? `?reviewer_id=${user.id}` : ''}`);
      const list: Review[] = Array.isArray(res) ? res : res?.data ?? [];

      // Filter to reviews created by this shipper if not server filtered
      const shipperReviews = user?.id
        ? list.filter((r) => r.reviewer_id === user.id || !r.reviewer_id)
        : list;

      const formatted: Review[] = shipperReviews.map((r) => {
        let roleDisplay = 'Driver';
        if (r.reviewee_role === 'FLEET_OWNER' || r.reviewee_role === 'COMPANY') {
          roleDisplay = 'Company';
        } else if (r.reviewee_role === 'ADMIN') {
          roleDisplay = 'Admin';
        } else if ((r.reviewee_name || '').toLowerCase().includes('transport') || (r.reviewee_name || '').toLowerCase().includes('solutions')) {
          roleDisplay = 'Company';
        }

        return {
          ...r,
          reviewee_role: roleDisplay,
          tags: getDerivedTags(r.rating, r.comment),
        };
      });

      setReviews(formatted);
    } catch (err: any) {
      console.error('Error loading ratings:', err);
      setError('Unable to load ratings given. Please try again.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-5 w-full font-sans text-slate-900 min-h-screen">
      {/* ── Top Header ── */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-[1.75rem] font-bold text-slate-900 mb-1 leading-tight">Ratings</h1>
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

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* ── Ratings Container Card ── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Ratings You've Given</h2>

        {loading ? (
          <p className="text-slate-500 py-8 text-center">Loading ratings…</p>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            You haven't given any ratings yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors rounded-xl p-5"
              >
                {/* Header Row: Reviewee Name & Date */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-900 text-base">
                      {rev.reviewee_name || 'Service Provider'}
                    </span>
                    <span className="text-slate-400 font-normal text-sm">
                      ({rev.reviewee_role || 'Driver'})
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-medium">
                    {formatDate(rev.created_at)}
                  </span>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= rev.rating ? 'text-amber-400' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Review Comment Text */}
                {rev.comment && (
                  <p className="text-sm text-slate-700 font-normal mb-3 leading-relaxed">
                    {rev.comment}
                  </p>
                )}

                {/* Badges / Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {rev.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
