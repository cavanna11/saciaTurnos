import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/profesionales', icon: '👥', label: 'Profesionales' },
  { to: '/admin/servicios', icon: '✂️', label: 'Servicios' },
  { to: '/admin/citas', icon: '📅', label: 'Citas' },
  { to: '/admin/configuracion', icon: '⚙️', label: 'Configuración' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="header-logo-icon">S</div>
          <span>SACIA Admin</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
          </div>
          <div className="admin-topbar-right">
            <div className="flex items-center gap-sm">
              <div className="avatar avatar-sm">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="text-sm">{user?.name || 'Admin'}</span>
            </div>
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
