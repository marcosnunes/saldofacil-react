import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { YearProvider } from './contexts/YearContext';
import { ProtectedRoute, SwipeableLayout } from './components';
import {
  Login,
  Signup,
  Dashboard,
} from './pages';
// Lazy load heavy pages
const MonthlyPage = lazy(() => import('./pages/MonthlyPage'));
const CreditCard = lazy(() => import('./pages/CreditCard'));
const Investments = lazy(() => import('./pages/Investments'));
const Tithe = lazy(() => import('./pages/Tithe'));
const Report = lazy(() => import('./pages/Report'));
const Charts = lazy(() => import('./pages/Charts'));
const Tools = lazy(() => import('./pages/Tools'));
const SalaryCalculator = lazy(() => import('./pages/SalaryCalculator'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Privacy = lazy(() => import('./pages/Privacy'));
const DeleteAccount = lazy(() => import('./pages/DeleteAccount'));
const AIReports = lazy(() => import('./pages/AIReports'));
const YearlyReport = lazy(() => import('./pages/YearlyReport'));

import './styles/style.css';

// Loading fallback component
function LoadingFallback() {
  return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Carregando...</div>;
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <YearProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/privacy" element={
              <SwipeableLayout>
                <Suspense fallback={<LoadingFallback />}>
                  <Privacy />
                </Suspense>
              </SwipeableLayout>
            } />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/month/:monthId" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <MonthlyPage />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/credit-card" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <CreditCard />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Investments />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/tithe" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Tithe />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Report />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/charts" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Charts />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Tools />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/salary" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <SalaryCalculator />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/yearly-report" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <YearlyReport />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/faq" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <FAQ />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/delete-account" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <DeleteAccount />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-reports" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <AIReports />
                  </Suspense>
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </YearProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App
