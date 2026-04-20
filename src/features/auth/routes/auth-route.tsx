import { Route, Routes } from 'react-router';
import LoginPage from '../pages/login-page';
import RegisterPage from '../pages/register-page';

export function AuthRoute() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
