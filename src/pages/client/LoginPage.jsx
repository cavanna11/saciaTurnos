import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [error, setError] = useState('');
  const { loginWithGoogle, loginBypass } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = (credentialResponse) => {
    const result = loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      const { email, role } = result.user;
      const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
      
      if (platformOwners.includes(email.toLowerCase())) {
        navigate('/super-admin');
      } else if (role === 'owner' || role === 'admin') {
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

  const handleBypass = (email) => {
    const result = loginBypass(email);
    if (result.success) {
      const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
      if (platformOwners.includes(email.toLowerCase())) {
        navigate('/super-admin');
      } else if (result.user.role === 'owner' || result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
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

        {/* MODO DESARROLLO / BYPASS */}
        <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px dashed var(--border-color)', paddingTop: 'var(--space-md)' }}>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
            🛠️ ACCESO RÁPIDO (MODO DESARROLLO)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button 
              className="btn btn-outline" 
              onClick={() => handleBypass('cavannaprogramacion@gmail.com')}
              style={{ fontSize: 13, justifyContent: 'center', width: '100%', padding: '10px' }}
            >
              👑 Entrar como Super-Admin
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleBypass('jano.cobasale@gmail.com')}
              style={{ fontSize: 13, justifyContent: 'center', width: '100%', padding: '10px' }}
            >
              💈 Entrar como Peluquero (Jano)
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleBypass('laura@email.com')}
              style={{ fontSize: 13, justifyContent: 'center', width: '100%', padding: '10px' }}
            >
              👤 Entrar como Cliente (Laura)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
