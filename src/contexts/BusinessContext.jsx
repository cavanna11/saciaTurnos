import { createContext, useContext, useReducer, useEffect } from 'react';
import {
  professionals as mockProfessionals,
  services as mockServices,
  professionalServices as mockPS,
  schedules as mockSchedules,
  appointments as mockAppointments,
  businessSettings as mockBusiness,
  authorizedAdmins as mockAuthorizedAdmins,
} from '../config/mockData';

const BusinessContext = createContext();

const STORAGE_KEY = 'saciaturno_data';

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return null;
}

function saveData(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

// Mergea los admins de mockData con los del localStorage:
// - Los admins agregados desde la UI (en localStorage) se conservan
// - Cualquier email nuevo/actualizado en mockData.js se incorpora automáticamente
// - Si el email ya existe en localStorage, mockData NO lo sobreescribe (la UI tiene prioridad)
function mergeAuthorizedAdmins(fromStorage = [], fromMock = []) {
  const merged = [...fromStorage];
  for (const mockAdmin of fromMock) {
    const alreadyExists = merged.some(
      (a) => a.email.toLowerCase() === mockAdmin.email.toLowerCase()
    );
    if (!alreadyExists) merged.push(mockAdmin);
  }
  return merged;
}

const _saved = loadData();

const initialState = _saved
  ? {
      ..._saved,
      // Siempre incorporar emails nuevos de mockData aunque el localStorage ya tenga datos
      authorizedAdmins: mergeAuthorizedAdmins(
        _saved.authorizedAdmins || [],
        mockAuthorizedAdmins
      ),
    }
  : {
      business: mockBusiness,
      professionals: mockProfessionals,
      services: mockServices,
      professionalServices: mockPS,
      schedules: mockSchedules,
      appointments: mockAppointments,
      authorizedAdmins: mockAuthorizedAdmins,
    };

function businessReducer(state, action) {
  switch (action.type) {

    // ── Citas ──────────────────────────────────────────────────────────────
    case 'ADD_APPOINTMENT':
      return { ...state, appointments: [...state.appointments, action.payload] };
    case 'UPDATE_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      };
    case 'CANCEL_APPOINTMENT':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.payload
            ? { ...a, status: 'cancelada', cancelledAt: new Date().toISOString() }
            : a
        ),
      };

    // ── Profesionales ──────────────────────────────────────────────────────
    case 'ADD_PROFESSIONAL':
      return { ...state, professionals: [...state.professionals, action.payload] };
    case 'UPDATE_PROFESSIONAL':
      return {
        ...state,
        professionals: state.professionals.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case 'DELETE_PROFESSIONAL':
      return {
        ...state,
        professionals:       state.professionals.filter((p) => p.id !== action.payload),
        // Limpieza en cascada: eliminar horarios y servicios del profesional borrado
        schedules:           state.schedules.filter((s) => s.professionalId !== action.payload),
        professionalServices: state.professionalServices.filter((ps) => ps.professionalId !== action.payload),
      };

    // ── Servicios ──────────────────────────────────────────────────────────
    case 'ADD_SERVICE':
      return { ...state, services: [...state.services, action.payload] };
    case 'UPDATE_SERVICE':
      return {
        ...state,
        services: state.services.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };
    case 'DELETE_SERVICE':
      return {
        ...state,
        services: state.services.filter((s) => s.id !== action.payload),
      };

    // ── Horarios / Professional-Services ───────────────────────────────────
    case 'SET_SCHEDULES':
      return {
        ...state,
        schedules: [
          ...state.schedules.filter((s) => s.professionalId !== action.payload.professionalId),
          ...action.payload.schedules,
        ],
      };
    case 'UPDATE_PROFESSIONAL_SERVICES':
      return {
        ...state,
        professionalServices: [
          ...state.professionalServices.filter(
            (ps) => ps.professionalId !== action.payload.professionalId
          ),
          ...action.payload.services,
        ],
      };

    // ── Configuración del negocio ──────────────────────────────────────────
    case 'UPDATE_BUSINESS':
      return { ...state, business: { ...state.business, ...action.payload } };

    // ── Admins autorizados ─────────────────────────────────────────────────
    case 'ADD_AUTHORIZED_ADMIN':
      return {
        ...state,
        authorizedAdmins: [...state.authorizedAdmins, action.payload],
      };
    case 'UPDATE_AUTHORIZED_ADMIN':
      return {
        ...state,
        authorizedAdmins: state.authorizedAdmins.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload } : a
        ),
      };
    case 'REMOVE_AUTHORIZED_ADMIN':
      return {
        ...state,
        authorizedAdmins: state.authorizedAdmins.filter((a) => a.id !== action.payload),
      };

    // ── Reset ──────────────────────────────────────────────────────────────
    case 'RESET_DATA':
      return {
        business: mockBusiness,
        professionals: mockProfessionals,
        services: mockServices,
        professionalServices: mockPS,
        schedules: mockSchedules,
        appointments: mockAppointments,
        authorizedAdmins: mockAuthorizedAdmins,
      };

    default:
      return state;
  }
}

export function BusinessProvider({ children }) {
  const [state, dispatch] = useReducer(businessReducer, initialState);

  useEffect(() => {
    saveData(state);
  }, [state]);

  return (
    <BusinessContext.Provider value={{ state, dispatch }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within BusinessProvider');
  return context;
}
