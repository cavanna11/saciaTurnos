import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.success) {
      if (result.user.role === 'admin' || result.user.role === 'owner') {
        navigate('/admin');
      } else {
        setError('No tenés permisos de administrador');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sidebar-bg)' }}>
      <div className="auth-card" style={{ maxWidth: 420, width: '100%', margin: '0 var(--space-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <div className="header-logo-icon" style={{ width: 48, height: 48, fontSize: '1.25rem', margin: '0 auto var(--space-sm)' }}>S</div>
          <h1 style={{ fontSize: '1.5rem' }}>SACIA Admin</h1>
          <p className="auth-subtitle" style={{ marginBottom: 0 }}>Accedé al panel de administración</p>
        </div>
        {error && <div className="badge badge-danger mb-md" style={{ display: 'block', textAlign: 'center', padding: '8px 16px', borderRadius: '8px' }}>{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@sacia.tech" required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg">Ingresar</button>
        </form>
        <p className="text-center text-sm text-muted mt-md">Demo: admin@sacia.tech / admin123</p>
      </div>
    </div>
  );
}
