import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/stores/authStore'

export interface LocalAccount {
  id: string
  email: string
  username: string
  displayName: string
  password: string
  avatarUrl: string
  createdAt: string
}

function getLocalAccounts(): LocalAccount[] {
  try {
    const saved = localStorage.getItem('adld_registered_accounts')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveLocalAccounts(accounts: LocalAccount[]) {
  try {
    localStorage.setItem('adld_registered_accounts', JSON.stringify(accounts))
  } catch {}
}

function createMockUser(id: string, email: string, username: string, displayName: string): User {
  return {
    id,
    email,
    app_metadata: { provider: 'email' },
    user_metadata: { username, display_name: displayName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    updated_at: new Date().toISOString(),
  } as User
}

export const authService = {
  /**
   * Register a new user using username, displayName, and password
   */
  async register(username: string, displayName: string, password: string) {
    const cleanUsername = username.toLowerCase().trim()
    const cleanDisplayName = displayName.trim() || cleanUsername

    // 1. Validation
    if (!/^[a-zA-Z0-9_]{3,25}$/.test(cleanUsername)) {
      throw new Error('Nama pengguna harus 3-25 karakter dan hanya boleh berisi huruf, angka, atau garis bawah (_).')
    }

    if (password.length < 6) {
      throw new Error('Kata sandi minimal harus 6 karakter.')
    }

    // 2. Check if username already exists locally
    const existingAccounts = getLocalAccounts()
    if (
      cleanUsername === 'faith' ||
      existingAccounts.some((acc) => acc.username.toLowerCase() === cleanUsername)
    ) {
      throw new Error(`Nama pengguna @${cleanUsername} sudah digunakan. Silakan pilih nama pengguna lain.`)
    }

    const email = `${cleanUsername}@adldchats.app`
    let userId = `usr_${cleanUsername}_${Date.now()}`
    let supabaseUser: User | null = null

    // 3. Attempt Supabase Auth Registration
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: cleanDisplayName,
          },
        },
      })

      if (!error && data?.user) {
        supabaseUser = data.user
        userId = data.user.id

        // Insert into public.profiles table in Supabase
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: cleanUsername,
            display_name: cleanDisplayName,
            avatar_url: '/avatars/male_1_clean.png',
            bio: 'Member baru ADLD Chats 🚀',
            is_online: true,
            last_seen: new Date().toISOString(),
            ghost_mode: false,
            location_sharing_enabled: true,
            language: 'id',
            updated_at: new Date().toISOString(),
          })
        } catch (profErr) {
          console.warn('[ADLD Auth] Supabase profile upsert warning:', profErr)
        }
      }
    } catch {
      console.warn('[ADLD Auth] Supabase signup fallback to local account storage')
    }

    // 4. Save to local accounts registry for offline & instant persistence
    const newAccount: LocalAccount = {
      id: userId,
      email,
      username: cleanUsername,
      displayName: cleanDisplayName,
      password,
      avatarUrl: '/avatars/male_1_clean.png',
      createdAt: new Date().toISOString(),
    }

    existingAccounts.push(newAccount)
    saveLocalAccounts(existingAccounts)

    return {
      user: supabaseUser || createMockUser(userId, email, cleanUsername, cleanDisplayName),
    }
  },

  /**
   * Sign in using username and password
   */
  async login(username: string, password: string) {
    const cleanUsername = username.toLowerCase().trim()
    const email = `${cleanUsername}@adldchats.app`

    // 1. Try Supabase Auth Login first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data?.user) {
        return { user: data.user }
      }
    } catch {
      console.warn('[ADLD Auth] Supabase login fallback to local check')
    }

    // 2. Check Admin account (faith)
    if (cleanUsername === 'faith') {
      const savedAdminPass = localStorage.getItem('adld-user-password') || 'faith123'
      if (password === savedAdminPass) {
        return {
          user: createMockUser('usr_faith_001', 'faith@adldchats.app', 'faith', 'Faith'),
        }
      } else {
        throw new Error('Kata sandi untuk akun @faith salah. Silakan periksa kembali.')
      }
    }

    // 3. Check Local Registered Accounts
    const localAccounts = getLocalAccounts()
    const found = localAccounts.find((acc) => acc.username.toLowerCase() === cleanUsername)

    if (found) {
      if (found.password === password) {
        return {
          user: createMockUser(found.id, found.email, found.username, found.displayName),
        }
      } else {
        throw new Error('Kata sandi yang Anda masukkan salah. Silakan coba lagi.')
      }
    }

    throw new Error(`Akun @${cleanUsername} belum terdaftar. Silakan buat akun baru terlebih dahulu.`)
  },

  /**
   * Change / update password for current user
   */
  async changePassword(newPassword: string) {
    if (newPassword.length < 6) {
      throw new Error('Password baru minimal harus 6 karakter.')
    }

    try {
      await supabase.auth.updateUser({
        password: newPassword,
      })
    } catch {}

    // Update in local accounts registry as well
    localStorage.setItem('adld-user-password', newPassword)

    try {
      const savedUserStr = localStorage.getItem('adld_auth_user')
      if (savedUserStr) {
        const currentUser = JSON.parse(savedUserStr)
        const currentUsername = currentUser?.user_metadata?.username || currentUser?.email?.split('@')[0]
        if (currentUsername) {
          const accounts = getLocalAccounts()
          const updatedAccounts = accounts.map((acc) =>
            acc.username.toLowerCase() === currentUsername.toLowerCase()
              ? { ...acc, password: newPassword }
              : acc
          )
          saveLocalAccounts(updatedAccounts)
        }
      }
    } catch {}

    return { success: true }
  },

  /**
   * Sign out the current user
   */
  async logout() {
    try {
      await supabase.auth.signOut()
    } catch {}
  },

  /**
   * Fetch current user profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) return data as UserProfile
    } catch {}

    // Check local accounts
    const accounts = getLocalAccounts()
    const found = accounts.find((acc) => acc.id === userId || acc.username === userId)
    if (found) {
      return {
        id: found.id,
        username: found.username,
        display_name: found.displayName,
        avatar_url: found.avatarUrl || '/avatars/male_1_clean.png',
        bio: 'Member terdaftar ADLD Chats 🚀',
        is_online: true,
        last_seen: new Date().toISOString(),
        ghost_mode: false,
        location_sharing_enabled: true,
        language: 'id',
        created_at: found.createdAt,
        updated_at: found.createdAt,
      }
    }

    const isFaith = userId.includes('faith')
    return {
      id: userId,
      username: isFaith ? 'faith' : 'pengguna',
      display_name: isFaith ? 'Faith' : 'Pengguna ADLD',
      avatar_url: '/avatars/male_1_clean.png',
      bio: 'Digital explorer | Neon nights | Always online 🌌',
      is_online: true,
      last_seen: new Date().toISOString(),
      ghost_mode: false,
      location_sharing_enabled: true,
      language: 'id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  },

  /**
   * Update profile fields (e.g. bio, ghost mode, language)
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (!error && data) return data as UserProfile
    } catch {}

    // Also update in local accounts
    const accounts = getLocalAccounts()
    const updatedAccounts = accounts.map((acc) =>
      acc.id === userId || acc.username === userId
        ? {
            ...acc,
            displayName: updates.display_name || acc.displayName,
            username: updates.username || acc.username,
            avatarUrl: updates.avatar_url || acc.avatarUrl,
          }
        : acc
    )
    saveLocalAccounts(updatedAccounts)

    return {
      id: userId,
      username: updates.username || 'faith',
      display_name: updates.display_name || 'Faith',
      avatar_url: updates.avatar_url || '/avatars/male_1_clean.png',
      bio: updates.bio || 'Digital explorer 🌌',
      is_online: true,
      last_seen: new Date().toISOString(),
      ghost_mode: updates.ghost_mode ?? false,
      location_sharing_enabled: updates.location_sharing_enabled ?? true,
      language: updates.language || 'id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserProfile
  },
}
