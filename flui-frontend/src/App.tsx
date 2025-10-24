import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useThemeStore } from './store/themeStore'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Agents } from './pages/Agents'
import { MCPs } from './pages/MCPs'
import { Automations } from './pages/Automations'
import { WorkflowEditor } from './pages/WorkflowEditor'
import { Tools } from './pages/Tools'
import { Settings } from './pages/Settings'
import './styles/globals.css'
import './styles/themes.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

function App() {
  const { theme, isDarkMode } = useThemeStore()

  useEffect(() => {
    // Initialize theme
    document.documentElement.classList.add(`theme-${theme}`)
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [theme, isDarkMode])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="agents" element={<Agents />} />
            <Route path="mcps" element={<MCPs />} />
            <Route path="automations" element={<Automations />} />
            <Route path="automations/new" element={<WorkflowEditor />} />
            <Route path="automations/:id/edit" element={<WorkflowEditor />} />
            <Route path="tools" element={<Tools />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  )
}

export default App
