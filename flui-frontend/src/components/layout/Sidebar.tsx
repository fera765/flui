import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import {
  LayoutDashboard,
  Bot,
  Puzzle,
  Workflow,
  Settings,
  Zap,
  ListChecks,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'MCPs', href: '/mcps', icon: Puzzle },
  { name: 'Automations', href: '/automations', icon: Workflow },
  { name: 'Tools', href: '/tools', icon: Zap },
  { name: 'Executions', href: '/executions', icon: ListChecks },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useUIStore()
  
  return (
    <>
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50",
        "flex flex-col w-64 border-r border-border bg-card",
        "transition-transform duration-300 ease-in-out",
        "lg:translate-x-0", // Always visible on large screens
        isSidebarOpen ? "translate-x-0" : "-translate-x-full" // Toggle on mobile
      )}>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 px-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Workflow className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Flui</span>
            </div>
          </div>
          
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Close sidebar on mobile after clicking a link
                  if (window.innerWidth < 1024) {
                    closeSidebar()
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
