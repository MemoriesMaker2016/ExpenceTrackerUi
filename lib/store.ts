import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from './types';

interface SettingsStore extends Settings {
  setCurrency: (currency: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setNotifications: (notifications: boolean) => void;
  setProfileName: (name: string) => void;
  setProfileEmail: (email: string) => void;
  resetSettings: () => void;
}

const defaultSettings: Settings = {
  currency: 'INR',
  theme: 'system',
  notifications: true,
  profileName: 'Alex Morgan',
  profileEmail: 'alex@example.com',
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
      setNotifications: (notifications) => set({ notifications }),
      setProfileName: (profileName) => set({ profileName }),
      setProfileEmail: (profileEmail) => set({ profileEmail }),
      resetSettings: () => set(defaultSettings),
    }),
    { name: 'expense-tracker-settings' }
  )
);
