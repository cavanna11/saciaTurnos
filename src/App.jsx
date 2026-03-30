import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';

// Client Pages
import BookingPage from './pages/client/BookingPage';
import ConfirmationPage from './pages/client/ConfirmationPage';
import MyAppointments from './pages/client/MyAppointments';
import LoginPage from './pages/client/LoginPage';
import RegisterPage from './pages/client/RegisterPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProfessionalsPage from './pages/admin/ProfessionalsPage';
import ServicesPage from './pages/admin/ServicesPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import SettingsPage from './pages/admin/SettingsPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={adminOnly ? '/admin/login' : '/login'} replace />;
  }

  if (adminOnly && user?.role !== 'admin' && user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ClientLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<ClientLayout><BookingPage /></ClientLayout>} />
        <Route path="/confirmacion" element={<ClientLayout><ConfirmationPage /></ClientLayout>} />
        <Route path="/login" element={<ClientLayout><LoginPage /></ClientLayout>} />
        <Route path="/registro" element={<ClientLayout><RegisterPage /></ClientLayout>} />
        <Route path="/mis-citas" element={
          <ProtectedRoute>
            <ClientLayout><MyAppointments /></ClientLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="profesionales" element={<ProfessionalsPage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="citas" element={<AppointmentsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
