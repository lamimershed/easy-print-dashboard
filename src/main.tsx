import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { QueryProvider } from './providers/query-provider.tsx';
import ErrorBoundary from './components/error-boundary.tsx';
import { PageLoader } from './components/page-loader.tsx';
import { Toaster } from 'sonner';

import { BrowserRouter } from 'react-router';
import { ThemeProvider } from './components/theme-provider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_BASE_PATH}>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <QueryProvider>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <App />
              <Toaster position="bottom-right" richColors />
            </Suspense>
          </ErrorBoundary>
        </QueryProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
