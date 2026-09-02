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

const initialUser = (() => {
  try {
    const saved = localStorage.getItem('adld_auth_user')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
})()

const initialProfile = (() => {
  try {
    const saved = localStorage.getItem('adld_auth_profile')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
})()

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  session: null,
  profile: initialProfile,
  isLoading: false,
  isAuthenticated: !!initialUser,
  isGuest: false,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('adld_auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('adld_auth_user')
    }
    set({ user, isAuthenticated: !!user, isGuest: false })
  },

  setSession: (session) =>
    set({ session }),

  setProfile: (profile) => {
    if (profile) {
      localStorage.setItem('adld_auth_profile', JSON.stringify(profile))
    } else {
      localStorage.removeItem('adld_auth_profile')
    }
    set({ profile })
  },

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

    localStorage.setItem('adld_auth_user', JSON.stringify(guestUser))
    localStorage.setItem('adld_auth_profile', JSON.stringify(guestProfile))

    set({
      user: guestUser,
      profile: guestProfile,
      isAuthenticated: true,
      isGuest: true,
    })
  },

  logout: () => {
    localStorage.removeItem('adld_auth_user')
    localStorage.removeItem('adld_auth_profile')
    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isGuest: false,
    })
  },
}))
