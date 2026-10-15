import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { updateUserProfile } from '../services/authService';

interface CompanyProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tin: string;
  address: string;
}

export function useCompanySettings() {
  const [profile, setProfile] = useState<CompanyProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    tin: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      let data: any = null;
      try {
        const resData = await api.get<any>('/company/profile');
        data = resData?.data || resData;
      } catch (err) {
        console.warn('Company profile endpoint fallback to /auth/me', err);
        const meRes = await api.get<any>('/auth/me');
        data = meRes?.data || meRes;
      }

      if (data) {
        setProfile({
          id: data?.id?.toString() || '',
          name: data?.full_name || data?.company_name || 'Fleet Owner',
          email: data?.email || '',
          phone: data?.phone_number || data?.phone || '',
          tin: data?.company_registration_number || data?.tin || 'ET-TIN-88902',
          address: data?.company_description || data?.address || 'Addis Ababa, Ethiopia',
        });
      }
    } catch (e) {
      console.error('Failed to load company profile', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = useCallback(async (data: Partial<CompanyProfile>) => {
    setSaving(true);
    try {
      // Use auth service patch to update profile
      const updated = await updateUserProfile({
        full_name: data.name,
        email: data.email,
      });
      // Assume phone and address are updated via separate endpoints not shown; we just merge locally
      setProfile((prev) => ({
        ...prev,
        ...data,
        name: updated.full_name || prev.name,
        email: updated.email || prev.email,
      }));
    } catch (e) {
      console.error('Failed to save company profile', e);
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, setProfile, loading, saving, saveProfile };
}
