import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBusiness } from '../../contexts/BusinessContext';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { state } = useBusiness();
  const business = state.business;

  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <div className="header-logo-icon">S</div>
        <span>{business.name}</span>
      </Link>

      <div className="header-actions">
        {isAuthenticated ? (
          <>
            <Link to="/mis-citas" className="btn btn-ghost btn-sm">
              📅 Mis Citas
            </Link>
            <button onClick={logout} className="btn btn-ghost btn-sm">
              Salir
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-secondary btn-sm">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  );
}
