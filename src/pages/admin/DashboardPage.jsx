import { useBusiness } from '../../contexts/BusinessContext';
import { calculateStats } from '../../utils/statsCalculator';
import { formatPrice, formatDate } from '../../utils/dateUtils';

export default function DashboardPage() {
  const { state } = useBusiness();
  const { appointments, professionals, services, business } = state;
  const stats = calculateStats(appointments, professionals, services);
  const today = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments
    .filter(a => a.appointmentDate === today && (a.status === 'pendiente' || a.status === 'confirmada'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const maxRevProf = Math.max(...stats.ingresosPorProfesional.map(p => p.total), 1);
  const maxRevSrv = Math.max(...stats.ingresosPorServicio.map(s => s.total), 1);

  return (
    <div>
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <span className="badge badge-primary">📅 {formatDate(today)}</span>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📊</div>
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total Reservas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>✅</div>
          <div className="stat-card-value">{stats.completadas}</div>
          <div className="stat-card-label">Completadas</div>
          <div className="stat-card-change positive">{stats.total > 0 ? ((stats.completadas / stats.total) * 100).toFixed(0) : 0}% del total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>💰</div>
          <div className="stat-card-value">{formatPrice(stats.ingresosTotales, business.currency)}</div>
          <div className="stat-card-label">Ingresos Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>❌</div>
          <div className="stat-card-value">{stats.noAsistio}</div>
          <div className="stat-card-label">No Asistieron</div>
          <div className="stat-card-change negative">{stats.tasaNoAsistencia}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>⏳</div>
          <div className="stat-card-value">{stats.pendientes}</div>
          <div className="stat-card-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>↩️</div>
          <div className="stat-card-value">{stats.canceladas}</div>
          <div className="stat-card-label">Canceladas</div>
          <div className="stat-card-change negative">{stats.tasaCancelacion}%</div>
        </div>
      </div>

      {/* Revenue */}
      <div className="revenue-section">
        <div className="revenue-card">
          <h3>Ingresos por Profesional</h3>
          {stats.ingresosPorProfesional.map(p => (
            <div key={p.id} className="revenue-bar-item">
              <div className="revenue-bar-header">
                <span>{p.name}</span>
                <span className="text-secondary">{formatPrice(p.total, business.currency)} ({p.count} citas)</span>
              </div>
              <div className="revenue-bar-track">
                <div className="revenue-bar-fill" style={{ width: `${(p.total / maxRevProf) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="revenue-card">
          <h3>Ingresos por Servicio</h3>
          {stats.ingresosPorServicio.map(s => (
            <div key={s.id} className="revenue-bar-item">
              <div className="revenue-bar-header">
                <span>{s.name}</span>
                <span className="text-secondary">{formatPrice(s.total, business.currency)} ({s.count})</span>
              </div>
              <div className="revenue-bar-track">
                <div className="revenue-bar-fill" style={{ width: `${(s.total / maxRevSrv) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="upcoming-table">
        <h3>📅 Citas de Hoy ({todayAppointments.length})</h3>
        {todayAppointments.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
            <p>No hay citas programadas para hoy</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Profesional</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map(apt => {
                const prof = professionals.find(p => p.id === apt.professionalId);
                const srv = services.find(s => s.id === apt.serviceId);
                return (
                  <tr key={apt.id}>
                    <td><strong>{apt.startTime}</strong></td>
                    <td>{prof?.name}</td>
                    <td>{apt.userId}</td>
                    <td>{srv?.name}</td>
                    <td><span className={`badge ${apt.status === 'confirmada' ? 'badge-success' : 'badge-warning'}`}>{apt.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
