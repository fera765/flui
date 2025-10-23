import { Menu, Sun, Moon, Palette } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

export function Header() {
  const { theme, isDarkMode, setTheme, toggleDarkMode } = useThemeStore()

  const themes = [
    { id: 'dark', name: 'Dark', color: 'bg-purple-500' },
    { id: 'ocean', name: 'Ocean', color: 'bg-cyan-500' },
    { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
  ] as const

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {/* Mobile menu button */}
        <button className="lg:hidden p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo (mobile) */}
        <div className="flex lg:hidden items-center gap-2 ml-2">
          <span className="text-lg font-bold text-foreground">Flui</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme controls */}
        <div className="flex items-center gap-2">
          {/* Theme selector */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as any)}
                className={cn(
                  'p-2 rounded-md transition-colors relative',
                  theme === t.id
                    ? 'bg-background'
                    : 'hover:bg-background/50'
                )}
                title={t.name}
              >
                <div className={cn('w-4 h-4 rounded-full', t.color)} />
                {theme === t.id && (
                  <div className="absolute inset-0 rounded-md ring-2 ring-primary ring-offset-1 ring-offset-background" />
                )}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
