import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { 
  CalendarReservation, 
  CheckReservation, 
  ArrowRightReservation,
  MapReservation,
  NotificationReservation,
  AgentReservation,
  ListReservation
} from '../assets/svgs';

const ReservationScreen = () => {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [requestReservations, setRequestReservations] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const chefId = 30; // TODO: Obtener del contexto de autenticación
  const navigate = useNavigate();

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      
      // Cargar reservas confirmadas
      const confirmedResponse = await apiService.listReservationByChefId(chefId);
      if (confirmedResponse.success && confirmedResponse.data) {
        const data = confirmedResponse.data;

        // Obtener fecha actual (solo fecha, sin hora)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filtrar reservas en cocina o en trayecto
        const activeReservations = data.filter(r =>
          r.statusReservation === StatusReservation.EnCocina ||
          r.statusReservation === StatusReservation.EnTrayecto
        );

        let activeReservation = null;

        if (activeReservations.length > 0) {
          // Buscar reserva del día de hoy
          const todayActive = activeReservations.find(r => {
            const reservationDate = new Date(r.dateReservation);
            reservationDate.setHours(0, 0, 0, 0);
            return reservationDate.getTime() === today.getTime();
          });

          if (todayActive) {
            activeReservation = todayActive;
          } else {
            // Si no hay del día de hoy, buscar la más cercana (próxima)
            const sortedByDate = activeReservations
              .map(r => ({
                ...r,
                date: new Date(r.dateReservation).getTime()
              }))
              .sort((a, b) => a.date - b.date);
            
            activeReservation = sortedByDate[0];
          }
        }

        // Si no hay reserva en cocina/trayecto, buscar la próxima reserva confirmada
        if (!activeReservation) {
          const confirmedReservations = data.filter(r => 
            r.statusReservation !== StatusReservation.Cancelada &&
            r.statusReservation !== StatusReservation.Completada
          );

          if (confirmedReservations.length > 0) {
            const sortedByDate = confirmedReservations
              .map(r => ({
                ...r,
                date: new Date(r.dateReservation).getTime()
              }))
              .sort((a, b) => a.date - b.date);
            
            activeReservation = sortedByDate[0];
          }
        }

        setActiveReservation(activeReservation);

        // Filtrar solo las confirmadas (Aceptada, Creada, Actualizada, EnCompra, EnTrayecto, EnCocina)
        const confirmed = data.filter(r =>
          r.statusReservation === StatusReservation.Aceptada ||
          r.statusReservation === StatusReservation.Creada ||
          r.statusReservation === StatusReservation.Actualizada ||
          r.statusReservation === StatusReservation.EnCompra ||
          r.statusReservation === StatusReservation.EnTrayecto ||
          r.statusReservation === StatusReservation.EnCocina
        );
        setConfirmedReservations(confirmed);
      }

      // Cargar solicitudes pendientes con fecha y hora actual
      const now = new Date();
      const dateFilter = now.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5); // Formato: HH:mm
      
      const requestsResponse = await apiService.getPendingReservations({
        dateFilter,
        timeFilter,
      });
      if (requestsResponse.success && requestsResponse.data) {
        setRequestReservations(requestsResponse.data);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    return d.toLocaleDateString('es-ES', options);
  };

  const formatCustomerName = (firstName, lastName, isRequest) => {
    if (!firstName) return 'Cliente';
    
    if (isRequest) {
      // Para solicitudes: nombre + inicial del apellido
      const lastNameInitial = lastName ? `${lastName.charAt(0)}.` : '';
      return `${firstName} ${lastNameInitial}`;
    } else {
      // Para confirmadas: nombre completo
      return `${firstName} ${lastName || ''}`.trim();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case StatusReservation.EnCocina:
        return { text: 'EN COCINA', color: '#10B981', bgColor: '#D1FAE5' };
      case StatusReservation.EnTrayecto:
        return { text: 'EN TRAYECTO', color: '#F59E0B', bgColor: '#FEF3C7' };
      case StatusReservation.EnCompra:
        return { text: 'EN COMPRA', color: '#3B82F6', bgColor: '#DBEAFE' };
      case StatusReservation.Aceptada:
        return { text: 'ACEPTADA', color: '#8B5CF6', bgColor: '#EDE9FE' };
      case StatusReservation.Creada:
      case StatusReservation.Actualizada:
        return { text: 'PENDIENTE', color: '#6B7280', bgColor: '#F3F4F6' };
      default:
        return { text: 'PENDIENTE', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const handleViewReservation = (reservationId, isActive) => {
    navigate(`/reservation/${reservationId}`, {
      state: { reservationId, isActive }
    });
  };

  const renderReservationCard = (reservation, isRequest) => {
    const statusBadge = getStatusBadge(reservation.statusReservation);
    
    return (
      <button 
        key={reservation.id} 
        style={styles.reservationCard}
        onClick={() => handleViewReservation(reservation.id, reservation.statusReservation === StatusReservation.EnCocina || reservation.statusReservation === StatusReservation.EnTrayecto)}
      >
        <div style={styles.reservationCardContent}>
          {/* Header con badge de estado */}
          <div style={styles.cardTopRow}>
            <span style={styles.reservationCardName}>
              {formatCustomerName(reservation.customerName, reservation.customerLastName, isRequest)}
            </span>
            <div style={{...styles.statusBadgeMini, backgroundColor: statusBadge.bgColor}}>
              <span style={{...styles.statusBadgeMiniText, color: statusBadge.color}}>
                {statusBadge.text}
              </span>
            </div>
          </div>

          {/* Detalles */}
          <div style={styles.reservationCardDetails}>
            <div style={styles.cardDetailRow}>
              <div style={styles.cardDetailIconContainer}>
                <ListReservation />
              </div>
              <span style={styles.cardDetailText}>
                {formatDate(reservation.dateReservation)} - {reservation.hourReservation}
              </span>
            </div>
            <div style={styles.cardDetailRow}>
              <div style={styles.cardDetailIconContainer}>
                <AgentReservation />
              </div>
              <span style={styles.cardDetailText}>
                {reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}
              </span>
            </div>
          </div>

          {/* Ubicación */}
          <div style={styles.locationRow}>
            <MapReservation />
            <span style={styles.locationText}>{reservation.direction}</span>
          </div>
        </div>
        <div style={styles.arrowIconContainer}>
          <ArrowRightReservation />
        </div>
      </button>
    );
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  const currentReservations = activeTab === 'confirmed' ? confirmedReservations : requestReservations;

  return (
    <div style={styles.container}>
      {/* Header con título */}
      <div style={styles.header}>
        <div style={styles.headerTitleRow}>
          <CalendarReservation />
          <h1 style={styles.headerTitle}>Tus reservas</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <button
          style={{...styles.tab, ...(activeTab === 'confirmed' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('confirmed')}
        >
          <CheckReservation />
          <span style={{...styles.tabText, ...(activeTab === 'confirmed' ? styles.tabTextActive : {})}}>
            Confirmadas
          </span>
        </button>

        <button
          style={{...styles.tab, ...(activeTab === 'requests' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('requests')}
        >
          <NotificationReservation />
          <span style={{...styles.tabText, ...(activeTab === 'requests' ? styles.tabTextActive : {})}}>
            Solicitudes
          </span>
        </button>
      </div>

      {/* Reserva en curso */}
      {activeReservation && (
        <div style={styles.activeReservationSection}>
          <div style={styles.activeReservationCard}>
            <div style={styles.cardHeader}>
              <div style={styles.statusBadge}>
                <span style={styles.statusBadgeText}>EN CURSO</span>
              </div>
              <span style={styles.reservationDate}>{formatDate(activeReservation.dateReservation)}</span>
            </div>

            <div style={styles.reservationInfo}>
              <p style={styles.customerName}>
                {formatCustomerName(activeReservation.customerName, activeReservation.customerLastName, false)}
              </p>
              <p style={styles.customerAddress}>{activeReservation.direction}</p>

              <div style={styles.reservationDetails}>
                <div style={styles.detailRow}>
                  <div style={styles.detailIconContainer}>
                    <ListReservation />
                  </div>
                  <span style={styles.detailText}>{activeReservation.hourReservation}</span>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailIconContainer}>
                    <AgentReservation />
                  </div>
                  <span style={styles.detailText}>
                    {activeReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}
                  </span>
                </div>
              </div>
            </div>

            <button 
              style={styles.viewDetailsButton} 
              onClick={() => handleViewReservation(activeReservation.id, true)}
            >
              <span style={styles.viewDetailsButtonText}>Ver Reserva en Curso</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de reservas */}
      <div style={{...styles.scrollView, ...styles.contentContainer}}>
        {currentReservations.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyStateIcon}>
              {activeTab === 'confirmed' ? '📅' : '🔔'}
            </span>
            <p style={styles.emptyStateTitle}>
              {activeTab === 'confirmed' ? 'No tienes reservas confirmadas' : 'No tienes solicitudes pendientes'}
            </p>
            <p style={styles.emptyStateText}>
              {activeTab === 'confirmed' 
                ? 'Tus reservas confirmadas aparecerán aquí.' 
                : 'Las nuevas solicitudes de reserva aparecerán aquí.'}
            </p>
          </div>
        ) : (
          currentReservations.map((reservation) => 
            renderReservationCard(reservation, activeTab === 'requests')
          )
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#F5F7FA',
    overflowX: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #FF5136',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
  },
  headerTitleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1A1F24',
    marginLeft: `${spacing.small}px`,
    margin: 0,
  },
  tabsContainer: {
    display: 'flex',
    flexDirection: 'row',
    padding: `${spacing.small}px ${spacing.medium}px`,
    borderBottom: '1px solid #E5E7EB',
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `12px ${spacing.small}px`,
    margin: '0 4px',
    borderRadius: '30px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#FF5136',
  },
  tabText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: '8px',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: `${spacing.medium}px ${spacing.medium}px 20px`,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  reservationCard: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.small}px`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  reservationCardContent: {
    flex: 1,
  },
  cardTopRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  reservationCardName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    flex: 1,
  },
  statusBadgeMini: {
    padding: '3px 8px',
    borderRadius: '8px',
    marginLeft: '8px',
  },
  statusBadgeMiniText: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  locationRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '8px',
  },
  locationText: {
    fontSize: '13px',
    color: '#6B7280',
    marginLeft: '6px',
  },
  reservationCardDetails: {
    marginTop: '4px',
  },
  cardDetailRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4px',
  },
  cardDetailIconContainer: {
    marginRight: '6px',
  },
  cardDetailText: {
    fontSize: '12px',
    color: '#6B7280',
  },
  arrowIconContainer: {
    marginLeft: `${spacing.small}px`,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: `${spacing.extraLarge * 2}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: `${spacing.large}px`,
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: `${spacing.medium}px`,
  },
  emptyStateTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: `${spacing.small}px`,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: '20px',
  },
  activeReservationSection: {
    backgroundColor: '#F5F7FA',
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
  },
  activeReservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: `${spacing.medium}px`,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  statusBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: '0.5px',
  },
  reservationDate: {
    fontSize: '12px',
    color: '#6B7280',
  },
  reservationInfo: {
    marginBottom: `${spacing.medium}px`,
  },
  customerName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  customerAddress: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.small}px`,
  },
  reservationDetails: {
    marginTop: `${spacing.small}px`,
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '4px',
  },
  detailIconContainer: {
    marginRight: `${spacing.small}px`,
  },
  detailText: {
    fontSize: '14px',
    color: '#374151',
  },
  viewDetailsButton: {
    backgroundColor: '#FF51361A',
    padding: '12px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  viewDetailsButtonText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FF5136',
  },
};

export default ReservationScreen;
