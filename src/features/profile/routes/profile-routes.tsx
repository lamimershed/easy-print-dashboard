import { Route, Routes } from 'react-router';
import AccountSettingsPage from '../pages/account-settings-page';

export function ProfileRoutes() {
  return (
    <Routes>
      <Route index element={<AccountSettingsPage />} />
    </Routes>
  );
}
