// ============================================================
// SIMPRO — Storage Sync & Resilient Local Persistence
// Menjaga data tetap tersimpan saat direfresh (F5) baik saat online (Go Backend/Supabase)
// maupun saat backend offline / mode dev.
// ============================================================

export const STORAGE_KEYS = {
  SURVEYS: 'simpro_surveys',
  SURVEY_INVITATIONS: 'simpro_survey_invitations',
  PUBLICATIONS: 'simpro_publications',
  TRIPS: 'simpro_trips',
  RKA_DOCUMENTS: 'simpro_rka_documents',
  RKA_REALIZATIONS: 'simpro_rka_realizations',
  RPS_SUBMISSIONS: 'simpro_rps_submissions',
  EVALUATIONS: 'simpro_evaluations',
  COMPLAINTS: 'simpro_complaints',
} as const;

export const storageSync = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan ke localStorage:', e);
    }
  },

  prepend<T extends { id?: string }>(key: string, item: T, defaultList: T[] = []): T[] {
    const list = this.get<T[]>(key, defaultList);
    // Hindari duplikasi ID
    const filtered = item.id ? list.filter((i) => i.id !== item.id) : list;
    const updated = [item, ...filtered];
    this.set(key, updated);
    return updated;
  },

  update<T extends { id?: string }>(key: string, id: string, patch: Partial<T>, defaultList: T[] = []): T[] {
    const list = this.get<T[]>(key, defaultList);
    const updated = list.map((item) => (item.id === id ? { ...item, ...patch } : item));
    this.set(key, updated);
    return updated;
  },

  remove<T extends { id?: string }>(key: string, id: string, defaultList: T[] = []): T[] {
    const list = this.get<T[]>(key, defaultList);
    const updated = list.filter((item) => item.id !== id);
    this.set(key, updated);
    return updated;
  },
};

