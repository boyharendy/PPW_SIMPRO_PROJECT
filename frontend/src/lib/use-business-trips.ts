'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { tripService } from '@/lib/api/services/trip.service';
import { useUser } from '@/lib/context';
import type { BusinessTrip, RkaDocument } from '@/lib/types';

export function useBusinessTrips(tripId?: string | null) {
  const { currentRole } = useUser();
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [rkaDocs, setRkaDocs] = useState<RkaDocument[]>([]);
  const [isLoading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const fetchTrips = tripId
      ? tripService.getTripById(tripId).then(res => [res.data])
      : tripService.getTrips().then(res => res.data);
    const fetchBudgets = currentRole === 'ADMIN_PRODI' || currentRole === 'KAPRODI'
      ? apiClient.get<RkaDocument[]>('/rka').then(res => res.data ?? [])
      : Promise.resolve([]);
    const [tripResult, budgets] = await Promise.allSettled([fetchTrips, fetchBudgets]);
    setTrips(tripResult.status === 'fulfilled' ? tripResult.value : []);
    setRkaDocs(budgets.status === 'fulfilled' ? budgets.value : []);
    setLoading(false);
  }, [tripId, currentRole]);
  useEffect(() => { void reload(); }, [reload]);
  return { trips, setTrips, rkaDocs, isLoading, reload };
}
