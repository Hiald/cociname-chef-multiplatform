/** Zona horaria de negocio Cociname (Perú). */
export const PERU_TIMEZONE = 'America/Lima';

type PeruNowParts = {
  dateKey: string;
  timeKey: string;
  hour: number;
  minute: number;
};

/**
 * Extrae fecha/hora actuales en America/Lima, independientes del TZ del navegador.
 */
export function getPeruNowParts(now: Date = new Date()): PeruNowParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  // Algunos motores reportan medianoche como "24"
  const hourRaw = parts.hour === '24' ? '00' : parts.hour;
  const hour = Number(hourRaw);
  const minute = Number(parts.minute);

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    timeKey: `${hourRaw.padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    hour: Number.isNaN(hour) ? 0 : hour,
    minute: Number.isNaN(minute) ? 0 : minute,
  };
}

/** Normaliza a YYYY-MM-DD (soporta ISO completo). */
export function normalizeDateKey(dateString?: string | Date | null): string | null {
  if (!dateString) return null;

  if (dateString instanceof Date) {
    if (Number.isNaN(dateString.getTime())) return null;
    return getPeruNowParts(dateString).dateKey;
  }

  const raw = String(dateString).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** Normaliza hora a HH:mm. */
export function normalizeTimeKey(timeString?: string | null): string {
  if (!timeString) return '00:00';
  const match = String(timeString).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '00:00';
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * True si la reserva ya pasó según el día en Perú.
 * Criterio: fecha local de la reserva < día actual en America/Lima.
 */
export function isReservationPastInPeru(
  dateString?: string | Date | null,
  _timeString?: string | null,
  now: Date = new Date(),
): boolean {
  const reservationDay = normalizeDateKey(dateString);
  if (!reservationDay) return false;
  const { dateKey: todayPeru } = getPeruNowParts(now);
  return reservationDay < todayPeru;
}

/**
 * True si la reserva es de hoy o futura según el día en Perú.
 */
export function isReservationUpcomingInPeru(
  dateString?: string | Date | null,
  timeString?: string | null,
  now: Date = new Date(),
): boolean {
  const reservationDay = normalizeDateKey(dateString);
  if (!reservationDay) return false;
  return !isReservationPastInPeru(reservationDay, timeString, now);
}

/** Fecha y hora actuales en Perú para filtros de API. */
export function getPeruDateTimeFilters(now: Date = new Date()): { dateFilter: string; timeFilter: string } {
  const peru = getPeruNowParts(now);
  return {
    dateFilter: peru.dateKey,
    timeFilter: peru.timeKey,
  };
}
