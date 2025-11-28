import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { YearProvider } from './contexts/YearContext';
import { ProtectedRoute } from './components';
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
  DeleteAccount
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
            <Route path="/privacy" element={<Privacy />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/month/:monthId" element={
              <ProtectedRoute>
                <MonthlyPage />
              </ProtectedRoute>
            } />
            <Route path="/credit-card" element={
              <ProtectedRoute>
                <CreditCard />
              </ProtectedRoute>
            } />
            <Route path="/investments" element={
              <ProtectedRoute>
                <Investments />
              </ProtectedRoute>
            } />
            <Route path="/tithe" element={
              <ProtectedRoute>
                <Tithe />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <Report />
              </ProtectedRoute>
            } />
            <Route path="/charts" element={
              <ProtectedRoute>
                <Charts />
              </ProtectedRoute>
            } />
            <Route path="/tools" element={
              <ProtectedRoute>
                <Tools />
              </ProtectedRoute>
            } />
            <Route path="/salary" element={
              <ProtectedRoute>
                <SalaryCalculator />
              </ProtectedRoute>
            } />
            <Route path="/faq" element={
              <ProtectedRoute>
                <FAQ />
              </ProtectedRoute>
            } />
            <Route path="/delete-account" element={
              <ProtectedRoute>
                <DeleteAccount />
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
