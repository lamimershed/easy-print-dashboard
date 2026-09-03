import { Route, Routes } from 'react-router';
import { lazy, Suspense } from 'react';
import MainLayout from './components/layouts/main-layout';
import AuthCheck from './components/layouts/session-check';
import { PageLoader } from './components';
import NotFoundPage from './components/layouts/not-found';
import RoleRedirect from './components/layouts/role-redirect';

const AuthRoute = lazy(() => import('./features/auth').then((m) => ({ default: m.AuthRoute })));

const DashboardRoutes = lazy(() =>
  import('./features/dashboard').then((m) => ({ default: m.DashboardRoutes }))
);

const AnalyticsRoutes = lazy(() =>
  import('./features/analytics').then((m) => ({ default: m.AnalyticsRoutes }))
);

const BillingRoutes = lazy(() =>
  import('./features/billing').then((m) => ({ default: m.BillingRoutes }))
);

const PricingRoutes = lazy(() =>
  import('./features/pricing').then((m) => ({ default: m.PricingRoutes }))
);

const ProfileRoutes = lazy(() =>
  import('./features/profile').then((m) => ({ default: m.ProfileRoutes }))
);

const PrinterTestPage = lazy(() =>
  import('./features/print-monitor').then((m) => ({ default: m.PrinterTestPage }))
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth/*" element={<AuthRoute />} />

        <Route element={<AuthCheck />}>
          <Route index element={<RoleRedirect />} />

          <Route path="/dashboard/*" element={<MainLayout />}>
            <Route path="*" element={<DashboardRoutes />} />
          </Route>

          <Route path="/analytics/*" element={<MainLayout />}>
            <Route path="*" element={<AnalyticsRoutes />} />
          </Route>

          <Route path="/pricing/*" element={<MainLayout />}>
            <Route path="*" element={<PricingRoutes />} />
          </Route>

          <Route path="/billing/*" element={<MainLayout />}>
            <Route path="*" element={<BillingRoutes />} />
          </Route>

          <Route path="/profile/*" element={<MainLayout />}>
            <Route path="*" element={<ProfileRoutes />} />
          </Route>

          <Route path="/printer-test" element={<MainLayout />}>
            <Route index element={<PrinterTestPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
