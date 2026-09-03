import { Route, Routes } from 'react-router';
import PricingPage from '../pages/pricing-page';

export function PricingRoutes() {
  return (
    <Routes>
      <Route index element={<PricingPage />} />
    </Routes>
  );
}
