'use client';

import { useCallback, useEffect, useState } from 'react';
import { tripService } from '@/lib/api';
import { mockBusinessTrips, mockRkaDocuments } from '@/lib/mock-data';
import { STORAGE_KEYS, storageSync } from '@/lib/storage-sync';
import type { BusinessTrip, RkaDocument } from '@/lib/types';

/**
 * Hook sinkronisasi data perjalanan dinas & dokumen RKA dari tripService + storageSync.
 */
export function useBusinessTrips() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [rkaDocs, setRkaDocs] = useState<RkaDocument[]>(mockRkaDocuments);
  const [isLoading, setIsLoading] = useState(true);

  const syncLocal = useCallback(() => {
    setTrips(storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips));
    setRkaDocs(storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments));
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await tripService.getTrips();
      if (res.data && Array.isArray(res.data)) {
        setTrips(res.data);
      }
    } finally {
      setRkaDocs(storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments));
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleStorageChange = () => syncLocal();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('simpro_storage_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('simpro_storage_change', handleStorageChange);
    };
  }, [syncLocal]);

  return { trips, setTrips, rkaDocs, isLoading, reload };
}
