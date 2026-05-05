import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useSignalR } from '../hooks/useSignalR';
import { formatearFechaConDia } from '../utils/formatters';
import profileBlackIcon from '../assets/images/reservas/perfil-black.png';
import clockIcon from '../assets/images/reservas/clock.png';
import listIcon from '../assets/images/reservas/list.png';
import mapIcon from '../assets/images/reservas/map.png';
import rightIcon from '../assets/images/reservas/right.png';
import proximaIcon from '../assets/images/reservas/proxima.png';
import calendarIcon from '../assets/images/home/calendario.png';
import pastIcon from '../assets/images/sidebar/pasadas.png';

const confirmedStatuses = new Set([
  StatusReservation.Aceptada,
  StatusReservation.Creada,
  StatusReservation.Actualizada,
  StatusReservation.EnCompra,
  StatusReservation.EnTrayecto,
  StatusReservation.EnCocina,
]);

const loaderStyle = document.createElement('style');
loaderStyle.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (!document.getElementById('reservation-loader-style')) {
  loaderStyle.id = 'reservation-loader-style';
  document.head.appendChild(loaderStyle);
}

const parseLocalDateTime = (dateString, timeString = '00:00') => {
  const [year, month, day] = String(dateString).split('-').map(Number);
  const [hours, minutes] = String(timeString).split(':').map(Number);
  return new Date(year, month - 1, day, Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);
};

const formatCustomerName = (firstName, lastName, isRequest) => {
  if (!firstName) return 'Cliente';
  if (!isRequest) return `${firstName} ${lastName || ''}`.trim();
  return `${firstName} ${lastName ? `${lastName.charAt(0)}.` : ''}`.trim();
};

const formatReservationDateTime = (dateReservation, hourReservation) => {
  if (!dateReservation) return 'Fecha y hora por confirmar';
  return `${formatearFechaConDia(dateReservation)} - ${hourReservation || 'Hora no especificada'}`;
};

const getTypeLabel = (reservation) => {
  return reservation.tipo === 'suscripcion' ? 'SUSCRIPCION' : 'RESERVA';
};

const getHoursToLabel = (reservation) => {
  const now = new Date();
  const reservationDate = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
  const diffMs = reservationDate.getTime() - now.getTime();
  const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));

  if (diffHours <= 1) return 'EN MENOS DE 1 HORA';
  return `EN ${diffHours} HORAS`;
};

const ReservationScreen = () => {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [requestReservations, setRequestReservations] = useState([]);
  const [showPastReservations, setShowPastReservations] = useState(false);
  const [loading, setLoading] = useState(true);
  const { chefData } = useAuth();
  const chefId = chefData?.chefId;
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const showHistoryMode = searchParams.get('history') === 'true' || location.state?.showPast === true;

  const syncTabToUrl = useCallback((tab) => {
    navigate(`/reservation?tab=${tab}`, {
      state: { defaultTab: tab },
      replace: true,
    });
  }, [navigate]);

  useEffect(() => {
    const tabFromQuery = new URLSearchParams(location.search).get('tab');
    const showHistoryFromQuery = new URLSearchParams(location.search).get('history') === 'true';

    if (tabFromQuery === 'requests' || location.state?.defaultTab === 'requests') {
      setActiveTab('requests');
      setShowPastReservations(false);
      return;
    }

    setActiveTab('confirmed');
    setShowPastReservations(showHistoryFromQuery || location.state?.showPast === true);
  }, [location.search, location.state]);

  const loadReservations = useCallback(async () => {
    if (!chefId) return;

    try {
      setLoading(true);

      const now = new Date();
      const dateFilter = now.toISOString().split('T')[0];
      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5);

      const [confirmedResponse, requestsResponse, suscriptionResponse] = await Promise.all([
        apiService.listReservationByChefId(chefId),
        apiService.getPendingReservations({ dateFilter, timeFilter }),
        apiService.getPendingReservationSuscription({ dateFilter, timeFilter }),
      ]);

      if (confirmedResponse.success && confirmedResponse.data) {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

        const allConfirmed = confirmedResponse.data
          .filter((reservation) => {
            if (!confirmedStatuses.has(reservation.statusReservation)) return false;
            return true;
          })
          .map((reservation) => ({ ...reservation, tipo: 'reserva' }))
          .sort((a, b) => {
            const dateA = parseLocalDateTime(a.dateReservation, a.hourReservation).getTime();
            const dateB = parseLocalDateTime(b.dateReservation, b.hourReservation).getTime();
            return dateA - dateB;
          });

        const confirmed = allConfirmed
          .filter((reservation) => {
            const reservationDate = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
            return reservationDate.getTime() >= startOfToday;
          })
          .sort((a, b) => {
            const dateA = parseLocalDateTime(a.dateReservation, a.hourReservation).getTime();
            const dateB = parseLocalDateTime(b.dateReservation, b.hourReservation).getTime();
            return dateA - dateB;
          });

        const past = allConfirmed
          .filter((reservation) => {
            const reservationDate = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
            return reservationDate.getTime() < startOfToday;
          })
          .sort((a, b) => {
            const dateA = parseLocalDateTime(a.dateReservation, a.hourReservation).getTime();
            const dateB = parseLocalDateTime(b.dateReservation, b.hourReservation).getTime();
            return dateB - dateA;
          });

        setConfirmedReservations(confirmed);
        setPastReservations(past);
      } else {
        setConfirmedReservations([]);
        setPastReservations([]);
      }

      const normalRequests = requestsResponse.success && requestsResponse.data
        ? requestsResponse.data
            .filter((reservation) => (
              reservation.chefId === null &&
              (reservation.statusReservation === StatusReservation.Creada ||
                reservation.statusReservation === StatusReservation.Reprogramada ||
                reservation.statusReservation === StatusReservation.ReasignacionCocinera)
            ))
            .map((reservation) => ({ ...reservation, tipo: 'reserva' }))
        : [];

      const suscriptionRequests = suscriptionResponse.success && suscriptionResponse.data
        ? suscriptionResponse.data
            .filter((reservation) => (
              reservation.chefId === null &&
              (reservation.suscriptionStatus === StatusReservation.Creada ||
                reservation.suscriptionStatus === StatusReservation.Reprogramada ||
                reservation.suscriptionStatus === StatusReservation.ReasignacionCocinera)
            ))
            .map((reservation) => ({ ...reservation, tipo: 'suscripcion' }))
        : [];

      const allRequests = [...normalRequests, ...suscriptionRequests].sort((a, b) => {
        const dateA = parseLocalDateTime(a.dateReservation, a.hourReservation).getTime();
        const dateB = parseLocalDateTime(b.dateReservation, b.hourReservation).getTime();
        return dateA - dateB;
      });

      setRequestReservations(allRequests);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setConfirmedReservations([]);
      setRequestReservations([]);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  useSignalR(() => {
    void loadReservations();
  }, { playSound: false });

  const upcomingReservation = useMemo(() => {
    if (activeTab !== 'confirmed') return null;
    const now = new Date();
    const nearestUpcoming = confirmedReservations
      .filter((reservation) => {
        const reservationDate = parseLocalDateTime(reservation.dateReservation, reservation.hourReservation);
        return reservationDate.getTime() >= now.getTime();
      })
      .sort((a, b) => {
        const dateA = parseLocalDateTime(a.dateReservation, a.hourReservation).getTime();
        const dateB = parseLocalDateTime(b.dateReservation, b.hourReservation).getTime();
        return dateA - dateB;
      });

    return nearestUpcoming[0] || null;
  }, [activeTab, confirmedReservations]);

  const visibleReservations = useMemo(() => {
    const list = activeTab === 'confirmed' ? confirmedReservations : requestReservations;
    if (activeTab !== 'confirmed' || !upcomingReservation) return list;
    return list.filter((reservation) => reservation.id !== upcomingReservation.id);
  }, [activeTab, confirmedReservations, requestReservations, upcomingReservation]);

  const handleViewReservation = (reservation, isRequest = false) => {
    const originTab = isRequest ? 'requests' : 'confirmed';
    const keepHistoryExpanded = !isRequest && showPastReservations;

    if (reservation.tipo === 'suscripcion') {
      navigate(`/reservation-suscription/${reservation.id}`, {
        state: {
          reservationSuscriptionId: reservation.id,
          suscriptionId: reservation.suscriptionId,
          isActive: false,
          isSuscription: true,
          isRequest,
          source: 'reservation',
          originTab,
          showPast: keepHistoryExpanded,
          reservationData: reservation,
        },
      });
      return;
    }

    const status = reservation.statusReservation;
    const isActive = status === StatusReservation.EnCocina || status === StatusReservation.EnTrayecto;

    navigate(`/reservation/${reservation.id}`, {
      state: {
        reservationId: reservation.id,
        isActive,
        isRequest,
        source: 'reservation',
        originTab,
        showPast: keepHistoryExpanded,
        reservationData: reservation,
      },
    });
  };

  const renderReservationCard = (reservation, isRequest = false) => {
    return (
      <button
        key={`${reservation.tipo || 'reserva'}-${reservation.id}`}
        style={styles.reservationCard}
        onClick={() => handleViewReservation(reservation, isRequest)}
      >
        <div style={styles.cardBody}>
          <div style={styles.cardTopRow}>
            <div style={styles.nameRow}>
              <span style={styles.customerName}>{formatCustomerName(reservation.customerName, reservation.customerLastName, isRequest)}</span>
            </div>
            <span style={{ ...styles.typeBadge, ...(reservation.tipo === 'suscripcion' ? styles.typeBadgeSuscription : styles.typeBadgeReservation) }}>
              {getTypeLabel(reservation)}
            </span>
          </div>

          <div style={styles.detailRow}>
            <img src={clockIcon} alt="Hora" style={styles.rowIcon} />
            <span style={styles.rowText}>{formatReservationDateTime(reservation.dateReservation, reservation.hourReservation)}</span>
          </div>

          <div style={styles.detailRow}>
            <img src={listIcon} alt="Compras" style={styles.rowIcon} />
            <span style={styles.rowText}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
          </div>

          <div style={styles.detailRow}>
            <img src={mapIcon} alt="Ubicacion" style={styles.rowIcon} />
            <span style={styles.rowText}>{reservation.direction || 'Direccion no especificada'}</span>
          </div>
        </div>

        <img src={rightIcon} alt="Ver detalle" style={styles.rightArrow} />
      </button>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {!showHistoryMode ? (
          <>
            <div style={styles.titleRow}>
              <img src={calendarIcon} alt="Tus reservas" style={styles.titleIcon} />
              <h1 style={styles.title}>Tus Reservas</h1>
            </div>

            <div style={styles.toggleContainer}>
              <div
                style={{
                  ...styles.toggleKnob,
                  transform: activeTab === 'confirmed' ? 'translateX(0%)' : 'translateX(100%)',
                }}
              />

              <button
                type="button"
                style={{ ...styles.toggleButton, ...(activeTab === 'confirmed' ? styles.toggleButtonActive : {}) }}
                onClick={() => {
                  setActiveTab('confirmed');
                  syncTabToUrl('confirmed');
                }}
              >
                Confirmadas
              </button>

              <button
                type="button"
                style={{ ...styles.toggleButton, ...(activeTab === 'requests' ? styles.toggleButtonActive : {}) }}
                onClick={() => {
                  setActiveTab('requests');
                  syncTabToUrl('requests');
                }}
              >
                Solicitudes ({requestReservations.length})
              </button>
            </div>
          </>
        ) : (
          <div style={styles.historyHeaderSpacer} />
        )}
      </div>

      <div style={styles.content}>
        {!showHistoryMode && activeTab === 'confirmed' && upcomingReservation && (
          <div style={styles.nextReservationCard}>
            <div style={styles.nextCardTop}>
              <div style={styles.nextBadge}>
                <img src={proximaIcon} alt="Proxima" style={styles.nextBadgeIcon} />
                <span style={styles.nextBadgeText}>PROXIMA</span>
              </div>
              <span style={styles.nextHoursText}>{getHoursToLabel(upcomingReservation)}</span>
            </div>

            <div style={styles.cardBodyNoArrow}>
              <div style={styles.cardTopRow}>
                <div style={styles.nameRow}>
                  <img src={profileBlackIcon} alt="Perfil" style={styles.leadingIcon} />
                  <span style={styles.customerName}>{formatCustomerName(upcomingReservation.customerName, upcomingReservation.customerLastName, false)}</span>
                </div>
                <span style={{ ...styles.typeBadge, ...(upcomingReservation.tipo === 'suscripcion' ? styles.typeBadgeSuscription : styles.typeBadgeReservation) }}>
                  {getTypeLabel(upcomingReservation)}
                </span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.rowText}>{upcomingReservation.direction || 'Direccion no especificada'}</span>
              </div>

              <div style={styles.detailRow}>
                <img src={clockIcon} alt="Hora" style={styles.rowIcon} />
                <span style={styles.rowText}>{formatReservationDateTime(upcomingReservation.dateReservation, upcomingReservation.hourReservation)}</span>
              </div>

              <div style={styles.detailRow}>
                <img src={listIcon} alt="Compras" style={styles.rowIcon} />
                <span style={styles.rowText}>{upcomingReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
              </div>
            </div>

            <button
              style={styles.nextActionButton}
              onClick={() => handleViewReservation(upcomingReservation, false)}
            >
              Ver proxima reserva
            </button>
          </div>
        )}

        {!showHistoryMode && visibleReservations.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyTitle}>
              {activeTab === 'confirmed' ? 'No tienes reservas confirmadas' : 'No tienes solicitudes pendientes'}
            </p>
            <p style={styles.emptyText}>
              {activeTab === 'confirmed'
                ? 'Tus reservas apareceran aqui cuando se confirmen.'
                : 'Las nuevas solicitudes apareceran aqui.'}
            </p>
          </div>
        ) : !showHistoryMode ? (
          visibleReservations.map((reservation) => renderReservationCard(reservation, activeTab === 'requests'))
        ) : null}

        {showHistoryMode && (
          <div style={styles.pastSectionContainer}>
            <div style={styles.pastSectionHeader}>
              <div style={styles.pastSectionTitleRow}>
                <img src={pastIcon} alt="Reservas pasadas" style={styles.pastSectionIcon} />
                <h2 style={styles.pastSectionTitle}>Reservas pasadas</h2>
              </div>
            </div>

            <p style={styles.pastSectionSubtitle}>Aquí verás tu historial</p>
            {pastReservations.length > 0 ? (
              pastReservations.map((reservation) => renderReservationCard(reservation, false))
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No tienes reservas pasadas</p>
                <p style={styles.emptyText}>Tu historial aparecerá aquí.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100%',
    backgroundColor: '#EAF1F6',
    width: '100%',
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EAF1F6',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #DDE6EE',
    borderTop: '4px solid #FF4336',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.small,
  },
  titleIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: '#1B2736',
  },
  historyHeaderSpacer: {
    height: 12,
  },
  toggleContainer: {
    position: 'relative',
    display: 'flex',
    backgroundColor: '#DDE6EE',
    borderRadius: 999,
    padding: 4,
    overflow: 'hidden',
  },
  toggleKnob: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 'calc(50% - 4px)',
    height: 'calc(100% - 8px)',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    transition: 'transform 0.25s ease',
    boxShadow: '0 4px 10px rgba(44, 72, 88, 0.12)',
  },
  toggleButton: {
    flex: 1,
    zIndex: 1,
    border: 'none',
    background: 'transparent',
    padding: '12px 10px',
    fontSize: 14,
    fontWeight: 600,
    color: '#556475',
    cursor: 'pointer',
    textAlign: 'center',
  },
  toggleButtonActive: {
    color: '#1F2937',
    fontWeight: 800,
  },
  content: {
    padding: `${spacing.small}px ${spacing.medium}px ${spacing.medium}px`,
  },
  nextReservationCard: {
    width: '100%',
    border: '1px dashed #6AB8FF',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: '12px 12px 14px',
    marginBottom: 10,
    textAlign: 'left',
  },
  nextCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    border: '1px solid #FFC778',
    backgroundColor: '#FFF2DE',
    padding: '3px 9px',
  },
  nextBadgeIcon: {
    width: 14,
    height: 14,
    objectFit: 'contain',
  },
  nextBadgeText: {
    fontSize: 11,
    fontWeight: 800,
    color: '#E88700',
    letterSpacing: 0.2,
  },
  nextHoursText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  cardBodyNoArrow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reservationCard: {
    width: '100%',
    border: 'none',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: '14px 12px',
    marginBottom: 10,
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  leadingIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
    flexShrink: 0,
  },
  customerName: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1B2736',
    lineHeight: 1.15,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  rowIcon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
    flexShrink: 0,
  },
  rowText: {
    fontSize: 13,
    color: '#324154',
    lineHeight: '18px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 999,
    padding: '3px 8px',
    flexShrink: 0,
    letterSpacing: 0.3,
  },
  typeBadgeReservation: {
    color: '#3158A3',
    backgroundColor: '#E8EEFF',
  },
  typeBadgeSuscription: {
    color: '#A36117',
    backgroundColor: '#FFF1DA',
  },
  rightArrow: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    marginLeft: 10,
    flexShrink: 0,
  },
  nextActionButton: {
    width: '100%',
    marginTop: 10,
    border: 'none',
    borderRadius: 999,
    backgroundColor: '#FCE9E8',
    padding: '11px 14px',
    color: '#FF4336',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
  },
  emptyState: {
    borderRadius: 16,
    padding: spacing.large,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    marginTop: spacing.small,
  },
  emptyTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: '#1B2736',
  },
  emptyText: {
    margin: '8px 0 0',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: '20px',
  },
  pastSectionContainer: {
    marginTop: spacing.large,
  },
  pastSectionHeader: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2px',
    cursor: 'pointer',
  },
  pastSectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pastSectionIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
    flexShrink: 0,
  },
  pastSectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: '#1B2736',
  },
  pastSectionSubtitle: {
    margin: '8px 0 14px',
    fontSize: 14,
    color: '#324154',
    lineHeight: '20px',
  },
  pastSectionArrow: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    transform: 'rotate(90deg)',
    transition: 'transform 0.2s ease',
  },
  pastSectionArrowExpanded: {
    transform: 'rotate(-90deg)',
  },
};

export default ReservationScreen;