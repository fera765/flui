import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'ocean' | 'sunset'

interface ThemeState {
  theme: Theme
  isDarkMode: boolean
  setTheme: (theme: Theme) => void
  toggleDarkMode: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      isDarkMode: false,
      
      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.remove('theme-dark', 'theme-ocean', 'theme-sunset')
        document.documentElement.classList.add(`theme-${theme}`)
      },
      
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.isDarkMode
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          return { isDarkMode: newDarkMode }
        })
      },
    }),
    {
      name: 'flui-theme',
    }
  )
)
