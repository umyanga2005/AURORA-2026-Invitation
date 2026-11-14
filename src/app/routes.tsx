import { Navigate, Route, Routes } from 'react-router-dom';
import { ControlDashboard } from '../components/control/ControlDashboard';
import { DisplayScene } from '../components/display/DisplayScene';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/control" element={<ControlDashboard />} />
      <Route path="/display" element={<DisplayScene />} />
      <Route path="*" element={<Navigate to="/control" replace />} />
    </Routes>
  );
}
