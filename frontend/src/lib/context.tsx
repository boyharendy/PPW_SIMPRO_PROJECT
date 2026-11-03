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

const DEFAULT_FALLBACK_USER: AuthUser = {
  id: 'u-kaprodi',
  nama_lengkap: mockProfiles[0]?.nama_lengkap || 'Dr. Ahmad Fauzi, M.T. (Kaprodi)',
  email: mockProfiles[0]?.email || 'kaprodi@univ.ac.id',
  roles: [
    'KAPRODI',
    'GKM',
    'ADMIN_PRODI',
    'DOSEN',
    'DOSEN_WALI',
    'DOSEN_PEMBINA',
    'DOSEN_VERIFIKATOR',
    'KETUA_KELAS',
    'PENGURUS_HIMPUNAN',
    'HIMPUNAN',
    'KOORDINATOR_KP',
    'KOORDINATOR_PSI',
    'PENGELOLA_ADUAN',
    'PETUGAS_KEKERASAN',
    'MAHASISWA',
  ],
  activeRole: 'KAPRODI',
};

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
        setUser({
          id: u.id,
          nama_lengkap: u.nama_lengkap,
          email: u.email,
          roles: u.roles || ['MAHASISWA'],
          activeRole: u.active_role || u.roles?.[0] || 'MAHASISWA',
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
          setUser({
            id: u.id,
            nama_lengkap: u.nama_lengkap,
            email: u.email,
            roles: u.roles || ['MAHASISWA'],
            activeRole: u.active_role || u.roles?.[0] || 'MAHASISWA',
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
    setUser(prev => ({ ...prev, activeRole: role }));
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
      setUser({
        id: u.id,
        nama_lengkap: u.nama_lengkap,
        email: u.email,
        roles: u.roles || ['MAHASISWA'],
        activeRole: u.active_role || u.roles?.[0] || 'MAHASISWA',
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
