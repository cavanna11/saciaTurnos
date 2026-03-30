import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../contexts/BookingContext';
import { useBusiness } from '../../contexts/BusinessContext';
import { useAuth } from '../../contexts/AuthContext';
import { calculateAvailableSlots, professionalWorksOnDate } from '../../utils/availabilityEngine';
import { formatDate, formatPrice, toDateString, getLocalDayOfWeek, getMonthName, getDayShort, addMinutes, generateId } from '../../utils/dateUtils';

// ---- STEPPER ----
function Stepper({ step }) {
  const labels = ['Profesional', 'Servicio', 'Fecha', 'Horario', 'Datos', 'Cuenta', 'Confirmar'];
  return (
    <div className="stepper">
      {labels.map((label, idx) => {
        const num = idx + 1;
        const completed = num < step;
        const active = num === step;
        return (
          <div key={num} className="stepper-step">
            {idx > 0 && <div className={`stepper-line ${completed ? 'completed' : ''}`} />}
            <div>
              <div className={`stepper-circle ${active ? 'active' : ''} ${completed ? 'completed' : ''}`}>
                {completed ? '✓' : num}
              </div>
              <div className={`stepper-label ${active ? 'active' : ''}`}>{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- PROFESSIONAL SELECT ----
function ProfessionalSelect({ professionals, selectedId, onSelect }) {
  return (
    <div>
      <h2 className="booking-step-title">Seleccioná tu profesional</h2>
      <p className="booking-step-subtitle">Elegí con quién querés atenderte</p>
      <div className="professionals-grid">
        {professionals.filter(p => p.isActive).map((prof) => (
          <div
            key={prof.id}
            className={`card card-selectable professional-card ${selectedId === prof.id ? 'card-selected' : ''}`}
            onClick={() => onSelect(prof.id)}
          >
            <div className="avatar avatar-lg">
              {prof.avatarUrl ? <img src={prof.avatarUrl} alt={prof.name} /> : prof.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3>{prof.name}</h3>
            <p className="specialty">{prof.specialty}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- SERVICE SELECT ----
function ServiceSelect({ services, professionalServices, professionalId, selectedId, onSelect, currency }) {
  const available = useMemo(() => {
    const psIds = professionalServices
      .filter(ps => ps.professionalId === professionalId)
      .map(ps => ps.serviceId);
    return services.filter(s => s.isActive && psIds.includes(s.id)).map(s => {
      const ps = professionalServices.find(p => p.professionalId === professionalId && p.serviceId === s.id);
      return { ...s, finalPrice: ps?.customPrice || s.price, finalDuration: ps?.customDuration || s.durationMinutes };
    });
  }, [services, professionalServices, professionalId]);

  return (
    <div>
      <h2 className="booking-step-title">Elegí un servicio</h2>
      <p className="booking-step-subtitle">Servicios disponibles</p>
      <div className="services-list">
        {available.map((service) => (
          <div
            key={service.id}
            className={`card card-selectable service-card ${selectedId === service.id ? 'card-selected' : ''}`}
            onClick={() => onSelect(service.id)}
          >
            <div className="service-info">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
            <div className="service-meta">
              <div className="service-price">{formatPrice(service.finalPrice, currency)}</div>
              <div className="service-duration">⏱ {service.finalDuration} min</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- DATE PICKER ----
function DatePicker({ selectedDate, onSelect, professionalId, schedules: allSchedules }) {
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) return new Date(selectedDate + 'T00:00:00');
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const today = toDateString(new Date());

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div>
      <h2 className="booking-step-title">Elegí una fecha</h2>
      <p className="booking-step-subtitle">Seleccioná el día de tu cita</p>
      <div className="calendar">
        <div className="calendar-header">
          <button className="calendar-nav" onClick={prevMonth}>◀</button>
          <h3>{getMonthName(month)} {year}</h3>
          <button className="calendar-nav" onClick={nextMonth}>▶</button>
        </div>
        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {days.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} className="calendar-day empty" />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPastDate = dateStr < today;
            const works = professionalWorksOnDate(professionalId, dateStr, allSchedules);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;

            return (
              <button
                key={dateStr}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                disabled={isPastDate || !works}
                onClick={() => onSelect(dateStr)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---- TIME SLOT GRID ----
function TimeSlotGrid({ slots, selectedSlot, onSelect, date }) {
  const morning = slots.filter(s => parseInt(s.startTime.split(':')[0]) < 13);
  const afternoon = slots.filter(s => parseInt(s.startTime.split(':')[0]) >= 13);

  if (slots.length === 0) {
    return (
      <div>
        <h2 className="booking-step-title">Horarios disponibles</h2>
        <p className="booking-step-subtitle">{formatDate(date)}</p>
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p>No hay horarios disponibles para este día</p>
          <p className="text-sm text-muted mt-sm">Probá seleccionando otra fecha</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="booking-step-title">Elegí un horario</h2>
      <p className="booking-step-subtitle">{formatDate(date)}</p>
      <div className="timeslots-container">
        {morning.length > 0 && (
          <div className="timeslots-section">
            <h3>Mañana</h3>
            <div className="timeslots-grid">
              {morning.map(slot => (
                <button
                  key={slot.startTime}
                  className={`timeslot ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                  onClick={() => onSelect(slot)}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          </div>
        )}
        {afternoon.length > 0 && (
          <div className="timeslots-section">
            <h3>Tarde</h3>
            <div className="timeslots-grid">
              {afternoon.map(slot => (
                <button
                  key={slot.startTime}
                  className={`timeslot ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                  onClick={() => onSelect(slot)}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- PERSONAL INFO ----
function PersonalInfoStep({ info, onChange }) {
  return (
    <div>
      <h2 className="booking-step-title">Tus datos</h2>
      <p className="booking-step-subtitle">Necesitamos tus datos para confirmar la reserva</p>
      <div className="personal-form">
        <div className="form-group">
          <label className="form-label">Nombre completo <span className="required">*</span></label>
          <input className="form-input" type="text" value={info.name} onChange={e => onChange({ name: e.target.value })} placeholder="Juan Pérez" />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono <span className="required">*</span></label>
          <input className="form-input" type="tel" value={info.phone} onChange={e => onChange({ phone: e.target.value })} placeholder="+54 11 1234-5678" />
        </div>
        <div className="form-group">
          <label className="form-label">Email <span className="required">*</span></label>
          <input className="form-input" type="email" value={info.email} onChange={e => onChange({ email: e.target.value })} placeholder="tu@email.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Notas (opcional)</label>
          <textarea className="form-input" value={info.notes} onChange={e => onChange({ notes: e.target.value })} placeholder="Algún comentario para el profesional..." />
        </div>
      </div>
    </div>
  );
}

// ---- AUTH STEP ----
function AuthStep({ info, onLogin, onRegister }) {
  const [mode, setMode] = useState('register');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [error, setError] = useState('');

  const handleRegister = () => {
    if (!password || password.length < 4) return setError('La contraseña debe tener al menos 4 caracteres');
    if (password !== password2) return setError('Las contraseñas no coinciden');
    setError('');
    onRegister(password);
  };

  const handleLogin = () => {
    setError('');
    onLogin(loginEmail, loginPass);
  };

  return (
    <div>
      <h2 className="booking-step-title">Crear cuenta o iniciar sesión</h2>
      <p className="booking-step-subtitle">Necesitás una cuenta para reservar</p>
      <div className="auth-container" style={{ padding: 0 }}>
        <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>Crear Cuenta</button>
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>Iniciar Sesión</button>
        </div>
        {error && <div className="badge badge-danger mb-md" style={{ display: 'block', textAlign: 'center', padding: '8px 16px', borderRadius: '8px' }}>{error}</div>}
        {mode === 'register' ? (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Contraseña <span className="required">*</span></label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 4 caracteres" />
            </div>
            <div className="form-group">
              <label className="form-label">Repetir contraseña <span className="required">*</span></label>
              <input className="form-input" type="password" value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Repetí tu contraseña" />
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleRegister}>Crear Cuenta y Continuar</button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Tu contraseña" />
            </div>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleLogin}>Iniciar Sesión y Continuar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- SUMMARY ----
function BookingSummary({ professional, service, date, timeSlot, price, currency }) {
  return (
    <div>
      <h2 className="booking-step-title">Confirmar tu reserva</h2>
      <p className="booking-step-subtitle">Revisá los datos antes de confirmar</p>
      <div className="booking-summary">
        <div className="summary-card">
          <div className="summary-header">
            <div className="avatar avatar-lg" style={{ margin: '0 auto var(--space-sm)' }}>
              {professional.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3>{professional.name}</h3>
            <p className="text-sm" style={{ opacity: 0.8 }}>{professional.specialty}</p>
          </div>
          <div className="summary-body">
            <div className="summary-row">
              <span className="summary-label">✂️ Servicio</span>
              <span className="summary-value">{service.name}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">📅 Fecha</span>
              <span className="summary-value">{formatDate(date)}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">🕐 Horario</span>
              <span className="summary-value">{timeSlot.startTime} — {timeSlot.endTime}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">⏱ Duración</span>
              <span className="summary-value">{service.finalDuration || service.durationMinutes} min</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💰 Total</span>
              <span className="summary-value">{formatPrice(price, currency)}</span>
            </div>
          </div>
          <div className="summary-footer">
            <div className="future-feature">
              🔒 Próximamente: pago con Mercado Pago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// BOOKING PAGE (Main Component)
// ============================================

export default function BookingPage() {
  const { booking, dispatch } = useBooking();
  const { state, dispatch: bizDispatch } = useBusiness();
  const { isAuthenticated, user, login, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { professionals, services, professionalServices, schedules, appointments, business } = state;
  const { step, professionalId, serviceId, date, timeSlot, personalInfo } = booking;

  const selectedProfessional = professionals.find(p => p.id === professionalId);
  const selectedService = services.find(s => s.id === serviceId);

  // Get customized price
  const ps = professionalServices.find(p => p.professionalId === professionalId && p.serviceId === serviceId);
  const finalPrice = ps?.customPrice || selectedService?.price || 0;
  const finalDuration = ps?.customDuration || selectedService?.durationMinutes || 30;

  // Calculate available slots
  const availableSlots = useMemo(() => {
    if (!professionalId || !serviceId || !date) return [];
    return calculateAvailableSlots({
      professionalId,
      serviceId,
      date,
      schedules,
      appointments,
      services,
      professionalServices,
      slotInterval: business.slotInterval,
    });
  }, [professionalId, serviceId, date, schedules, appointments]);

  const canGoNext = () => {
    switch (step) {
      case 1: return !!professionalId;
      case 2: return !!serviceId;
      case 3: return !!date;
      case 4: return !!timeSlot;
      case 5: return personalInfo.name && personalInfo.phone && personalInfo.email;
      case 6: return isAuthenticated;
      case 7: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 5 && isAuthenticated) {
      // Skip auth step if already logged in
      dispatch({ type: 'SET_STEP', payload: 7 });
      return;
    }
    dispatch({ type: 'NEXT_STEP' });
  };

  const handleBack = () => {
    if (step === 7 && isAuthenticated) {
      dispatch({ type: 'SET_STEP', payload: 5 });
      return;
    }
    dispatch({ type: 'PREV_STEP' });
  };

  const handleLogin = (email, password) => {
    const result = login(email, password);
    if (result.success) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      setError(result.error);
    }
  };

  const handleRegister = (password) => {
    const result = register({
      name: personalInfo.name,
      email: personalInfo.email,
      phone: personalInfo.phone,
      password,
    });
    if (result.success) {
      dispatch({ type: 'NEXT_STEP' });
    } else {
      setError(result.error);
    }
  };

  const handleConfirm = () => {
    const newAppointment = {
      id: generateId(),
      businessId: business.id,
      userId: user.id,
      professionalId,
      serviceId,
      appointmentDate: date,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      price: finalPrice,
      status: 'pendiente',
      notes: personalInfo.notes || '',
      adminNotes: '',
      createdAt: new Date().toISOString(),
    };
    bizDispatch({ type: 'ADD_APPOINTMENT', payload: newAppointment });
    dispatch({ type: 'RESET' });
    navigate('/confirmacion', { state: { appointment: newAppointment } });
  };

  return (
    <div className="booking-container">
      <Stepper step={step} />

      {step === 1 && (
        <ProfessionalSelect
          professionals={professionals}
          selectedId={professionalId}
          onSelect={id => dispatch({ type: 'SET_PROFESSIONAL', payload: id })}
        />
      )}

      {step === 2 && (
        <ServiceSelect
          services={services}
          professionalServices={professionalServices}
          professionalId={professionalId}
          selectedId={serviceId}
          onSelect={id => dispatch({ type: 'SET_SERVICE', payload: id })}
          currency={business.currency}
        />
      )}

      {step === 3 && (
        <DatePicker
          selectedDate={date}
          onSelect={d => dispatch({ type: 'SET_DATE', payload: d })}
          professionalId={professionalId}
          schedules={schedules}
        />
      )}

      {step === 4 && (
        <TimeSlotGrid
          slots={availableSlots}
          selectedSlot={timeSlot}
          onSelect={s => dispatch({ type: 'SET_TIMESLOT', payload: s })}
          date={date}
        />
      )}

      {step === 5 && (
        <PersonalInfoStep
          info={personalInfo}
          onChange={data => dispatch({ type: 'SET_PERSONAL_INFO', payload: data })}
        />
      )}

      {step === 6 && (
        <AuthStep
          info={personalInfo}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}

      {step === 7 && selectedProfessional && selectedService && (
        <BookingSummary
          professional={selectedProfessional}
          service={{ ...selectedService, finalDuration }}
          date={date}
          timeSlot={timeSlot}
          price={finalPrice}
          currency={business.currency}
        />
      )}

      <div className="booking-nav">
        {step > 1 ? (
          <button className="btn btn-outline" onClick={handleBack}>← Atrás</button>
        ) : <div />}

        {step < 7 && step !== 6 ? (
          <button className="btn btn-primary" disabled={!canGoNext()} onClick={handleNext}>
            Siguiente →
          </button>
        ) : step === 7 ? (
          <button className="btn btn-primary btn-lg" onClick={handleConfirm}>
            ✅ Confirmar Reserva
          </button>
        ) : null}
      </div>
    </div>
  );
}
