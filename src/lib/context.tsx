'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Role, Notification } from '@/lib/types';
import { mockNotifications, mockProfiles } from '@/lib/mock-data';

interface AuthUser {
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
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Demo: kaprodi user with multiple roles to test the UI
  const [user, setUser] = useState<AuthUser>({
    id: 'u1',
    nama_lengkap: mockProfiles[0].nama_lengkap,
    email: mockProfiles[0].email,
    roles: ['KAPRODI', 'GKM', 'KOORD_KP', 'KOORD_TA', 'KOORD_MAGANG', 'DOSEN', 'MAHASISWA', 'HIMPUNAN'],
    activeRole: 'KAPRODI',
  });

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const setActiveRole = useCallback((role: Role) => {
    setUser(prev => ({ ...prev, activeRole: role }));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_dibaca: true } : n))
    );
  }, []);

  const unreadCount = notifications.filter(n => !n.is_dibaca).length;

  return (
    <AppContext.Provider
      value={{ user, setActiveRole, notifications, unreadCount, markAsRead, sidebarOpen, setSidebarOpen }}
    >
      {children}
    </AppContext.Provider>
  );
}
