import { create } from 'zustand'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

interface LogoutState {
  isConfirmOpen: boolean
  isLoggingOut: boolean
  openConfirm: () => void
  closeConfirm: () => void
  confirmLogout: (navigate: (path: string) => void) => Promise<void>
}

export const useLogoutStore = create<LogoutState>((set) => ({
  isConfirmOpen: false,
  isLoggingOut: false,

  openConfirm: () => set({ isConfirmOpen: true }),
  closeConfirm: () => set({ isConfirmOpen: false }),

  confirmLogout: async (navigate) => {
    // 1. Close modal and start animation
    set({ isConfirmOpen: false, isLoggingOut: true })

    // 2. Play 1.2s smooth logout animation
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // 3. Perform actual signout
    try {
      await authService.logout()
    } catch {}

    useAuthStore.getState().logout()

    // 4. End animation & Navigate to login
    set({ isLoggingOut: false })
    navigate('/login')
  },
}))
