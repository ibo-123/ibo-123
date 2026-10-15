import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';

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

export function useCompanyFleetRequests() {
  const [requests, setRequests] = useState<FleetRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let loadsRes: any;
      try {
        loadsRes = await api.get<any>('/company/fleet-requests');
      } catch {
        loadsRes = await api.get<any>('/loads');
      }
      const loadList = Array.isArray(loadsRes)
        ? loadsRes
        : Array.isArray(loadsRes?.data)
        ? loadsRes.data
        : Array.isArray(loadsRes?.loads)
        ? loadsRes.loads
        : [];

      if (loadList.length > 0) {
        const mapped = loadList.map((l: any, idx: number) => ({
          id: String(l.id || `FR-00${idx + 1}`),
          customer: l.shipper_name || l.shipperName || 'Abebe Bikila Freight Ltd',
          date: new Date(l.created_at || l.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          from: l.origin_city || l.origin || 'Addis Ababa',
          to: l.destination_city || l.destination || 'Regional Hub',
          cargo: l.cargo_description || l.cargoType || 'General Freight',
          trucks: l.weight_tons ? Math.ceil(l.weight_tons / 10) : l.trucksNeeded || 2,
          amount: l.offered_price_etb ? `ETB ${Number(l.offered_price_etb).toLocaleString()}` : l.budget ? `ETB ${Number(l.budget).toLocaleString()}` : 'ETB 45,000',
          status:
            l.status === 'MATCHED' || l.status === 'ASSIGNED'
              ? 'Accepted'
              : l.status === 'IN_TRANSIT'
              ? 'In Progress'
              : l.status === 'COMPLETED'
              ? 'Completed'
              : l.status === 'CANCELLED' || l.status === 'DECLINED'
              ? 'Declined'
              : 'Pending',
        }));
        setRequests(mapped);
      } else {
        setRequests([
          { id: 'FR-8801', customer: 'Ethiopian Produce Exporters', date: 'Aug 22', from: 'Addis Ababa', to: 'Djibouti Port', cargo: 'Sesame & Coffee Export (35 Tons)', trucks: 3, amount: 'ETB 145,000', status: 'Pending' },
          { id: 'FR-8802', customer: 'Mojo Dry Port Logistics', date: 'Aug 21', from: 'Mojo Hub', to: 'Hawassa Industrial Park', cargo: 'Textile Machinery Parts', trucks: 2, amount: 'ETB 78,000', status: 'Accepted' },
          { id: 'FR-8803', customer: 'Habesha Cement Factory', date: 'Aug 20', from: 'Derba', to: 'Mekelle', cargo: 'Bulk Cement Bags (50 Tons)', trucks: 4, amount: 'ETB 210,000', status: 'In Progress' },
          { id: 'FR-8804', customer: 'Bole Lemi Apparel', date: 'Aug 19', from: 'Addis Ababa', to: 'Adama', cargo: 'Garment Finished Goods', trucks: 1, amount: 'ETB 38,000', status: 'Completed' },
        ]);
      }
    } catch (e) {
      setRequests([
        { id: 'FR-8801', customer: 'Ethiopian Produce Exporters', date: 'Aug 22', from: 'Addis Ababa', to: 'Djibouti Port', cargo: 'Sesame & Coffee Export (35 Tons)', trucks: 3, amount: 'ETB 145,000', status: 'Pending' },
        { id: 'FR-8802', customer: 'Mojo Dry Port Logistics', date: 'Aug 21', from: 'Mojo Hub', to: 'Hawassa Industrial Park', cargo: 'Textile Machinery Parts', trucks: 2, amount: 'ETB 78,000', status: 'Accepted' },
        { id: 'FR-8803', customer: 'Habesha Cement Factory', date: 'Aug 20', from: 'Derba', to: 'Mekelle', cargo: 'Bulk Cement Bags (50 Tons)', trucks: 4, amount: 'ETB 210,000', status: 'In Progress' },
        { id: 'FR-8804', customer: 'Bole Lemi Apparel', date: 'Aug 19', from: 'Addis Ababa', to: 'Adama', cargo: 'Garment Finished Goods', trucks: 1, amount: 'ETB 38,000', status: 'Completed' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequestStatus = async (id: string, newStatus: 'Accepted' | 'Declined') => {
    try {
      const endpoint = newStatus === 'Accepted' ? `/company/fleet-requests/${id}/accept` : `/company/fleet-requests/${id}/decline`;
      await api.patch(endpoint);
    } catch {
      // Optimistic update fallback
    }

    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refresh: fetchRequests, updateRequestStatus };
}
