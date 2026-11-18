'use client';

import { useCallback, useEffect, useState } from 'react';
import { rkaService, tripService } from '@/lib/api';
import { mockBusinessTrips, mockRkaDocuments, mockRkaRealizations } from '@/lib/mock-data';
import { enrichRkaDocument } from '@/lib/rka-utils';
import { STORAGE_KEYS, storageSync } from '@/lib/storage-sync';
import type { BusinessTrip, RkaDocument, RkaRealization } from '@/lib/types';

/**
 * Hook sinkronisasi data perjalanan dinas & dokumen RKA dari tripService + rkaService + storageSync.
 */
export function useBusinessTrips() {
  const [trips, setTrips] = useState<BusinessTrip[]>(mockBusinessTrips);
  const [rkaDocs, setRkaDocs] = useState<RkaDocument[]>(mockRkaDocuments);
  const [isLoading, setIsLoading] = useState(true);

  const syncLocal = useCallback(() => {
    const localTrips = storageSync.get<BusinessTrip[]>(STORAGE_KEYS.TRIPS, mockBusinessTrips);
    const localDocs = storageSync.get<RkaDocument[]>(STORAGE_KEYS.RKA_DOCUMENTS, mockRkaDocuments);
    const localReals = storageSync.get<RkaRealization[]>(
      STORAGE_KEYS.RKA_REALIZATIONS,
      mockRkaRealizations
    );
    setTrips(localTrips);
    setRkaDocs(localDocs.map((d) => enrichRkaDocument(d, localReals, localTrips)));
  }, []);

  const reload = useCallback(async () => {
    try {
      const [tripRes, rkaRes] = await Promise.all([
        tripService.getTrips(),
        rkaService.getRkaList(),
      ]);
      if (tripRes.data && Array.isArray(tripRes.data)) {
        setTrips(tripRes.data);
      }
      if (rkaRes.data && Array.isArray(rkaRes.data)) {
        setRkaDocs(rkaRes.data);
      }
    } finally {
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
