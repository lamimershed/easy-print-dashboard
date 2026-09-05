import { Navigate, Route, Routes } from 'react-router';
import BillingPage from '../pages/billing-page';

export function BillingRoutes() {
  return (
    <Routes>
      <Route index element={<BillingPage />} />
      {/* Plan moved to its own top-level section. Kept so links that predate the
          split — and anything a shop has bookmarked — still land somewhere. */}
      <Route path="plan" element={<Navigate to="/plan" replace />} />
      <Route path=":tab" element={<BillingPage />} />
    </Routes>
  );
}
