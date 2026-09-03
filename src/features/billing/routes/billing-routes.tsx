import { Route, Routes } from 'react-router';
import BillingPage from '../pages/billing-page';

export function BillingRoutes() {
  return (
    <Routes>
      <Route index element={<BillingPage />} />
      <Route path=":tab" element={<BillingPage />} />
    </Routes>
  );
}
