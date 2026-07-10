import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { appScreenTheme as theme, mockup } from '../styles';

import { apiService } from '../services/api.service';

import { StatusReservation } from '../types';

import { useSignalR } from '../hooks/useSignalR';

import { useAuth } from '../hooks/useAuth';



const loaderStyle = document.createElement('style');

loaderStyle.innerHTML = `

  @keyframes spin {

    0% { transform: rotate(0deg); }

    100% { transform: rotate(360deg); }

  }

`;

if (!document.getElementById('home-loader-style')) {

  loaderStyle.id = 'home-loader-style';

  document.head.appendChild(loaderStyle);

}



const confirmedStatuses = new Set([

  StatusReservation.Aceptada,

  StatusReservation.Creada,

  StatusReservation.Actualizada,

  StatusReservation.EnCompra,

  StatusReservation.EnTrayecto,

  StatusReservation.EnCocina,

]);



const parseLocalDateTime = (dateString, timeString) => {

  const [year, month, day] = dateString.split('-').map(Number);

  const [hours, minutes] = timeString.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0);

};



const isSameDay = (leftDate, rightDate) => (

  leftDate.getFullYear() === rightDate.getFullYear()

  && leftDate.getMonth() === rightDate.getMonth()

  && leftDate.getDate() === rightDate.getDate()

);



const formatHomeSubtitle = (todayCount) => {

  const now = new Date();

  const raw = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  const dateLabel = raw.charAt(0).toUpperCase() + raw.slice(1);

  if (todayCount === 0) return `${dateLabel} · no tienes sesiones hoy`;

  return `${dateLabel} · tienes ${todayCount} ${todayCount === 1 ? 'sesión' : 'sesiones'} hoy`;

};



const formatShortTime = (dateString, timeString) => {

  const dt = parseLocalDateTime(dateString, timeString);

  const now = new Date();

  const label = isSameDay(dt, now) ? 'Hoy' : new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric' }).format(dt);

  const time = new Intl.DateTimeFormat('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dt);

  return `${label} · ${time}`;

};



const getHoursToLabel = (reservation) => {

  const now = new Date();

  const reservationDate = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);

  const diffMs = reservationDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'En curso';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours < 1) return `En ${diffMins}m`;

  if (diffMins === 0) return `En ${diffHours}h`;

  return `En ${diffHours}h ${diffMins}m`;

};



const getFullName = (reservation) => {

  const names = [reservation.customerName, reservation.customerLastName].filter(Boolean);

  return names.length > 0 ? names.join(' ') : 'Cliente';

};



const getWeekCount = (reservations) => {

  const now = new Date();

  const day = now.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(now);

  start.setDate(now.getDate() + mondayOffset);

  start.setHours(0, 0, 0, 0);

  const end = new Date(start);

  end.setDate(start.getDate() + 7);

  return reservations.filter((reservation) => {

    const dt = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);

    return dt >= start && dt < end;

  }).length;

};



const HomeScreen = () => {

  const [loading, setLoading] = useState(true);

  const [nextReservation, setNextReservation] = useState(null);

  const [confirmedReservations, setConfirmedReservations] = useState([]);

  const [requestReservations, setRequestReservations] = useState([]);

  const { chefData } = useAuth();

  const chefId = chefData?.chefId;

  const navigate = useNavigate();



  const loadReservations = useCallback(async () => {

    if (!chefId) return;



    try {

      setLoading(true);

      const response = await apiService.listReservationByChefId(chefId);

      const now = new Date();

      const todayStart = new Date(now);

      todayStart.setHours(0, 0, 0, 0);



      if (!response.success || !response.data) {

        setConfirmedReservations([]);

        setRequestReservations([]);

        setNextReservation(null);

        return;

      }



      const confirmed = response.data

        .filter((reservation) => confirmedStatuses.has(reservation.statusReservation))

        .filter((reservation) => parseLocalDateTime(reservation.dateReservation, reservation.hourReservation).getTime() >= todayStart.getTime())

        .sort((a, b) => parseLocalDateTime(a.dateReservation, a.hourReservation) - parseLocalDateTime(b.dateReservation, b.hourReservation));



      setConfirmedReservations(confirmed);

      setNextReservation(confirmed.find((r) => parseLocalDateTime(r.dateReservation, r.hourReservation) >= now) || confirmed[0] || null);



      const dateFilter = now.toISOString().split('T')[0];

      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5);

      const pendingFilters = { dateFilter, timeFilter, Page: 1, RecordsPerPage: 50 };



      const [requestsResponse, suscriptionsResponse, eventsResponse] = await Promise.all([

        apiService.getPendingReservations(pendingFilters),

        apiService.getPendingReservationSuscription(pendingFilters),

        apiService.getPendingEventReservation(pendingFilters),

      ]);



      const filterPending = (item, status) => item.chefId === null && (

        status === StatusReservation.Creada

        || status === StatusReservation.Reprogramada

        || status === StatusReservation.ReasignacionCocinera

      );



      const normalRequests = requestsResponse.success && requestsResponse.data

        ? requestsResponse.data.filter((r) => filterPending(r, r.statusReservation)) : [];

      const subscriptionRequests = suscriptionsResponse.success && suscriptionsResponse.data

        ? suscriptionsResponse.data.filter((r) => filterPending(r, r.suscriptionStatus)) : [];

      const eventRequests = eventsResponse.success && eventsResponse.data

        ? eventsResponse.data.filter((r) => filterPending(r, r.statusEvent)) : [];



      setRequestReservations([...normalRequests, ...subscriptionRequests, ...eventRequests]);

    } catch (error) {

      console.error('Error loading reservations:', error);

      setConfirmedReservations([]);

      setRequestReservations([]);

      setNextReservation(null);

    } finally {

      setLoading(false);

    }

  }, [chefId]);



  useEffect(() => {

    if (chefId) void loadReservations();

  }, [chefId, loadReservations]);



  useSignalR(loadReservations, { playSound: false });



  const todayCount = useMemo(() => confirmedReservations.filter((reservation) => {

    const dt = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);

    return isSameDay(dt, new Date());

  }).length, [confirmedReservations]);



  const weekCount = useMemo(() => getWeekCount(confirmedReservations), [confirmedReservations]);

  const rating = Number(chefData?.rating || 0).toFixed(1);



  if (loading) {

    return (

      <div style={styles.loadingContainer}>

        <div style={styles.loader} />

      </div>

    );

  }



  return (

    <div className="coci-page-wrap">

      <h1 style={mockup.screenTitle}>¡Hola, {chefData?.firstName || 'Chef'}!</h1>

      <p style={{ ...mockup.screenSubtitle, marginBottom: 22 }}>{formatHomeSubtitle(todayCount)}</p>



      <div style={styles.statsGrid}>

        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg,#E4F6EC,#C4EBD3)' }}>

          <div style={{ ...styles.statLabel, color: '#0B855C' }}>Esta semana</div>

          <div style={{ ...styles.statValue, color: '#0B7A54' }}>{weekCount} {weekCount === 1 ? 'reserva' : 'reservas'}</div>

        </div>

        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg,#FFF3D6,#FFE49E)' }}>

          <div style={{ ...styles.statLabel, color: '#B07D12' }}>Calificación</div>

          <div style={{ ...styles.statValue, color: '#96690C' }}>{rating} ★</div>

        </div>

        <div style={{ ...styles.statCard, background: 'linear-gradient(135deg,#EAF2FE,#CFE0FB)' }}>

          <div style={{ ...styles.statLabel, color: '#1763C9' }}>Bonos mes</div>

          <div style={{ ...styles.statValue, color: '#12539F' }}>—</div>

        </div>

      </div>



      {nextReservation && (

        <>

          <div style={mockup.sectionLabel}>Tu próxima reserva</div>

          <button

            type="button"

            style={styles.nextHeroCard}

            onClick={() => navigate(`/reservation/${nextReservation.id}`, {

              state: { source: 'home', reservationData: nextReservation },

            })}

          >

            <div style={styles.nextHeroGlow} />

            <div style={{ position: 'relative' }}>

              <div style={styles.nextHeroTop}>

                <span style={styles.nextHeroTime}>{formatShortTime(nextReservation.dateReservation, nextReservation.hourReservation)}</span>

                <span style={styles.nextHeroCountdown}>{getHoursToLabel(nextReservation)}</span>

              </div>

              <div style={styles.nextHeroName}>{getFullName(nextReservation)}</div>

              <div style={styles.nextHeroMeta}>

                {nextReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'} · {nextReservation.direction || 'Sin dirección'}

              </div>

              <span style={styles.nextHeroCta}>Ver detalle →</span>

            </div>

          </button>

        </>

      )}



      <div className="coci-access-grid" style={styles.accessGrid}>

        <button type="button" style={styles.accessCard} onClick={() => navigate('/reservation', { state: { defaultTab: 'confirmed' } })}>

          <div style={{ ...styles.accessIcon, background: 'linear-gradient(135deg,#FFE7DD,#FFC8B4)' }}>

            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#F2542D" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">

              <rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" />

            </svg>

          </div>

          <div style={styles.accessText}>

            <div style={styles.accessTitle}>Mis reservas</div>

            <div style={styles.accessSub}>{weekCount} esta semana</div>

          </div>

        </button>



        <button type="button" style={styles.accessCard} onClick={() => navigate('/reservation?tab=requests', { state: { defaultTab: 'requests' } })}>

          <div style={{ ...styles.accessIcon, background: 'linear-gradient(135deg,#E7EEFA,#C6DBF6)' }}>

            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1763C9" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">

              <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 6h13l3.5 6v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6z" />

            </svg>

          </div>

          <div style={styles.accessText}>

            <div style={styles.accessTitleRow}>

              <span style={styles.accessTitle}>Solicitudes</span>

              {requestReservations.length > 0 && (

                <span style={styles.badge}>{requestReservations.length}</span>

              )}

            </div>

            <div style={styles.accessSub}>Por revisar</div>

          </div>

        </button>

      </div>



      {/* Academia Cociname — oculto por el momento
      <div style={styles.academyCard}>
        <div style={styles.academyGlow} />
        <div style={{ position: 'relative' }}>
          <div style={styles.academyTitleRow}>
            <span style={{ fontSize: 20 }}>🎓</span>
            <span style={styles.academyTitle}>Academia Cociname</span>
          </div>
          <div style={styles.academyDesc}>Aprende, suma puntos y desbloquea bonos de plata 🪙</div>
          <div style={styles.academyProgressRow}>
            <div style={styles.academyTrack}><div style={styles.academyFill} /></div>
            <span style={styles.academyLevel}>Nivel 3</span>
          </div>
        </div>
      </div>
      */}

    </div>

  );

};



const styles = {

  loadingContainer: {

    display: 'flex',

    flex: 1,

    justifyContent: 'center',

    alignItems: 'center',

    minHeight: '60vh',

  },

  loader: {

    width: 40,

    height: 40,

    border: `4px solid ${theme.spinnerBorder}`,

    borderTop: `4px solid ${theme.spinnerAccent}`,

    borderRadius: '50%',

    animation: 'spin 1s linear infinite',

  },

  statsGrid: {

    display: 'grid',

    gridTemplateColumns: 'repeat(3, 1fr)',

    gap: 12,

    marginBottom: 26,

  },

  statCard: {

    borderRadius: 18,

    padding: '15px 14px',

  },

  statLabel: {

    fontSize: 11.5,

    fontWeight: 700,

  },

  statValue: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 19,

    marginTop: 4,

    lineHeight: 1.1,

  },

  nextHeroCard: {

    width: '100%',

    textAlign: 'left',

    border: 'none',

    cursor: 'pointer',

    background: theme.primaryGradient,

    borderRadius: theme.cardRadiusLg,

    padding: 24,

    color: '#fff',

    boxShadow: theme.primaryShadow,

    position: 'relative',

    overflow: 'hidden',

    marginBottom: 26,

  },

  nextHeroGlow: {

    position: 'absolute',

    right: -34,

    top: -34,

    width: 130,

    height: 130,

    borderRadius: '50%',

    background: 'rgba(255,255,255,0.12)',

  },

  nextHeroTop: {

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 16,

  },

  nextHeroTime: {

    display: 'inline-flex',

    alignItems: 'center',

    gap: 7,

    background: 'rgba(255,255,255,0.2)',

    borderRadius: 999,

    padding: '6px 13px',

    fontFamily: theme.fontHeading,

    fontWeight: 700,

    fontSize: 13,

  },

  nextHeroCountdown: {

    fontSize: 12.5,

    color: 'rgba(255,255,255,0.85)',

    fontWeight: 700,

  },

  nextHeroName: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 22,

    letterSpacing: -0.4,

  },

  nextHeroMeta: {

    fontSize: 14,

    color: 'rgba(255,255,255,0.85)',

    marginTop: 6,

  },

  nextHeroCta: {

    display: 'inline-flex',

    alignItems: 'center',

    gap: 8,

    marginTop: 20,

    background: '#fff',

    color: theme.accentDark,

    borderRadius: 999,

    padding: '12px 20px',

    fontFamily: theme.fontHeading,

    fontWeight: 700,

    fontSize: 14,

  },

  accessGrid: {

    display: 'grid',

    gridTemplateColumns: '1fr',

    gap: 14,

    marginBottom: 26,

  },

  accessCard: {

    display: 'flex',

    alignItems: 'center',

    gap: 15,

    textAlign: 'left',

    background: '#fff',

    boxShadow: theme.cardShadow,

    border: 'none',

    borderRadius: 20,

    padding: 18,

    cursor: 'pointer',

    width: '100%',

  },

  accessIcon: {

    width: 44,

    height: 44,

    borderRadius: 14,

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    flexShrink: 0,

  },

  accessText: { flex: 1, minWidth: 0 },

  accessTitleRow: {

    display: 'flex',

    alignItems: 'center',

    gap: 8,

  },

  accessTitle: {

    fontFamily: theme.fontHeading,

    fontWeight: 700,

    fontSize: 15.5,

    color: theme.textPrimary,

  },

  accessSub: {

    fontSize: 13,

    color: theme.textMuted,

    marginTop: 2,

  },

  badge: {

    fontSize: 11,

    fontWeight: 700,

    color: '#fff',

    background: theme.accent,

    borderRadius: 999,

    padding: '2px 8px',

  },

  academyCard: {

    width: '100%',

    textAlign: 'left',

    border: 'none',

    borderRadius: 22,

    padding: 20,

    background: 'linear-gradient(135deg,#7A4FD0 0%,#5B33B0 100%)',

    color: '#fff',

    position: 'relative',

    overflow: 'hidden',

    boxShadow: '0 14px 30px rgba(122,79,208,0.28)',

    marginBottom: 8,

  },

  academyGlow: {

    position: 'absolute',

    right: -26,

    bottom: -30,

    width: 120,

    height: 120,

    borderRadius: '50%',

    background: 'rgba(255,255,255,0.1)',

  },

  academyTitleRow: {

    display: 'flex',

    alignItems: 'center',

    gap: 8,

    marginBottom: 9,

  },

  academyTitle: {

    fontFamily: theme.fontHeading,

    fontWeight: 800,

    fontSize: 17,

  },

  academyDesc: {

    fontSize: 13,

    color: 'rgba(255,255,255,0.86)',

    lineHeight: 1.5,

    marginBottom: 14,

  },

  academyProgressRow: {

    display: 'flex',

    alignItems: 'center',

    gap: 10,

  },

  academyTrack: {

    flex: 1,

    height: 8,

    borderRadius: 999,

    background: 'rgba(255,255,255,0.22)',

    overflow: 'hidden',

  },

  academyFill: {

    width: '62%',

    height: '100%',

    background: '#FFD264',

    borderRadius: 999,

  },

  academyLevel: {

    fontSize: 12,

    fontWeight: 700,

    fontFamily: theme.fontHeading,

    whiteSpace: 'nowrap',

  },

};



export default HomeScreen;

