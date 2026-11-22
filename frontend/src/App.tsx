import { Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import CropMonitoring from './pages/CropMonitoring';
import Dashboard from './pages/Dashboard';
import Fields from './pages/Fields';
import More from './pages/More';
import NotFound from './pages/NotFound';
import Recommendations from './pages/Recommendations';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SoilAnalysis from './pages/SoilAnalysis';
import Weather from './pages/Weather';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="fields" element={<Fields />} />
        <Route path="soil" element={<SoilAnalysis />} />
        <Route path="crops" element={<CropMonitoring />} />
        <Route path="weather" element={<Weather />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="more" element={<More />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
