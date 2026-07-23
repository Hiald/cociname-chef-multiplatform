import React, { useEffect, useMemo, useState } from 'react';
import { appScreenTheme as theme } from '../../styles';
import { getPeruNowParts, normalizeDateKey } from '../../utils/peruDate';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const toDateKey = (year, monthIndex, day) => (
  `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

/**
 * Calendario de Mis reservas (mockup Cociname).
 * Agrupa solo por dateReservation (DateReservation).
 */
export const ReservationsCalendar = ({
  reservations = [],
  onSelectReservation,
  renderDayReservations,
}) => {
  const peruToday = getPeruNowParts();
  const [year, setYear] = useState(() => Number(peruToday.dateKey.slice(0, 4)));
  const [monthIndex, setMonthIndex] = useState(() => Number(peruToday.dateKey.slice(5, 7)) - 1);
  const [selectedDateKey, setSelectedDateKey] = useState(peruToday.dateKey);

  const byDateKey = useMemo(() => {
    const map = new Map();
    reservations.forEach((item) => {
      const key = normalizeDateKey(item.dateReservation);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [reservations]);

  useEffect(() => {
    // Si cambia el set de reservas, mantener día seleccionado si sigue existiendo; si no, hoy del mes visible.
    if (!selectedDateKey) {
      setSelectedDateKey(peruToday.dateKey);
    }
  }, [reservations]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const result = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      result.push({ key: `blank-${i}`, type: 'blank' });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = toDateKey(year, monthIndex, day);
      const dayReservations = byDateKey.get(dateKey) || [];
      const isToday = dateKey === peruToday.dateKey;
      const isSelected = dateKey === selectedDateKey;
      const hasRes = dayReservations.length > 0;

      result.push({
        key: dateKey,
        type: 'day',
        day,
        dateKey,
        hasRes,
        isToday,
        isSelected,
        count: dayReservations.length,
      });
    }

    return result;
  }, [year, monthIndex, byDateKey, peruToday.dateKey, selectedDateKey]);

  const selectedReservations = byDateKey.get(selectedDateKey) || [];

  const goPrevMonth = () => {
    if (monthIndex === 0) {
      setYear((y) => y - 1);
      setMonthIndex(11);
      return;
    }
    setMonthIndex((m) => m - 1);
  };

  const goNextMonth = () => {
    if (monthIndex === 11) {
      setYear((y) => y + 1);
      setMonthIndex(0);
      return;
    }
    setMonthIndex((m) => m + 1);
  };

  const handleDayClick = (cell) => {
    if (cell.type !== 'day') return;
    setSelectedDateKey(cell.dateKey);
  };

  const getDayButtonStyle = (cell) => {
    if (cell.type === 'blank') return styles.dayBlank;

    if (cell.isToday) {
      return {
        ...styles.dayButton,
        ...styles.dayToday,
        ...(cell.isSelected && !cell.isToday ? {} : {}),
        boxShadow: cell.isSelected ? '0 0 0 2px rgba(242,84,45,0.35)' : undefined,
      };
    }

    if (cell.isSelected) {
      return {
        ...styles.dayButton,
        ...(cell.hasRes ? styles.dayWithRes : styles.dayNormal),
        boxShadow: '0 0 0 2px #1763C9',
      };
    }

    if (cell.hasRes) {
      return { ...styles.dayButton, ...styles.dayWithRes };
    }

    return { ...styles.dayButton, ...styles.dayNormal };
  };

  const selectedLabel = useMemo(() => {
    if (!selectedDateKey) return '';
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d, 12, 0, 0);
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dt);
  }, [selectedDateKey]);

  return (
    <div>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.monthTitle}>{MONTH_NAMES[monthIndex]} {year}</span>
          <div style={styles.navRow}>
            <button type="button" style={styles.navBtn} onClick={goPrevMonth} aria-label="Mes anterior">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button type="button" style={styles.navBtn} onClick={goNextMonth} aria-label="Mes siguiente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div style={styles.grid}>
          {WEEKDAYS.map((label) => (
            <div key={label} style={styles.weekday}>{label}</div>
          ))}
          {cells.map((cell) => {
            if (cell.type === 'blank') {
              return <div key={cell.key} style={styles.dayBlank} />;
            }

            const dotColor = cell.isToday ? '#fff' : '#1763C9';

            return (
              <button
                key={cell.key}
                type="button"
                style={getDayButtonStyle(cell)}
                onClick={() => handleDayClick(cell)}
              >
                <span>{cell.day}</span>
                {cell.hasRes ? <span style={{ ...styles.dot, background: dotColor }} /> : null}
              </button>
            );
          })}
        </div>

        <div style={styles.legend}>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: theme.accent }} />
            Hoy
          </span>
          <span style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: theme.link }} />
            Con reserva
          </span>
        </div>
      </div>

      <div style={styles.daySection}>
        <div style={styles.daySectionTitle}>
          {selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)}
        </div>
        {selectedReservations.length === 0 ? (
          <p style={styles.dayEmpty}>No hay reservas este día.</p>
        ) : (
          renderDayReservations
            ? renderDayReservations(selectedReservations)
            : (
              <div style={styles.dayListFallback}>
                {selectedReservations.map((item) => (
                  <button
                    key={`${item.tipo || 'reserva'}-${item.id}`}
                    type="button"
                    style={styles.fallbackBtn}
                    onClick={() => onSelectReservation?.(item)}
                  >
                    {item.customerName
                      ? `${item.customerName}${item.customerLastName ? ` ${item.customerLastName}` : ''}`
                      : 'Cliente'} · {item.hourReservation || ''}
                  </button>
                ))}
              </div>
            )
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#fff',
    borderRadius: 22,
    padding: 20,
    boxShadow: '0 6px 20px rgba(27,52,92,0.07)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 18,
    color: theme.textPrimary,
  },
  navRow: {
    display: 'flex',
    gap: 8,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: '#F6F1EC',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#5B6577',
    cursor: 'pointer',
    padding: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 6,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: '#B0B8C6',
    paddingBottom: 6,
  },
  dayBlank: {
    height: 46,
  },
  dayButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    background: 'transparent',
  },
  dayNormal: {
    fontWeight: 600,
    color: '#3B4658',
  },
  dayWithRes: {
    fontWeight: 700,
    color: '#1763C9',
    background: '#EAF2FE',
  },
  dayToday: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    color: '#fff',
    background: theme.accent,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginTop: 3,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid #F1EAE3',
    fontSize: 12,
    color: '#8089A0',
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  daySection: {
    marginTop: 18,
  },
  daySectionTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#9AA3B5',
    marginBottom: 10,
  },
  dayEmpty: {
    margin: 0,
    fontSize: 14,
    color: theme.textMuted,
    padding: '8px 2px',
  },
  dayListFallback: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  fallbackBtn: {
    textAlign: 'left',
    border: 'none',
    borderRadius: 16,
    background: '#fff',
    padding: '14px 16px',
    boxShadow: theme.cardShadow,
    cursor: 'pointer',
    fontWeight: 600,
  },
};

export default ReservationsCalendar;
