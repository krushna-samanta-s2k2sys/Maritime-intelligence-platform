import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Vessels from './pages/Vessels'
import Companies from './pages/Companies'
import Ports from './pages/Ports'
import Movements from './pages/Movements'
import Fixtures from './pages/Fixtures'
import Psc from './pages/Psc'
import Compliance from './pages/Compliance'
import Events from './pages/Events'
import ImoCore from './pages/ImoCore'
import GisAis from './pages/GisAis'
import VesselImages from './pages/VesselImages'
import Etl from './pages/Etl'
import Bigquery from './pages/Bigquery'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vessels" element={<Vessels />} />
        <Route path="vessel-images" element={<VesselImages />} />
        <Route path="companies" element={<Companies />} />
        <Route path="ports" element={<Ports />} />
        <Route path="movements" element={<Movements />} />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="psc" element={<Psc />} />
        <Route path="compliance" element={<Compliance />} />
        <Route path="events" element={<Events />} />
        <Route path="imo-core" element={<ImoCore />} />
        <Route path="gis-ais" element={<GisAis />} />
        <Route path="etl" element={<Etl />} />
        <Route path="bigquery" element={<Bigquery />} />
      </Route>
    </Routes>
  )
}
