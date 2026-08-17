import { Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AnalysisResultPage from './pages/AnalysisResultPage'
import DashboardPage from './pages/DashboardPage'
import NewApplicationPage from './pages/NewApplicationPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/applications/new" element={<NewApplicationPage />} />
        <Route path="/applications/:id" element={<AnalysisResultPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
