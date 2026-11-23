'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { CANONICAL_ROLES, type Role, type Notification } from '@/lib/types';
import { isLocalDevPreview } from '@/lib/dev-preview';
import { authService, tokenStorage } from '@/lib/api';
import type { LoginPayload } from '@/lib/types/api';

export interface AuthUser {
  id: string;
  nama_lengkap: string;
  email: string;
  roles: Role[];
  activeRole: Role;
  penanganan_kekerasan?: boolean; // PRDnew FR-50: penunjukan PGL-K pada Pengelola Aduan
}

interface AppContextType {
  user: AuthUser;
  setActiveRole: (role: Role) => void;
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (v: boolean) => void;
  isAuthenticated: boolean;
  isDevPreview: boolean;
  isLoadingSession: boolean;
  login: (payload: LoginPayload, options?: Pick<RequestInit, 'redirect'>) => Promise<void>;
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

const SIGNED_OUT_USER: AuthUser = { id: '', nama_lengkap: '', email: '', roles: [], activeRole: 'MAHASISWA' };
const PREVIEW_ROLE_KEY = 'simpro_dev_preview_role';

function sanitizeRoles(roles?: Role[]): Role[] {
  if (!roles || roles.length === 0) return ['MAHASISWA'];
  const unique = Array.from(new Set(roles));
  return unique.length > 0 ? unique : ['MAHASISWA'];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(SIGNED_OUT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDevPreview, setIsDevPreview] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
          penanganan_kekerasan: u.penanganan_kekerasan,
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
      if (isLocalDevPreview()) {
        const savedRole = sessionStorage.getItem(PREVIEW_ROLE_KEY);
        setUser({
          id: 'u-kaprodi',
          nama_lengkap: 'Kaprodi Demo',
          email: 'kaprodi@example.test',
          roles: [...CANONICAL_ROLES],
          activeRole: CANONICAL_ROLES.find(role => role === savedRole) ?? 'KAPRODI',
        });
        setIsDevPreview(true);
        setIsLoadingSession(false);
        return;
      }
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
          penanganan_kekerasan: u.penanganan_kekerasan,
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
    if (user.roles && !user.roles.includes(role)) {
      console.warn(`Peran ${role} tidak dimiliki oleh pengguna ini.`);
      return;
    }

    if (isDevPreview) {
      sessionStorage.setItem(PREVIEW_ROLE_KEY, role);
      setUser(prev => ({ ...prev, activeRole: role }));
      return;
    }
    if (isAuthenticated) {
      try {
        const res = await authService.switchRole(role);
        if (res.data?.user) {
          setUser(prev => ({
            ...prev,
            activeRole: res.data.user.active_role,
            penanganan_kekerasan: res.data.user.penanganan_kekerasan,
          }));
          return;
        }
      } catch (err) {
        console.error('Gagal mengganti peran di server', err);
        return; // Jangan bypass secara lokal jika server menolak
      }
    }


  }, [isAuthenticated, isDevPreview, user.roles]);

  const login = useCallback(async (payload: LoginPayload, options?: Pick<RequestInit, 'redirect'>) => {
    const res = await authService.login(payload, options);
    if (res.data?.user && res.data.tokens?.access_token) {
      const u = res.data.user;
      const cleanUserRoles = sanitizeRoles(u.roles);
      setUser({
        id: u.id,
        nama_lengkap: u.nama_lengkap,
        email: u.email,
        roles: cleanUserRoles,
          penanganan_kekerasan: u.penanganan_kekerasan,
        activeRole: u.active_role || cleanUserRoles[0] || 'MAHASISWA',
      });
      setIsAuthenticated(true);
      return;
    }
    throw new Error('API tidak mengembalikan sesi login yang valid.');
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(SIGNED_OUT_USER);
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
        mobileSidebarOpen,
        setMobileSidebarOpen,
        isAuthenticated,
        isDevPreview,
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
