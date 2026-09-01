import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light'

interface ThemeState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (localStorage.getItem('adld-theme') as ThemeMode) || 'dark',

  setTheme: (newTheme: ThemeMode) => {
    localStorage.setItem('adld-theme', newTheme)
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
    set({ theme: newTheme })
  },

  initTheme: () => {
    const currentTheme = get().theme
    if (currentTheme === 'light') {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
  },
}))
