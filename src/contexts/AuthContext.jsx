import { createContext, useContext, useReducer, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useBusiness } from './BusinessContext';

const AuthContext = createContext();
const AUTH_KEY = 'saciaturno_auth';

function loadAuth() {
  try {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { user: null, isAuthenticated: false };
}

function saveAuth(state) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  } catch (e) {}
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  // AuthProvider es hijo de BusinessProvider → puede usar useBusiness()
  const { state: bizState } = useBusiness();
  const [state, dispatch] = useReducer(authReducer, loadAuth());

  useEffect(() => {
    saveAuth(state);
  }, [state]);

  // Cuando cambia la lista de admins autorizados, revalidar el usuario actual
  // (ej: el dueño le quitó permisos a alguien que ya estaba logueado)
  useEffect(() => {
    if (!state.user) return;
    const authorizedAdmins = bizState.authorizedAdmins || [];
    const match = authorizedAdmins.find(
      (a) => a.email.toLowerCase() === state.user.email.toLowerCase()
    );
    const currentRole = match?.role || 'client';
    const currentProfessionalId = match?.professionalId || null;

    // Solo actualizar si el rol o professionalId cambió
    if (
      state.user.role !== currentRole ||
      state.user.professionalId !== currentProfessionalId
    ) {
      dispatch({
        type: 'UPDATE_USER',
        payload: { role: currentRole, professionalId: currentProfessionalId },
      });
    }
  }, [bizState.authorizedAdmins, state.user]);

  /**
   * Login exclusivo con Google.
   * - Si el Gmail está en authorizedAdmins  → role = 'owner' | 'admin'
   * - Si no está                            → role = 'client'
   */
  const loginWithGoogle = (credential) => {
    try {
      const decoded = jwtDecode(credential);
      const { email, name, picture, sub: googleId } = decoded;

      const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
      const isPlatformOwner = platformOwners.includes(email.toLowerCase());
      const authorizedAdmins = bizState.authorizedAdmins || [];
      const match = authorizedAdmins.find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      );

      const user = {
        id: googleId,
        email,
        name,
        avatarUrl: picture,
        googleId,
        role: isPlatformOwner ? 'owner' : (match?.role || 'client'),
        professionalId: isPlatformOwner ? null : (match?.professionalId || null),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'LOGIN', payload: user });
      return { success: true, user };
    } catch (error) {
      console.error('Google Login Error:', error);
      return { success: false, error: 'Error al iniciar sesión con Google' };
    }
  };

  const loginBypass = (email) => {
    const platformOwners = ['pocopanjugueteria@gmail.com', 'cavannaprogramacion@gmail.com'];
    const isPlatformOwner = platformOwners.includes(email.toLowerCase());
    const authorizedAdmins = bizState.authorizedAdmins || [];
    const match = authorizedAdmins.find(
      (a) => a.email.toLowerCase() === email.toLowerCase()
    );

    const user = {
      id: 'bypass-' + Date.now(),
      email,
      name: match ? match.name : email.split('@')[0],
      avatarUrl: null,
      role: isPlatformOwner ? 'owner' : (match?.role || 'client'),
      professionalId: isPlatformOwner ? null : (match?.professionalId || null),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'LOGIN', payload: user });
    return { success: true, user };
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithGoogle, loginBypass, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
