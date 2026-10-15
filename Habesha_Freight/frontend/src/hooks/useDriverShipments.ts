/**
 * useDriverShipments – fetches active/past shipments for the logged-in driver.
 * Backend endpoint: GET /api/driver/shipments
 */
import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface DriverShipment {
  id: string;
  load_id: string;
  carrier_id: string;
  vehicle_id?: string;
  status: 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  pickup_otp_hash?: string;
  delivery_otp_hash?: string;
  created_at: string;
  updated_at?: string;
  // Joined fields from loads/users
  origin_city?: string;
  destination_city?: string;
  origin_lat?: number | string;
  origin_lng?: number | string;
  destination_lat?: number | string;
  destination_lng?: number | string;
  cargo_description?: string;
  weight_tons?: number;
  offered_price_etb?: number | string;
  shipper_name?: string;
}

export function useDriverShipments() {
  const [shipments, setShipments] = useState<DriverShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<DriverShipment[]>('/driver/shipments');
      const list = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setShipments(list);
    } catch (e: any) {
      console.error('useDriverShipments error:', e);
      setError(e?.message ?? 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  return { shipments, loading, error, refresh: fetchShipments };
}
