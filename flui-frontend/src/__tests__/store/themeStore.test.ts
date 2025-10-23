import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '@/store/themeStore'

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      theme: 'dark',
      isDarkMode: false,
    })
  })

  it('has default theme', () => {
    const state = useThemeStore.getState()
    expect(state.theme).toBe('dark')
  })

  it('can change theme', () => {
    const { setTheme } = useThemeStore.getState()
    setTheme('ocean')
    
    const state = useThemeStore.getState()
    expect(state.theme).toBe('ocean')
  })

  it('can toggle dark mode', () => {
    const { toggleDarkMode } = useThemeStore.getState()
    
    const initialState = useThemeStore.getState().isDarkMode
    toggleDarkMode()
    
    const newState = useThemeStore.getState().isDarkMode
    expect(newState).not.toBe(initialState)
  })
})
