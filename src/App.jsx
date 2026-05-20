import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NewModel from './pages/NewModel.jsx'
import ModelDetail from './pages/ModelDetail.jsx'
import AutoBatch from './pages/AutoBatch.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewModel />} />
          <Route path="model/:id" element={<ModelDetail />} />
          <Route path="auto" element={<AutoBatch />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
