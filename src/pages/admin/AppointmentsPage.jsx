import { useState, useMemo } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { formatDate, formatPrice } from '../../utils/dateUtils';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'no_asistio', label: 'No Asistió' },
];

const STATUS_BADGES = {
  pendiente: 'badge-warning',
  confirmada: 'badge-success',
  completada: 'badge-primary',
  cancelada: 'badge-danger',
  no_asistio: 'badge-danger',
};

export default function AppointmentsPage() {
  const { state, dispatch } = useBusiness();
  const { appointments, professionals, services, business } = state;
  const [filterProf, setFilterProf] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filtered = useMemo(() => {
    let result = [...appointments].sort((a, b) => {
      const da = a.appointmentDate + 'T' + a.startTime;
      const db = b.appointmentDate + 'T' + b.startTime;
      return db.localeCompare(da);
    });
    if (filterProf) result = result.filter(a => a.professionalId === filterProf);
    if (filterStatus) result = result.filter(a => a.status === filterStatus);
    if (filterDate) result = result.filter(a => a.appointmentDate === filterDate);
    return result;
  }, [appointments, filterProf, filterStatus, filterDate]);

  const updateStatus = (id, status) => {
    dispatch({ type: 'UPDATE_APPOINTMENT', payload: { id, status } });
  };

  const cancelAppointment = (id) => {
    if (window.confirm('¿Cancelar esta cita?')) {
      dispatch({ type: 'CANCEL_APPOINTMENT', payload: id });
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Citas</h1>
        <span className="badge badge-neutral">{filtered.length} resultados</span>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="date"
          className="form-input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <select className="form-input" value={filterProf} onChange={e => setFilterProf(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Todos los profesionales</option>
          {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ maxWidth: 180 }}>
          {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {(filterProf || filterStatus || filterDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterProf(''); setFilterStatus(''); setFilterDate(''); }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Profesional</th>
              <th>Servicio</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(apt => {
              const prof = professionals.find(p => p.id === apt.professionalId);
              const srv = services.find(s => s.id === apt.serviceId);
              return (
                <tr key={apt.id}>
                  <td>{formatDate(apt.appointmentDate).split(',')[0]}</td>
                  <td><strong>{apt.startTime}</strong> — {apt.endTime}</td>
                  <td>{prof?.name}</td>
                  <td>{srv?.name}</td>
                  <td>{formatPrice(apt.price, business.currency)}</td>
                  <td><span className={`badge ${STATUS_BADGES[apt.status]}`}>{apt.status}</span></td>
                  <td>
                    <div className="table-actions">
                      {(apt.status === 'pendiente' || apt.status === 'confirmada') && (
                        <>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Completar"
                            onClick={() => updateStatus(apt.id, 'completada')}
                          >✅</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="No asistió"
                            onClick={() => updateStatus(apt.id, 'no_asistio')}
                          >👻</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Cancelar"
                            onClick={() => cancelAppointment(apt.id)}
                          >❌</button>
                        </>
                      )}
                      {apt.status === 'pendiente' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Confirmar"
                          onClick={() => updateStatus(apt.id, 'confirmada')}
                        >✔️</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No se encontraron citas con estos filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
