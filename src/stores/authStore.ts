import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  loginAsGuest: (guestTag: string, guestId: string) => void
  logout: () => void
}

export interface UserProfile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  is_online: boolean
  last_seen: string | null
  language: string
  ghost_mode: boolean
  location_sharing_enabled: boolean
  created_at: string
  updated_at: string
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isGuest: false }),

  setSession: (session) =>
    set({ session }),

  setProfile: (profile) =>
    set({ profile }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  loginAsGuest: (guestTag: string, guestId: string) => {
    const guestUser = {
      id: guestId,
      app_metadata: {},
      user_metadata: { username: guestTag, display_name: guestTag },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any

    const guestProfile: UserProfile = {
      id: guestId,
      username: guestTag,
      display_name: guestTag,
      avatar_url: '/avatars/male_1_clean.png',
      bio: 'Tamu Pembeli Katalog ADLD',
      is_online: true,
      last_seen: new Date().toISOString(),
      language: 'id',
      ghost_mode: false,
      location_sharing_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    set({
      user: guestUser,
      profile: guestProfile,
      isAuthenticated: true,
      isGuest: true,
    })
  },

  logout: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isGuest: false,
    }),
}))
