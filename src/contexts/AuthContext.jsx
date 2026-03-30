import { createContext, useContext, useReducer, useEffect } from 'react';
import { users as mockUsers } from '../config/mockData';

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
    case 'REGISTER':
      return { user: action.payload, isAuthenticated: true };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, loadAuth());

  useEffect(() => {
    saveAuth(state);
  }, [state]);

  const login = (email, password) => {
    const user = mockUsers.find(
      (u) => u.email === email && u.passwordHash === password
    );
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return { success: true, user };
    }
    return { success: false, error: 'Email o contraseña incorrectos' };
  };

  const register = (userData) => {
    const exists = mockUsers.find((u) => u.email === userData.email);
    if (exists) {
      return { success: false, error: 'El email ya está registrado' };
    }
    const newUser = {
      id: 'usr-' + Date.now(),
      ...userData,
      passwordHash: userData.password,
      role: 'client',
      businessId: null,
      avatarUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    dispatch({ type: 'REGISTER', payload: newUser });
    return { success: true, user: newUser };
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
