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

const ProfileRoutes = lazy(() =>
  import('./features/profile').then((m) => ({ default: m.ProfileRoutes }))
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth/*" element={<AuthRoute />} />

        <Route element={<AuthCheck />}>
          <Route index element={<RoleRedirect />} />

          <Route path="/dashboard" element={<MainLayout />}>
            <Route path="*" element={<DashboardRoutes />} />
          </Route>

          <Route path="/analytics/*" element={<MainLayout />}>
            <Route path="*" element={<AnalyticsRoutes />} />
          </Route>

          <Route path="/profile/*" element={<MainLayout />}>
            <Route path="*" element={<ProfileRoutes />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
