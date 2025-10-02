"use client";

import { useEffect, useState } from 'react';

export function useAuthSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    userRegistration: true,
    loading: true
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/internal/settings', {
          headers: {
            'x-internal-request': process.env.NEXT_PUBLIC_INTERNAL_SECRET || ''
          }
        });
        const data = await response.json();
        
        setSettings({
          maintenanceMode: data.maintenanceMode === 'true',
          userRegistration: data.userRegistration === 'true',
          loading: false
        });
      } catch (error) {
        console.error('Error fetching auth settings:', error);
        setSettings(prev => ({ ...prev, loading: false }));
      }
    }

    fetchSettings();
  }, []);

  return settings;
}