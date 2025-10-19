import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateAutomation from './pages/CreateAutomation'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/automations/create" element={<CreateAutomation />} />
    </Routes>
  )
}

export default App
