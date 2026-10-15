/**
 * useAvailableLoads – fetches POSTED loads available for the logged-in driver to bid on.
 * Backend endpoint: GET /api/driver/loads/available
 */
import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface AvailableLoad {
  id: string;
  shipper_id?: string;
  origin_city: string;
  destination_city: string;
  cargo_description: string;
  weight_tons: number;
  offered_price_etb: number;
  status: string;
  shipper_name?: string;
  shipper_phone?: string;
  distance_km?: number;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  created_at?: string;
  // mapped UI-friendly aliases
  origin?: string;
  destination?: string;
  cargoType?: string;
  weight?: string;
  bidCount?: number;
}

export interface LoadFilterParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  origin_city?: string;
  destination_city?: string;
}

export function useAvailableLoads(params?: LoadFilterParams) {
  const [loads, setLoads] = useState<AvailableLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams: Record<string, any> = {};
      if (params?.lat) queryParams.lat = params.lat;
      if (params?.lng) queryParams.lng = params.lng;
      if (params?.radius_km) queryParams.radius_km = params.radius_km;
      if (params?.origin_city && params.origin_city !== 'All Routes') {
        queryParams.origin_city = params.origin_city;
      }
      if (params?.destination_city) queryParams.destination_city = params.destination_city;

      const result = await get<any>('/driver/loads/available', queryParams);
      // Backend returns { success, count, driver_location, data: [...] } or an array directly
      const raw: any[] = Array.isArray(result)
        ? result
        : result?.data ?? result ?? [];

      const mapped: AvailableLoad[] = raw.map((l) => ({
        ...l,
        origin: l.origin_city,
        destination: l.destination_city,
        cargoType: l.cargo_description,
        weight: l.weight_tons != null ? `${l.weight_tons} t` : '',
        bidCount: l.bid_count ?? 0,
        distance_km: l.distance_km ?? 0,
      }));

      setLoads(mapped);
    } catch (e: any) {
      console.error('useAvailableLoads error:', e);
      setError(e?.message ?? 'Unable to load available shipments');
    } finally {
      setLoading(false);
    }
  }, [params?.lat, params?.lng, params?.radius_km, params?.origin_city, params?.destination_city]);

  useEffect(() => {
    fetchLoads();
  }, [fetchLoads]);

  return { loads, loading, error, refresh: fetchLoads };
}
