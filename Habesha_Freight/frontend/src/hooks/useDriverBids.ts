/**
 * useDriverBids – fetches all bids placed by the logged-in driver.
 * Backend endpoint: GET /api/driver/bids
 */
import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface DriverBid {
  id: string;
  load_id: string;
  bid_amount_etb: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  // joined load fields
  origin_city?: string;
  destination_city?: string;
  cargo_description?: string;
  weight_tons?: number;
  offered_price_etb?: number;
  load_status?: string;
}

export function useDriverBids() {
  const [bids, setBids] = useState<DriverBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<DriverBid[]>('/driver/bids');
      const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setBids(list);
    } catch (e: any) {
      console.error('useDriverBids error:', e);
      setError(e?.message ?? 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return { bids, loading, error, refresh: fetchBids };
}
