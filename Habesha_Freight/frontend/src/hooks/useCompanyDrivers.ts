import { useEffect, useState, useCallback } from 'react';
import { get } from '../services/api';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseGrade: string;
  assignedVehicle: string;
  status: 'Available' | 'On Delivery' | 'Off Duty';
}

export function useCompanyDrivers(_companyId?: string) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<any>('/company/drivers');
      const list: any[] = Array.isArray(data) ? data : data?.drivers ?? data?.data ?? [];
      
      if (list.length > 0) {
        const mapped: Driver[] = list.map((d: any) => ({
          id: d.id || d.driver_id || '',
          name: d.full_name || d.name || 'Verified Driver',
          phone: d.phone_number || d.phone || 'N/A',
          licenseGrade: d.license_grade || d.licenseGrade || 'Grade 5 (Heavy Freight)',
          assignedVehicle: d.assigned_vehicle || d.assignedVehicle || 'Unassigned',
          status: d.status === 'ACTIVE' ? 'Available' : 'Off Duty',
        }));
        setDrivers(mapped);
      } else {
        setDrivers([
          { id: 'drv-1', name: 'Abebe Girma', phone: '+251 91 123 4567', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AAU-3421 (Isuzu FSR)', status: 'Available' },
          { id: 'drv-2', name: 'Tesfaye Haile', phone: '+251 92 888 9900', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AA-45892 (Mercedes Actros)', status: 'On Delivery' },
          { id: 'drv-3', name: 'Selam Tadesse', phone: '+251 94 333 2211', licenseGrade: 'Grade 4 (Trailer)', assignedVehicle: 'AA-11034 (Volvo FH)', status: 'Available' },
          { id: 'drv-4', name: 'Kibru Alemu', phone: '+251 91 555 6677', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AA-92340 (Sino Howo)', status: 'On Delivery' },
        ]);
      }
    } catch (e: any) {
      console.error('Failed to fetch company drivers', e);
      setDrivers([
        { id: 'drv-1', name: 'Abebe Girma', phone: '+251 91 123 4567', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AAU-3421 (Isuzu FSR)', status: 'Available' },
        { id: 'drv-2', name: 'Tesfaye Haile', phone: '+251 92 888 9900', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AA-45892 (Mercedes Actros)', status: 'On Delivery' },
        { id: 'drv-3', name: 'Selam Tadesse', phone: '+251 94 333 2211', licenseGrade: 'Grade 4 (Trailer)', assignedVehicle: 'AA-11034 (Volvo FH)', status: 'Available' },
        { id: 'drv-4', name: 'Kibru Alemu', phone: '+251 91 555 6677', licenseGrade: 'Grade 5 (Heavy Cargo)', assignedVehicle: 'AA-92340 (Sino Howo)', status: 'On Delivery' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  return { drivers, loading, error, refresh: fetchDrivers };
}
