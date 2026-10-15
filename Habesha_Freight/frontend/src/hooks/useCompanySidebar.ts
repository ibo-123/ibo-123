import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';



function useCompanySidebar() {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // company profile
      const profile = await api.get<any>('/auth/me');
      setCompanyName(profile?.full_name || '');
      setEmail(profile?.email || '');
      setPhone(profile?.phone_number || '');
      setAddress(profile?.address || '');

      // vehicles count
      const vehRes = await api.get<any>('/vehicles');
      const vehList = Array.isArray(vehRes) ? vehRes : vehRes?.vehicles || [];
      setTotalVehicles(vehList.length);

      // pending fleet requests count
      const loadsRes = await api.get<any>('/loads');
      const loadList = Array.isArray(loadsRes) ? loadsRes : loadsRes?.loads || [];
      const pending = loadList.filter((l: any) => {
        const status = l.status;
        return status !== 'ASSIGNED' && status !== 'IN_TRANSIT' && status !== 'COMPLETED';
      }).length;
      setPendingRequests(pending);
    } catch (e) {
      console.error('Sidebar data fetch error', e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { companyName, email, phone, address, totalVehicles, pendingRequests };
}

export default useCompanySidebar;
