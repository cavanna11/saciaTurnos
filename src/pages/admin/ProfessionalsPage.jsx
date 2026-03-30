import { useState } from 'react';
import { useBusiness } from '../../contexts/BusinessContext';
import { getDayName } from '../../utils/dateUtils';
import { generateId } from '../../utils/dateUtils';

export default function ProfessionalsPage() {
  const { state, dispatch } = useBusiness();
  const { professionals, schedules, professionalServices, services } = state;
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', specialty: '', phone: '', email: '', bio: '' });
  const [editSchedules, setEditSchedules] = useState([]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', specialty: '', phone: '', email: '', bio: '' });
    setEditSchedules(Array.from({ length: 7 }, (_, i) => ({
      id: generateId(), professionalId: '', dayOfWeek: i,
      startTime: i < 5 ? '09:00' : i === 5 ? '09:00' : '',
      endTime: i < 5 ? '19:00' : i === 5 ? '14:00' : '',
      breakStart: i < 5 ? '13:00' : null, breakEnd: i < 5 ? '14:00' : null,
      isActive: i < 6,
    })));
    setShowModal(true);
  };

  const openEdit = (prof) => {
    setEditing(prof);
    setForm({ name: prof.name, specialty: prof.specialty || '', phone: prof.phone || '', email: prof.email || '', bio: prof.bio || '' });
    const profSchedules = schedules.filter(s => s.professionalId === prof.id);
    setEditSchedules(Array.from({ length: 7 }, (_, i) => {
      const existing = profSchedules.find(s => s.dayOfWeek === i);
      return existing || {
        id: generateId(), professionalId: prof.id, dayOfWeek: i,
        startTime: '', endTime: '', breakStart: null, breakEnd: null, isActive: false,
      };
    }));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editing) {
      dispatch({ type: 'UPDATE_PROFESSIONAL', payload: { id: editing.id, ...form } });
      dispatch({
        type: 'SET_SCHEDULES',
        payload: { professionalId: editing.id, schedules: editSchedules.map(s => ({ ...s, professionalId: editing.id })) },
      });
    } else {
      const newId = generateId();
      dispatch({
        type: 'ADD_PROFESSIONAL',
        payload: { id: newId, businessId: state.business.id, ...form, avatarUrl: null, displayOrder: professionals.length + 1, isActive: true },
      });
      dispatch({
        type: 'SET_SCHEDULES',
        payload: { professionalId: newId, schedules: editSchedules.map(s => ({ ...s, professionalId: newId })) },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este profesional?')) {
      dispatch({ type: 'DELETE_PROFESSIONAL', payload: id });
    }
  };

  const toggleScheduleDay = (dayIndex) => {
    setEditSchedules(prev => prev.map((s, i) => i === dayIndex ? { ...s, isActive: !s.isActive } : s));
  };

  const updateSchedule = (dayIndex, field, value) => {
    setEditSchedules(prev => prev.map((s, i) => i === dayIndex ? { ...s, [field]: value } : s));
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1>Profesionales</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Agregar Profesional</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Profesional</th>
              <th>Especialidad</th>
              <th>Servicios</th>
              <th>Días</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {professionals.map(prof => {
              const profServices = professionalServices.filter(ps => ps.professionalId === prof.id);
              const profSchedule = schedules.filter(s => s.professionalId === prof.id && s.isActive);
              const srvNames = profServices.map(ps => services.find(s => s.id === ps.serviceId)?.name).filter(Boolean);
              const days = profSchedule.map(s => getDayName(s.dayOfWeek).substring(0, 3)).join(', ');
              return (
                <tr key={prof.id}>
                  <td>
                    <div className="flex items-center gap-sm">
                      <div className="avatar avatar-sm">{prof.name.split(' ').map(n => n[0]).join('')}</div>
                      <strong>{prof.name}</strong>
                    </div>
                  </td>
                  <td>{prof.specialty}</td>
                  <td><span className="text-sm text-secondary">{srvNames.length} servicios</span></td>
                  <td><span className="text-sm">{days}</span></td>
                  <td><span className={`badge ${prof.isActive ? 'badge-success' : 'badge-neutral'}`}>{prof.isActive ? 'Activo' : 'Inactivo'}</span></td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(prof)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(prof.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Profesional' : 'Agregar Profesional'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex flex-col gap-md">
                <div className="form-group">
                  <label className="form-label">Nombre <span className="required">*</span></label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Especialidad</label>
                  <input className="form-input" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ej: Barbero Senior" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                <h3 style={{ marginTop: 'var(--space-md)' }}>Horario de Trabajo</h3>
                <div className="schedule-grid">
                  {editSchedules.map((sch, idx) => (
                    <div key={idx} className="schedule-row">
                      <label>{getDayName(idx).substring(0, 3)}</label>
                      <button
                        className={`schedule-toggle ${sch.isActive ? 'active' : ''}`}
                        onClick={() => toggleScheduleDay(idx)}
                      />
                      {sch.isActive ? (
                        <>
                          <input className="form-input" type="time" value={sch.startTime} onChange={e => updateSchedule(idx, 'startTime', e.target.value)} />
                          <input className="form-input" type="time" value={sch.endTime} onChange={e => updateSchedule(idx, 'endTime', e.target.value)} />
                        </>
                      ) : (
                        <>
                          <span className="text-muted text-sm">—</span>
                          <span className="text-muted text-sm">—</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
