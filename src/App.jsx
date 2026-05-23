import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

// Client Pages
import BookingPage from './pages/client/BookingPage';
import ConfirmationPage from './pages/client/ConfirmationPage';
import MyAppointments from './pages/client/MyAppointments';
import LoginPage from './pages/client/LoginPage';

// Admin Pages
import DashboardPage from './pages/admin/DashboardPage';
import ProfessionalsPage from './pages/admin/ProfessionalsPage';
import ServicesPage from './pages/admin/ServicesPage';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminsPage from './pages/admin/AdminsPage';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';

// Redirige a /login si no está autenticado.
// adminOnly = true  → además exige rol admin | owner (o super-admin email)
// superAdminOnly = true → exige específicamente el email del dueño de la solución
function ProtectedRoute({ children, adminOnly = false, superAdminOnly = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
  const isPlatformOwner = user?.email && platformOwners.includes(user.email.toLowerCase());

  if (superAdminOnly && !isPlatformOwner) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && user?.role !== 'admin' && user?.role !== 'owner' && !isPlatformOwner) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Redirige a /admin (o /super-admin) si el usuario ya está logueado como admin/owner/super-admin
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
    const isPlatformOwner = user?.email && platformOwners.includes(user.email.toLowerCase());
    if (isPlatformOwner) {
      return <Navigate to="/super-admin" replace />;
    }
    if (user?.role === 'owner' || user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
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

        {/* ── Rutas de clientes ───────────────────────────────────── */}
        <Route path="/" element={
          <ProtectedRoute>
            <ClientLayout><BookingPage /></ClientLayout>
          </ProtectedRoute>
        } />
        <Route path="/confirmacion" element={
          <ProtectedRoute>
            <ClientLayout><ConfirmationPage /></ClientLayout>
          </ProtectedRoute>
        } />
        <Route path="/mis-citas" element={
          <ProtectedRoute>
            <ClientLayout><MyAppointments /></ClientLayout>
          </ProtectedRoute>
        } />

        {/* Login unificado para clientes y admins */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <ClientLayout><LoginPage /></ClientLayout>
          </PublicOnlyRoute>
        } />

        {/* Redirigir la vieja URL del admin login al login unificado */}
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* ── Rutas de admin ──────────────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="profesionales" element={<ProfessionalsPage />} />
          <Route path="servicios" element={<ServicesPage />} />
          <Route path="citas" element={<AppointmentsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        {/* ── Rutas de super-admin ────────────────────────────────── */}
        <Route path="/super-admin" element={
          <ProtectedRoute superAdminOnly>
            <SuperAdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
