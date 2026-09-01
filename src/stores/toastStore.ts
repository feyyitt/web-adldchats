import { create } from 'zustand'

export interface ToastMessage {
  id: string
  title: string
  type: 'success' | 'info' | 'warning'
}

interface ToastState {
  toasts: ToastMessage[]
  showToast: (title: string, type?: 'success' | 'info' | 'warning') => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (title, type = 'success') => {
    const id = `toast_${Date.now()}`
    const newToast: ToastMessage = { id, title, type }
    set((state) => ({ toasts: [...state.toasts, newToast] }))

    // Auto remove after 3.5 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
