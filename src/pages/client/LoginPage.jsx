import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [error, setError] = useState('');
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = (credentialResponse) => {
    const result = loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      const { role } = result.user;
      if (role === 'owner' || role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google. Intentá de nuevo.');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Reservar turno</h1>
        <p className="auth-subtitle">Iniciá sesión con tu cuenta de Google para continuar</p>

        {error && (
          <div className="badge badge-danger mb-md" style={{ display: 'block', textAlign: 'center', padding: '8px 16px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-lg)' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="filled_blue"
            shape="pill"
            text="signin_with"
          />
        </div>
      </div>
    </div>
  );
}
