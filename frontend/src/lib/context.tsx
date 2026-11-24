'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Role, Notification } from '@/lib/types';
import { mockNotifications, mockProfiles } from '@/lib/mock-data';
import { authService, tokenStorage } from '@/lib/api';
import type { LoginPayload } from '@/lib/types/api';

export interface AuthUser {
  id: string;
  nama_lengkap: string;
  email: string;
  roles: Role[];
  activeRole: Role;
}

interface AppContextType {
  user: AuthUser;
  setActiveRole: (role: Role) => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isAuthenticated: boolean;
  isLoadingSession: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function useUser() {
  const app = useApp();
  return {
    user: {
      ...app.user,
      name: app.user.nama_lengkap,
    },
    currentRole: app.user.activeRole,
    setActiveRole: app.setActiveRole,
  };
}

export const ROLE_TO_MOCK_PROFILE: Record<Role, { id: string; nama_lengkap: string; email: string }> = {
  KAPRODI: { id: 'u-kaprodi', nama_lengkap: 'Dr. Ahmad Fauzi, M.T.', email: 'kaprodi@univ.ac.id' },
  ADMIN_PRODI: { id: 'u-admin', nama_lengkap: 'Bambang Sudarsono, S.Kom.', email: 'admin.prodi@univ.ac.id' },
  DOSEN: { id: 'u-dosen2', nama_lengkap: 'Dewi Lestari, M.T.', email: 'dewi.lestari@univ.ac.id' },
  DOSEN_WALI: { id: 'u-dosen1', nama_lengkap: 'Dr. Eng. Hendra Wijaya, M.Sc.', email: 'hendra.wijaya@univ.ac.id' },
  DOSEN_VERIFIKATOR: { id: 'u-dosen1', nama_lengkap: 'Dr. Eng. Hendra Wijaya, M.Sc.', email: 'hendra.wijaya@univ.ac.id' },
  DOSEN_PEMBINA: { id: 'u-dosen1', nama_lengkap: 'Dr. Eng. Hendra Wijaya, M.Sc.', email: 'hendra.wijaya@univ.ac.id' },
  DOSEN_PENCATAT_PELANGGARAN: { id: 'u-dosen1', nama_lengkap: 'Dr. Eng. Hendra Wijaya, M.Sc.', email: 'hendra.wijaya@univ.ac.id' },
  DOSEN_PEMBINA_UKM: { id: 'u-dosen1', nama_lengkap: 'Dr. Eng. Hendra Wijaya, M.Sc.', email: 'hendra.wijaya@univ.ac.id' },
  KETUA_KELAS: { id: 'u-mhs1', nama_lengkap: 'Muhammad Rizky Pratama', email: 'rizky.mhs@student.univ.ac.id' },
  MAHASISWA: { id: 'u-mhs1', nama_lengkap: 'Muhammad Rizky Pratama', email: 'rizky.mhs@student.univ.ac.id' },
  PENGURUS_HIMPUNAN: { id: 'u-mhs1', nama_lengkap: 'Muhammad Rizky Pratama', email: 'rizky.mhs@student.univ.ac.id' },
  HIMPUNAN: { id: 'u-mhs1', nama_lengkap: 'Muhammad Rizky Pratama', email: 'rizky.mhs@student.univ.ac.id' },
};

const DEFAULT_FALLBACK_USER: AuthUser = {
  id: 'u-kaprodi',
  nama_lengkap: 'Dr. Ahmad Fauzi, M.T.',
  email: 'kaprodi@univ.ac.id',
  roles: [
    'KAPRODI',
    'ADMIN_PRODI',
    'DOSEN',
    'DOSEN_VERIFIKATOR',
    'DOSEN_WALI',
    'DOSEN_PEMBINA',
    'KETUA_KELAS',
    'MAHASISWA',
    'PENGURUS_HIMPUNAN',
    'HIMPUNAN',
  ],
  activeRole: 'KAPRODI',
};

function sanitizeRoles(roles?: Role[]): Role[] {
  if (!roles || roles.length === 0) return ['MAHASISWA'];
  const unique = Array.from(new Set(roles));
  return unique.length > 0 ? unique : ['MAHASISWA'];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(DEFAULT_FALLBACK_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync session with Golang Backend if token is present
  const refreshSession = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setIsLoadingSession(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.data) {
        const u = res.data;
        const cleanUserRoles = sanitizeRoles(u.roles);
        setUser({
          id: u.id,
          nama_lengkap: u.nama_lengkap,
          email: u.email,
          roles: cleanUserRoles,
          activeRole: u.active_role || cleanUserRoles[0] || 'MAHASISWA',
        });
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkInitialSession() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        if (isMounted) setIsLoadingSession(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (isMounted && res.data) {
          const u = res.data;
          const cleanUserRoles = sanitizeRoles(u.roles);
          setUser({
            id: u.id,
            nama_lengkap: u.nama_lengkap,
            email: u.email,
            roles: cleanUserRoles,
            activeRole: u.active_role || cleanUserRoles[0] || 'MAHASISWA',
          });
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }

    checkInitialSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const setActiveRole = useCallback(async (role: Role) => {
    const profile = ROLE_TO_MOCK_PROFILE[role] || {
      id: 'u-user',
      nama_lengkap: 'Pengguna SIMPRO',
      email: 'user@univ.ac.id',
    };
    setUser(prev => ({
      ...prev,
      id: isAuthenticated ? prev.id : profile.id,
      nama_lengkap: isAuthenticated ? prev.nama_lengkap : profile.nama_lengkap,
      email: isAuthenticated ? prev.email : profile.email,
      activeRole: role,
    }));
    if (isAuthenticated) {
      try {
        await authService.switchRole(role);
      } catch {
        // Fallback local update
      }
    }
  }, [isAuthenticated]);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (res.data?.user) {
      const u = res.data.user;
      const cleanUserRoles = sanitizeRoles(u.roles);
      setUser({
        id: u.id,
        nama_lengkap: u.nama_lengkap,
        email: u.email,
        roles: cleanUserRoles,
        activeRole: u.active_role || cleanUserRoles[0] || 'MAHASISWA',
      });
      setIsAuthenticated(true);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(DEFAULT_FALLBACK_USER);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_dibaca: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.is_dibaca).length;

  return (
    <AppContext.Provider
      value={{
        user,
        setActiveRole,
        notifications,
        unreadCount,
        markAsRead,
        sidebarOpen,
        setSidebarOpen,
        isAuthenticated,
        isLoadingSession,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
