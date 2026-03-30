import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.success) {
      navigate('/mis-citas');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>
        <p className="auth-subtitle">Accedé a tu cuenta para ver tus citas</p>
        {error && <div className="badge badge-danger mb-md" style={{ display: 'block', textAlign: 'center', padding: '8px 16px', borderRadius: '8px' }}>{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Tu contraseña" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg">Iniciar Sesión</button>
        </form>
        <p className="auth-link">
          ¿No tenés cuenta? <Link to="/registro">Crear cuenta</Link>
        </p>
      </div>
    </div>
  );
}
