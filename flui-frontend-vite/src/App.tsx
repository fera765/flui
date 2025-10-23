import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateAutomationV2 from './pages/CreateAutomationV2'
import EditAutomation from './pages/EditAutomation'
import AutomationsPage from './pages/AutomationsPage'
import AgentsPage from './pages/AgentsPage'
import EditAgent from './pages/EditAgent'
import AgentChat from './pages/AgentChat'
import MCPsPage from './pages/MCPsPage'
import EditMCP from './pages/EditMCP'
import LogsPage from './pages/LogsPage'
import ToolsPage from './pages/ToolsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/automations" element={<AutomationsPage />} />
      <Route path="/automations/create" element={<CreateAutomationV2 />} />
      <Route path="/automations/:id/edit" element={<EditAutomation />} />
      <Route path="/automations/:executionId/logs" element={<LogsPage />} />
      <Route path="/agents" element={<AgentsPage />} />
      <Route path="/agents/:id/edit" element={<EditAgent />} />
      <Route path="/agents/:id/chat" element={<AgentChat />} />
      <Route path="/mcps" element={<MCPsPage />} />
      <Route path="/mcps/:id/edit" element={<EditMCP />} />
      <Route path="/tools" element={<ToolsPage />} />
    </Routes>
  )
}

export default App
