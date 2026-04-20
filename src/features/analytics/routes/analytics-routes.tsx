import { Route, Routes } from 'react-router';
import AnalyticsPage from '../pages/analytics-page';

export function AnalyticsRoutes() {
  return (
    <Routes>
      <Route index element={<AnalyticsPage />} />
    </Routes>
  );
}
