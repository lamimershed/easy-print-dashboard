import { Route, Routes } from 'react-router';
import { PlanPage } from '../pages';

export function PlanRoutes() {
  return (
    <Routes>
      <Route index element={<PlanPage />} />
    </Routes>
  );
}
