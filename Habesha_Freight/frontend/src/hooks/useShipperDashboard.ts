// src/hooks/useShipperDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { get } from '../services/api';

export interface ShipperLoad {
  id: string;
  origin_city: string;
  destination_city: string;
  cargo_description: string;
  weight_tons: number;
  offered_price_etb: number;
  status: string;
  created_at: string;
  // mapped aliases
  origin?: string;
  destination?: string;
  cargoType?: string;
  weight?: string;
  bidCount?: number;
}

export interface ShipperStats {
  total: number | string;
  active: number | string;
  completed: number | string;
  pendingBids: number | string;
  totalSpend: number | string;
  totalEscrow?: number | string;
}

/**
 * Hook to fetch shipper dashboard data: stats and shipper's loads.
 * Endpoints:
 *   GET /api/loads/shipper/stats
 *   GET /api/loads/shipper
 */
export function useShipperDashboard() {
  const [stats, setStats] = useState<ShipperStats | null>(null);
  const [loads, setLoads] = useState<ShipperLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, loadsData] = await Promise.all([
        get<any>('/loads/shipper/stats'),
        get<ShipperLoad[]>('/loads/shipper'),
      ]);

      const unwrappedStats = statsRes?.data ?? statsRes ?? null;
      setStats(unwrappedStats);

      const rawLoads = Array.isArray(loadsData) ? loadsData : (loadsData as any)?.data ?? [];
      const mapped: ShipperLoad[] = rawLoads.map((l: any) => ({
        ...l,
        origin: l.origin_city,
        destination: l.destination_city,
        cargoType: l.cargo_description,
        weight: l.weight_tons != null ? `${l.weight_tons} t` : '',
        bidCount: l.bid_count ?? 0,
      }));
      setLoads(mapped);
    } catch (e: any) {
      console.error('Shipper dashboard fetch error', e);
      setError(e?.message ?? 'Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { stats, loads, loading, error, refresh: fetchData };
}
