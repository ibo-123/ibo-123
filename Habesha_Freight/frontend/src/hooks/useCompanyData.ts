import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface Vehicle {
  id?: string;
  plate: string;
  model: string;
  type: string;
  capacity: string;
  driver?: string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'Available' | 'In Transit' | 'Maintenance';
}

export interface FleetRequest {
  id: string;
  customer: string;
  date: string;
  from: string;
  to: string;
  cargo: string;
  trucks: number;
  amount: string;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined';
}

interface CompanyStats {
  totalEarnings: number;
  ratingAverage: number;
  ratingTotal: number;
}

interface CompanyDataHook {
  companyName: string;
  vehicles: Vehicle[];
  requests: FleetRequest[];
  stats: CompanyStats;
  loading: boolean;
  refresh: () => void;
}

export function useCompanyData(): CompanyDataHook {
  const [companyName, setCompanyName] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<FleetRequest[]>([]);
  const [stats, setStats] = useState<CompanyStats>({ totalEarnings: 0, ratingAverage: 5.0, ratingTotal: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await get<any>('/company/profile').catch(() => null);
      const profile = profileRes?.data || profileRes;
      if (profile) {
        setCompanyName(profile.full_name || profile.company_name || 'Fleet Owner');
      }

      const statsRes = await get<any>('/company/stats').catch(() => null);
      const statsData = statsRes?.data || statsRes;
      if (statsData) {
        setStats({
          totalEarnings: Number(statsData.earnings || 0),
          ratingAverage: statsData.rating?.average ? Number(statsData.rating.average) : 5.0,
          ratingTotal: Number(statsData.rating?.total || 0),
        });
      }

      const vehData = await get<any>('/company/vehicles').catch(() => get<any>('/vehicles'));
      const vehList = Array.isArray(vehData) ? vehData : vehData?.vehicles || vehData?.data || [];
      setVehicles(
        vehList.map((v: any) => ({
          id: v.id,
          plate: v.plate_number || v.plateNumber || v.plate || '-',
          model: v.vehicle_type || v.model || v.make_model || 'Heavy Truck',
          type: v.vehicle_type || 'Truck',
          capacity: v.capacity_tons ? `${v.capacity_tons}t` : '-',
          driver: v.driverName || v.assigned_driver_id || 'Unassigned',
          status: v.is_active ? 'AVAILABLE' : 'MAINTENANCE',
        }))
      );

      const loadsData = await get<any>('/company/fleet-requests').catch(() => get<any>('/loads'));
      const loadList = Array.isArray(loadsData) ? loadsData : loadsData?.data || loadsData?.requests || [];
      setRequests(
        loadList.map((l: any, idx: number) => ({
          id: l.id ? `REQ-${l.id.slice(0, 6).toUpperCase()}` : `FR-00${idx + 1}`,
          customer: l.cargo_description || 'Commercial Freight',
          date: new Date(l.created_at || Date.now()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          from: l.origin_city || '-',
          to: l.destination_city || '-',
          cargo: l.cargo_description || '-',
          trucks: 1,
          amount: l.offered_price_etb
            ? `ETB ${Number(l.offered_price_etb).toLocaleString()}`
            : '-',
          status:
            l.status === 'MATCHED' || l.status === 'ASSIGNED'
              ? 'Accepted'
              : l.status === 'IN_TRANSIT'
              ? 'In Progress'
              : l.status === 'DELIVERED'
              ? 'Completed'
              : 'Pending',
        }))
      );
    } catch (e) {
      console.error('Company data fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { companyName, vehicles, requests, stats, loading, refresh: fetchData };
}
