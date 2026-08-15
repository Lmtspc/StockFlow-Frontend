import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Actor, ActorPermissions } from './types';

interface AuthState {
  token: string | null;
  user: User | null;
  actor: Actor | null;
  activeWarehouseId: string | null;
  setAuth: (token: string, user: User, actor: Actor) => void;
  setActiveWarehouseId: (warehouseId: string | null) => void;
  logout: () => void;
  hasPermission: (perm: keyof ActorPermissions) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      actor: null,
      activeWarehouseId: null,
      setAuth: (token, user, actor) => {
        const warehouseIds = Object.keys(actor?.warehouse_ids || {});
        const defaultWh = warehouseIds.length > 0 ? warehouseIds[0] : null;
        set({
          token,
          user,
          actor,
          activeWarehouseId: defaultWh,
        });
      },
      setActiveWarehouseId: (warehouseId) => set({ activeWarehouseId: warehouseId }),
      logout: () => set({ token: null, user: null, actor: null, activeWarehouseId: null }),
      hasPermission: (perm) => {
        const state = get();
        if (!state.actor || !state.actor.permissions) return true; // Default fallback to allow operation if not strictly constrained
        return !!state.actor.permissions[perm];
      },
    }),
    {
      name: 'stockflow-auth-storage',
    }
  )
);
