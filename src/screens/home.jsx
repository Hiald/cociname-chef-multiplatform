import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../hooks/useAuth';
import enCursoIcon from '../assets/images/home/en-curso.png';
import calendarIcon from '../assets/images/home/calendario.png';
import clockIcon from '../assets/images/home/clock.png';
import listIcon from '../assets/images/home/lista.png';
import checkIcon from '../assets/images/home/check.png';
import requestIcon from '../assets/images/home/solicitud.png';
import profileBlackIcon from '../assets/images/home/perfil-black.png';

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

const isSameDay = (leftDate, rightDate) => {
  if (!leftDate || !rightDate) return false;
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
};

const formatTodayLabel = (date) => {
  const day = new Intl.DateTimeFormat('es-PE', { day: '2-digit', timeZone: 'UTC' }).format(date);
  const month = new Intl.DateTimeFormat('es-PE', { month: 'short', timeZone: 'UTC' }).format(date);
  return `HOY, ${day} ${month}`.toUpperCase();
};

const formatTimeRange = (reservation) => {
  const startDateTime = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
  const endDateTime = new Date(startDateTime.getTime() + (reservation.preparationTime || 0) * 60 * 60 * 1000);

  const formatter = new Intl.DateTimeFormat('es-PE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatter.format(startDateTime).replace(/\s/g, ' ')} a ${formatter.format(endDateTime).replace(/\s/g, ' ')}`;
};

const getFullName = (reservation) => {
  const names = [reservation.customerName, reservation.customerLastName].filter(Boolean);
  return names.length > 0 ? names.join(' ') : 'Cliente';
};

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [, setReservations] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
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
      if (!response.success || !response.data) {
        setReservations([]);
        setConfirmedReservations([]);
        setRequestReservations([]);
        setActiveReservation(null);
        return;
      }

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const allReservations = response.data;
      setReservations(allReservations);

      const sameDayConfirmed = allReservations
        .filter((reservation) => {
          if (!confirmedStatuses.has(reservation.statusReservation)) return false;
          const reservationDateTime = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
          return isSameDay(reservationDateTime, now) && reservationDateTime.getTime() >= todayStart.getTime();
        })
        .sort((left, right) => {
          const leftTime = parseLocalDateTime(left.dateReservation, left.hourReservation).getTime();
          const rightTime = parseLocalDateTime(right.dateReservation, right.hourReservation).getTime();
          return leftTime - rightTime;
        });

      const confirmed = allReservations
        .filter((reservation) => {
          if (!confirmedStatuses.has(reservation.statusReservation)) return false;
          const reservationDateTime = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
          return reservationDateTime.getTime() >= todayStart.getTime();
        })
        .sort((left, right) => {
          const leftTime = parseLocalDateTime(left.dateReservation, left.hourReservation).getTime();
          const rightTime = parseLocalDateTime(right.dateReservation, right.hourReservation).getTime();
          return leftTime - rightTime;
        });

      const activeReservationCandidate = sameDayConfirmed.length > 0
        ? sameDayConfirmed[0]
        : null;

      setActiveReservation(activeReservationCandidate);
      setConfirmedReservations(confirmed);

      const dateFilter = now.toISOString().split('T')[0];
      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5);

      const [requestsResponse, suscriptionsResponse] = await Promise.all([
        apiService.getPendingReservations({ dateFilter, timeFilter }),
        apiService.getPendingReservationSuscription({ dateFilter, timeFilter }),
      ]);

      const normalRequests = requestsResponse.success && requestsResponse.data
        ? requestsResponse.data.filter((reservation) => (
            reservation.chefId === null &&
            (reservation.statusReservation === StatusReservation.Creada ||
              reservation.statusReservation === StatusReservation.Reprogramada ||
              reservation.statusReservation === StatusReservation.ReasignacionCocinera)
          ))
        : [];

      const subscriptionRequests = suscriptionsResponse.success && suscriptionsResponse.data
        ? suscriptionsResponse.data.filter((reservation) => (
            reservation.chefId === null &&
            (reservation.suscriptionStatus === StatusReservation.Creada ||
              reservation.suscriptionStatus === StatusReservation.Reprogramada ||
              reservation.suscriptionStatus === StatusReservation.ReasignacionCocinera)
          ))
        : [];

      setRequestReservations([...normalRequests, ...subscriptionRequests]);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setReservations([]);
      setConfirmedReservations([]);
      setRequestReservations([]);
      setActiveReservation(null);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    if (chefId) {
      void loadReservations();
    }
  }, [chefId, loadReservations]);

  useSignalR(loadReservations, { playSound: false });

  const currentDateLabel = activeReservation
    ? formatTodayLabel(new Date())
    : null;

  const todayConfirmedCount = confirmedReservations.filter((reservation) => {
    const reservationDateTime = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
    return isSameDay(reservationDateTime, new Date());
  }).length;

  const confirmedCount = confirmedReservations.length;
  const requestsCount = requestReservations.length;

  const handleGoToReservations = (tab = 'confirmed') => {
    navigate(`/reservation?tab=${tab}`, {
      state: { defaultTab: tab },
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <div style={styles.header}>
          <h1 style={styles.greeting}>¡Hola, {chefData?.firstName || 'Chef'}!</h1>
          <p style={styles.message}>
            {todayConfirmedCount > 0
              ? `Hoy tienes ${todayConfirmedCount} ${todayConfirmedCount === 1 ? 'reserva confirmada' : 'reservas confirmadas'}`
              : 'Hoy no tienes reservas confirmadas'}
          </p>
        </div>

        {activeReservation && (
          <div style={styles.activeCardWrap}>
            <div style={styles.activeCardHeader}>
              <div style={styles.activeBadge}>
                <img src={enCursoIcon} alt="En curso" style={styles.activeBadgeIcon} />
                <span style={styles.activeBadgeText}>EN CURSO</span>
              </div>
              <span style={styles.reservationDate}>{currentDateLabel}</span>
            </div>

            <div style={styles.activeCardBody}>
              <div style={styles.customerRow}>
                <img src={profileBlackIcon} alt="Perfil" style={styles.customerIcon} />
                <span style={styles.customerName}>{getFullName(activeReservation)}</span>
              </div>

              <p style={styles.customerAddress}>{activeReservation.direction}</p>

              <div style={styles.detailRows}>
                <div style={styles.detailRow}>
                  <img src={clockIcon} alt="Hora" style={styles.detailIcon} />
                  <span style={styles.detailText}>{formatTimeRange(activeReservation)}</span>
                </div>

                <div style={styles.detailRow}>
                  <img src={listIcon} alt="Compras" style={styles.detailIcon} />
                  <span style={styles.detailText}>
                    {activeReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}
                  </span>
                </div>
              </div>

              <button
                style={styles.detailsButton}
                onClick={() => navigate(`/reservation/${activeReservation.id}`, {
                  state: {
                    isActive: true,
                    source: 'home',
                    reservationData: activeReservation,
                  },
                })}
              >
                Ver Detalles
              </button>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <div style={styles.sectionTitleRow}>
            <img src={calendarIcon} alt="Mis reservas" style={styles.sectionTitleIcon} />
            <h2 style={styles.sectionTitle}>Mis Reservas</h2>
          </div>

          <button style={styles.summaryCardConfirmed} onClick={() => handleGoToReservations('confirmed')}>
            <div style={styles.summaryCardLeft}>
              <div style={styles.summaryIconWrapConfirmed}>
                <img src={checkIcon} alt="Confirmadas" style={styles.summaryIcon} />
              </div>
              <p style={styles.summaryText}>
                Tienes <strong>{confirmedCount}</strong> {confirmedCount === 1 ? 'reserva confirmada' : 'reservas confirmadas'}.
              </p>
            </div>
          </button>

          <button style={styles.summaryCardRequests} onClick={() => handleGoToReservations('requests')}>
            <div style={styles.summaryCardLeft}>
              <div style={styles.summaryIconWrapRequests}>
                <img src={requestIcon} alt="Solicitudes" style={styles.summaryIcon} />
              </div>
              <p style={styles.summaryText}>
                Tienes <strong>{requestsCount}</strong> {requestsCount === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}.
              </p>
            </div>
          </button>

          <button style={styles.primaryButton} onClick={() => handleGoToReservations('confirmed')}>
            Ver Reservas
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
    background: 'linear-gradient(180deg, #F3F8FC 0%, #EEF5FB 100%)',
  },
  contentContainer: {
    padding: spacing.medium,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    height: '100vh',
  },
  loader: {
    width: 40,
    height: 40,
    border: '4px solid #E8EEF5',
    borderTop: '4px solid #FF4336',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: spacing.large,
  },
  greeting: {
    fontSize: 30,
    fontWeight: 800,
    color: '#1A1F24',
    margin: '0 0 6px 0',
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: '22px',
    margin: 0,
  },
  activeCardWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.medium,
    boxShadow: '0 12px 28px rgba(44, 72, 88, 0.10)',
    marginBottom: spacing.large,
  },
  activeCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
    gap: 8,
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    backgroundColor: '#E9F5FF',
    border: '1px solid #7BC8FF',
  },
  activeBadgeIcon: {
    width: 14,
    height: 14,
    objectFit: 'contain',
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: 800,
    color: '#2D8DFF',
    letterSpacing: 0.3,
  },
  reservationDate: {
    fontSize: 12,
    fontWeight: 700,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  activeCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  customerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  customerIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
    flexShrink: 0,
  },
  customerName: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1A1F24',
    lineHeight: 1.2,
  },
  customerAddress: {
    fontSize: 14,
    color: '#4B5563',
    margin: 0,
    lineHeight: '20px',
  },
  detailRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
    flexShrink: 0,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  detailsButton: {
    marginTop: 6,
    width: '100%',
    border: 'none',
    borderRadius: 22,
    padding: '13px 16px',
    background: '#FFECEB',
    color: '#FF4336',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.medium,
  },
  sectionTitleIcon: {
    width: 18,
    height: 18,
    objectFit: 'contain',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#1A1F24',
    margin: 0,
  },
  summaryCardConfirmed: {
    width: '100%',
    border: '1px solid #00BA96',
    backgroundColor: '#F2FBFA',
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 10,
    cursor: 'pointer',
    textAlign: 'left',
  },
  summaryCardRequests: {
    width: '100%',
    border: '1px solid #FFB125',
    backgroundColor: '#FFF2DA',
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 14,
    cursor: 'pointer',
    textAlign: 'left',
  },
  summaryCardLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrapConfirmed: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#E8FFF1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryIconWrapRequests: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F4ECFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  summaryText: {
    margin: 0,
    fontSize: 14,
    lineHeight: '20px',
    color: '#1F2937',
  },
  primaryButton: {
    width: '100%',
    border: 'none',
    borderRadius: 22,
    padding: '16px 18px',
    background: 'linear-gradient(97.22deg, #FF6833 2.34%, #FF4336 100%)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(255, 67, 54, 0.25)',
  },
};

export default HomeScreen;