import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  professionals as mockProfessionals,
  services as mockServices,
  professionalServices as mockPS,
  schedules as mockSchedules,
  appointments as mockAppointments,
  businessSettings as mockBusiness,
  businesses as mockBusinesses,
  authorizedAdmins as mockAuthorizedAdmins,
  whatsappConfig as mockWhatsappConfig,
  whatsappLogs as mockWhatsappLogs,
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
      businesses: _saved.businesses || mockBusinesses,
      business: _saved.business || mockBusiness,
      whatsappConfig: _saved.whatsappConfig || mockWhatsappConfig,
      whatsappLogs: _saved.whatsappLogs || mockWhatsappLogs,
      authorizedAdmins: mergeAuthorizedAdmins(
        _saved.authorizedAdmins || [],
        mockAuthorizedAdmins
      ),
    }
  : {
      business: mockBusiness,
      businesses: mockBusinesses,
      professionals: mockProfessionals,
      services: mockServices,
      professionalServices: mockPS,
      schedules: mockSchedules,
      appointments: mockAppointments,
      authorizedAdmins: mockAuthorizedAdmins,
      whatsappConfig: mockWhatsappConfig,
      whatsappLogs: mockWhatsappLogs,
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
        professionals: state.professionals.filter((p) => p.id !== action.payload),
        schedules: state.schedules.filter((s) => s.professionalId !== action.payload),
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
    case 'UPDATE_BUSINESS': {
      const updatedBusiness = { ...state.business, ...action.payload };
      return {
        ...state,
        business: updatedBusiness,
        businesses: state.businesses.map((b) =>
          b.id === updatedBusiness.id ? updatedBusiness : b
        ),
      };
    }

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

    // ── Super-Admin Actions ────────────────────────────────────────────────
    case 'SET_BUSINESSES': {
      const activeBusiness = state.business
        ? action.payload.find((b) => b.id === state.business.id) || state.business
        : state.business;
      return { ...state, businesses: action.payload, business: activeBusiness };
    }
    case 'TOGGLE_FREEZE_BUSINESS': {
      const businesses = state.businesses.map((b) =>
        b.id === action.payload ? { ...b, isFrozen: !b.isFrozen } : b
      );
      const activeBusiness = state.business && state.business.id === action.payload
        ? { ...state.business, isFrozen: !state.business.isFrozen }
        : state.business;
      return { ...state, businesses, business: activeBusiness };
    }
    case 'UPDATE_BUSINESS_DEBT': {
      const { businessId, debt } = action.payload;
      const businesses = state.businesses.map((b) =>
        b.id === businessId ? { ...b, debt } : b
      );
      const activeBusiness = state.business && state.business.id === businessId
        ? { ...state.business, debt }
        : state.business;
      return { ...state, businesses, business: activeBusiness };
    }
    case 'RECORD_BUSINESS_PAYMENT': {
      const { businessId, amount, date } = action.payload;
      const businesses = state.businesses.map((b) => {
        if (b.id === businessId) {
          const newDebt = Math.max(0, b.debt - amount);
          return {
            ...b,
            debt: newDebt,
            lastPaymentDate: date,
            isFrozen: newDebt > 0 ? b.isFrozen : false, // Reactivar automáticamente al saldar toda la deuda
          };
        }
        return b;
      });
      const activeBusiness = state.business && state.business.id === businessId
        ? businesses.find((b) => b.id === businessId)
        : state.business;
      return { ...state, businesses, business: activeBusiness };
    }
    case 'UPDATE_GLOBAL_WHATSAPP':
      return {
        ...state,
        whatsappConfig: { ...state.whatsappConfig, ...action.payload },
      };
    case 'UPGRADE_BUSINESS_PLAN': {
      const { businessId, whatsappQuota, monthlyFee } = action.payload;
      const businesses = state.businesses.map((b) =>
        b.id === businessId ? { ...b, whatsappQuota, monthlyFee } : b
      );
      const activeBusiness = state.business && state.business.id === businessId
        ? { ...state.business, whatsappQuota, monthlyFee }
        : state.business;
      return { ...state, businesses, business: activeBusiness };
    }
    case 'ADD_WHATSAPP_LOG':
      return {
        ...state,
        whatsappLogs: [action.payload, ...state.whatsappLogs],
      };

    // ── Reset ──────────────────────────────────────────────────────────────
    case 'RESET_DATA':
      return {
        business: mockBusiness,
        businesses: mockBusinesses,
        professionals: mockProfessionals,
        services: mockServices,
        professionalServices: mockPS,
        schedules: mockSchedules,
        appointments: mockAppointments,
        authorizedAdmins: mockAuthorizedAdmins,
        whatsappConfig: mockWhatsappConfig,
        whatsappLogs: mockWhatsappLogs,
      };

    default:
      return state;
  }
}

export function BusinessProvider({ children }) {
  const [state, dispatch] = useReducer(businessReducer, initialState);
  const [billingChecked, setBillingChecked] = useState(false);

  // Motor de facturación automático (ejecutado una vez por sesión en local)
  useEffect(() => {
    if (billingChecked || !state.businesses) return;

    const today = new Date().toISOString().split('T')[0];
    let updated = false;

    const newBusinesses = state.businesses.map((b) => {
      const biz = { ...b };
      let changed = false;

      // Inicializar fecha de cobro si no tiene
      if (!biz.nextBillingDate) {
        const createdDate = biz.createdAt ? new Date(biz.createdAt) : new Date();
        const nextDate = new Date(createdDate.setMonth(createdDate.getMonth() + 1));
        biz.nextBillingDate = nextDate.toISOString().split('T')[0];
        changed = true;
      }

      // Si se superó la fecha de vencimiento sin pagar
      while (today > biz.nextBillingDate) {
        // Sumar mensualidad a la deuda acumulada
        biz.debt = (biz.debt || 0) + (biz.monthlyFee || 0);
        // Desplazar fecha al mes siguiente
        const currentNext = new Date(biz.nextBillingDate + 'T00:00:00');
        currentNext.setMonth(currentNext.getMonth() + 1);
        biz.nextBillingDate = currentNext.toISOString().split('T')[0];
        changed = true;
      }

      // Suspensión automática: si tiene deuda, congelar
      if ((biz.debt || 0) > 0 && !biz.isFrozen) {
        biz.isFrozen = true;
        changed = true;
      }

      // Reactivación automática: si no tiene deuda y estaba congelado por deuda, descongelar
      if ((biz.debt || 0) === 0 && biz.isFrozen) {
        biz.isFrozen = false;
        changed = true;
      }

      if (changed) {
        updated = true;
      }
      return biz;
    });

    setBillingChecked(true);

    if (updated) {
      dispatch({ type: 'SET_BUSINESSES', payload: newBusinesses });
    }
  }, [state.businesses, billingChecked]);

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
