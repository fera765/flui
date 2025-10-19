import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateAutomationV2 from './pages/CreateAutomationV2'
import EditAutomation from './pages/EditAutomation'
import AutomationsPage from './pages/AutomationsPage'
import AgentsPage from './pages/AgentsPage'
import MCPsPage from './pages/MCPsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/automations" element={<AutomationsPage />} />
      <Route path="/automations/create" element={<CreateAutomationV2 />} />
      <Route path="/automations/:id/edit" element={<EditAutomation />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/mcps" element={<MCPsPage />} />
    </Routes>
  )
}

export default App
