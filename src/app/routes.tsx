import { Navigate, Route, Routes } from 'react-router-dom';
import { ControlDashboard } from '../components/control/ControlDashboard';
import { ControllerAuthGate } from '../components/control/ControllerAuthGate';
import { DisplayScene } from '../components/display/DisplayScene';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/display" element={<DisplayScene />} />
      <Route
        path="/control"
        element={
          <ControllerAuthGate>
            {(onLock) => <ControlDashboard onLock={onLock} />}
          </ControllerAuthGate>
        }
      />
      <Route path="/" element={<Navigate to="/display" replace />} />
      <Route path="*" element={<Navigate to="/display" replace />} />
    </Routes>
  );
}
