import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { YearProvider } from './contexts/YearContext';
import { ProtectedRoute, SwipeableLayout } from './components';
import {
  Login,
  Signup,
  Dashboard,
  MonthlyPage,
  CreditCard,
  Investments,
  Tithe,
  Report,
  Charts,
  Tools,
  SalaryCalculator,
  FAQ,
  Privacy,
  DeleteAccount,
  AIReports,
  YearlyReport
} from './pages';
import './styles/style.css';

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
                <Privacy />
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
                  <MonthlyPage />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/credit-card" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <CreditCard />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Investments />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/tithe" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Tithe />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Report />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/charts" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Charts />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <Tools />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/salary" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <SalaryCalculator />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/yearly-report" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <YearlyReport />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/faq" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <FAQ />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/delete-account" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <DeleteAccount />
                </SwipeableLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-reports" element={
              <ProtectedRoute>
                <SwipeableLayout>
                  <AIReports />
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
