import { Route, Routes } from 'react-router';
import DashboardPage from '../pages/dashboard-page';

export function DashboardRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
    </Routes>
  );
}
