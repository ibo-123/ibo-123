/**
 * useDriverStats – fetches dashboard summary stats for the logged-in driver.
 * Backend endpoint: GET /api/driver/stats
 */
import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface DriverStats {
  totalTrips: number;
  activeJobs: number;
  pendingBids: number;
  totalEarningsEtb: number;
  avgRating: string | null;
}

export function useDriverStats() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<DriverStats>('/driver/stats');
      setStats(data);
    } catch (e: any) {
      console.error('useDriverStats error:', e);
      setError(e?.message ?? 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}
