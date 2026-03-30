// ============================================
// Motor de Disponibilidad
// ============================================
import { timeToMinutes, addMinutes, getLocalDayOfWeek, isToday } from './dateUtils';

/**
 * Calcula los slots disponibles para un profesional+servicio en una fecha.
 */
export function calculateAvailableSlots({
  professionalId,
  serviceId,
  date, // 'YYYY-MM-DD'
  schedules,
  appointments,
  services,
  professionalServices,
  slotInterval = 30,
}) {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = getLocalDayOfWeek(dateObj);

  // 1. Obtener el horario del profesional para este día
  const schedule = schedules.find(
    (s) => s.professionalId === professionalId && s.dayOfWeek === dayOfWeek && s.isActive
  );

  if (!schedule || !schedule.startTime || !schedule.endTime) {
    return [];
  }

  // 2. Obtener la duración del servicio
  const ps = professionalServices.find(
    (ps) => ps.professionalId === professionalId && ps.serviceId === serviceId
  );
  const service = services.find((s) => s.id === serviceId);
  if (!service) return [];

  const duration = (ps && ps.customDuration) || service.durationMinutes;

  // 3. Generar todos los slots posibles
  const allSlots = [];
  const scheduleStart = timeToMinutes(schedule.startTime);
  const scheduleEnd = timeToMinutes(schedule.endTime);
  const breakStart = schedule.breakStart ? timeToMinutes(schedule.breakStart) : null;
  const breakEnd = schedule.breakEnd ? timeToMinutes(schedule.breakEnd) : null;

  for (let cursor = scheduleStart; cursor + duration <= scheduleEnd; cursor += slotInterval) {
    const slotEnd = cursor + duration;

    // Verificar si toca el descanso
    if (breakStart !== null && breakEnd !== null) {
      if (cursor < breakEnd && slotEnd > breakStart) {
        continue; // El slot se solapa con el descanso
      }
    }

    allSlots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(slotEnd),
      startMinutes: cursor,
      endMinutes: slotEnd,
    });
  }

  // 4. Obtener citas existentes que bloquean
  const existingAppointments = appointments.filter(
    (a) =>
      a.professionalId === professionalId &&
      a.appointmentDate === date &&
      (a.status === 'pendiente' || a.status === 'confirmada')
  );

  // 5. Filtrar slots ocupados
  const availableSlots = allSlots.filter((slot) => {
    for (const apt of existingAppointments) {
      const aptStart = timeToMinutes(apt.startTime);
      const aptEnd = timeToMinutes(apt.endTime);
      if (slot.startMinutes < aptEnd && slot.endMinutes > aptStart) {
        return false; // Colisión
      }
    }
    return true;
  });

  // 6. Si es hoy, filtrar slots pasados
  if (isToday(date)) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return availableSlots.filter((slot) => slot.startMinutes > nowMinutes);
  }

  return availableSlots;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Verifica si un profesional trabaja en una fecha dada.
 */
export function professionalWorksOnDate(professionalId, date, schedules) {
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = getLocalDayOfWeek(dateObj);
  return schedules.some(
    (s) => s.professionalId === professionalId && s.dayOfWeek === dayOfWeek && s.isActive
  );
}
