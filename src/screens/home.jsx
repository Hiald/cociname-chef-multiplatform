import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { Calendar, CalendarCheck, Chef, Clock, Profile, Time, Shopping, ArrowRight } from '../assets/svgs';
import { getDistrictName, formatearFechaConDia } from '../utils/formatters';
import { useSignalR } from '../hooks/useSignalR';
import { useAuth } from '../hooks/useAuth';

// Add loader animation
const loaderStyle = document.createElement('style');
loaderStyle.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(loaderStyle);

const HomeScreen = () => {
  // eslint-disable-next-line no-unused-vars
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState(null);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [, setChefDataLocal] = useState(null);
  const { chefData } = useAuth();
  const chefId = chefData?.chefId; // Obtener del contexto de autenticación
  const navigate = useNavigate();

  useEffect(() => {
    loadChefData();
    loadReservations();
  }, []);

  const loadChefData = async () => {
    try {
      const response = await apiService.getChef(chefId);
      if (response.success && response.data) {
        setChefDataLocal(response.data);
      }
    } catch (error) {
      console.error('Error loading chef data:', error);
    }
  };


  // Helper para combinar fecha y hora en un Date completo
  const parseLocalDateTime = (dateString, timeString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return date;
  };

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.listReservationByChefId(chefId);

      if (response.success && response.data) {
        console.log('Reservations loaded:', response.data);
        console.log('Status de cada reserva:', response.data.map(r => ({ id: r.id, status: r.statusReservation })));
        setReservations(response.data);

        // Obtener fecha y hora actual
        const now = new Date();
        const nowTime = now.getTime();

        // Buscar reservas que estén dentro de su ventana de tiempo de ejecución
        const activeReservations = response.data.filter(r => {
          // Solo considerar reservas confirmadas (no canceladas ni completadas)
          if (r.statusReservation === StatusReservation.Cancelada || 
              r.statusReservation === StatusReservation.Completada) {
            return false;
          }

          const reservationDateTime = parseLocalDateTime(r.dateReservation, r.hourReservation);
          const reservationStartTime = reservationDateTime.getTime();
          // Calcular hora de finalización (hora inicio + preparationTime en horas)
          const preparationTimeMs = (r.preparationTime || 2.5) * 60 * 60 * 1000;
          const reservationEndTime = reservationStartTime + preparationTimeMs;
          
          // La reserva está "en curso" si estamos dentro de su ventana de tiempo
          return nowTime >= reservationStartTime && nowTime <= reservationEndTime;
        });

        let activeReservation = null;

        if (activeReservations.length > 0) {
          // Si hay varias en curso, tomar la que empezó primero
          const sortedByDateTime = activeReservations
            .map(r => ({
              ...r,
              dateTime: parseLocalDateTime(r.dateReservation, r.hourReservation).getTime()
            }))
            .sort((a, b) => a.dateTime - b.dateTime);
          
          activeReservation = sortedByDateTime[0];
        } else {
          // Si no hay ninguna en curso, buscar la próxima reserva confirmada
          const confirmedReservations = response.data.filter(r => {
            const reservationDateTime = parseLocalDateTime(r.dateReservation, r.hourReservation);
            return (
              r.statusReservation !== StatusReservation.Cancelada &&
              r.statusReservation !== StatusReservation.Completada &&
              reservationDateTime.getTime() > nowTime
            );
          });

          if (confirmedReservations.length > 0) {
            const sortedByDateTime = confirmedReservations
              .map(r => ({
                ...r,
                dateTime: parseLocalDateTime(r.dateReservation, r.hourReservation).getTime()
              }))
              .sort((a, b) => a.dateTime - b.dateTime);
            
            activeReservation = sortedByDateTime[0];
          }
        }

        setActiveReservation(activeReservation);

        // Filtrar próximas reservas (Aceptadas, Creadas, Actualizadas) - solo futuras considerando fecha y hora
        const upcoming = response.data.filter(r => {
          const reservationDateTime = parseLocalDateTime(r.dateReservation, r.hourReservation);
          return (
            (r.statusReservation === StatusReservation.Aceptada ||
             r.statusReservation === StatusReservation.Creada ||
             r.statusReservation === StatusReservation.Actualizada) &&
            reservationDateTime.getTime() >= nowTime
          );
        });
        setUpcomingReservations(upcoming);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useSignalR(loadReservations);
  
  useEffect(() => {
    loadChefData();
    loadReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const formatDate = (date) => {
    return formatearFechaConDia(date);
  };

  // eslint-disable-next-line no-unused-vars
  const getStatusBadge = (status) => {
    if (status === StatusReservation.EnCocina) {
      return { text: 'EN CURSO', color: '#10B981' };
    }
    return { text: '', color: '#6B7280' };
  };

  const handleViewActiveReservation = () => {
    if (activeReservation) {
      navigate(`/reservation/${activeReservation.id}`, {
        state: { isActive: true }
      });
    }
  };

  const handleViewUpcomingReservation = (reservationId) => {
    navigate(`/reservation/${reservationId}`, {
      state: { isActive: false }
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.greeting}>¡Hola, {chefData?.firstName || 'Chef'}!</h1>
        <p style={styles.message}>
          {upcomingReservations.length} hogar{upcomingReservations.length !== 1 ? 'es te esperan' : ' te espera'} hoy para comer rico y sano.
        </p>
      </div>

      {/* Reserva en curso */}
      {activeReservation && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIconContainer}>
              <Chef />
            </div>
            <h2 style={styles.sectionTitle}>Reserva en curso</h2>
          </div>

          <div style={styles.activeReservationCard}>
            <div style={styles.cardHeader}>
              <div style={styles.statusBadge}>
                <span style={styles.statusBadgeText}>EN CURSO</span>
              </div>
              <span style={styles.reservationDate}>{formatDate(activeReservation.dateReservation)}</span>
            </div>

            <div style={styles.reservationInfo}>
              <div style={styles.customerNameRow}>
                <div style={styles.profileIconContainer}>
                  <Profile />
                </div>
                <span style={styles.customerName}>{activeReservation.customerName || 'Cliente'}</span>
              </div>
              <p style={styles.customerAddress}>{activeReservation.direction}</p>

              <div style={styles.reservationDetails}>
                <div style={styles.detailRow}>
                  <div style={styles.detailIconContainer}>
                    <Time />
                  </div>
                  <span style={styles.detailText}>{activeReservation.hourReservation}</span>
                </div>
                <div style={styles.detailRow}>
                  <div style={styles.detailIconContainer}>
                    <Shopping />
                  </div>
                  <span style={styles.detailText}>{activeReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
                </div>
              </div>
            </div>

            <button style={styles.viewDetailsButton} onClick={handleViewActiveReservation}>
              <span style={styles.viewDetailsButtonText}>Ver Detalles</span>
            </button>
          </div>
        </div>
      )}

      {/* Tus próximas reservas */}
      <div style={styles.section}>
        <div style={styles.sectionHeaderRow}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIconContainer}>
              <Calendar />
            </div>
            <h2 style={styles.sectionTitle}>Tus próximas reservas</h2>
          </div>
          {upcomingReservations.length > 0 && (
            <button style={styles.seeAllButton}>
              <span style={styles.seeAllText}>Ver todas</span>
            </button>
          )}
        </div>

        {upcomingReservations.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyStateText}>Hoy no tienes reservas en curso...</p>
          </div>
        ) : (
          upcomingReservations.map((reservation) => (
            <button 
              key={reservation.id} 
              style={styles.reservationCard}
              onClick={() => handleViewUpcomingReservation(reservation.id)}
            >
              <div style={styles.reservationCardContent}>
                <span style={styles.reservationCardName}>
                  {reservation.customerName || 'Cliente'} | <span style={styles.reservationCardLocation}>{getDistrictName(reservation.district)}</span>
                </span>
                <div style={styles.reservationCardDetails}>
                  <div style={styles.cardDetailRow}>
                    <div style={styles.cardDetailIconContainer}>
                      <Time />
                    </div>
                    <span style={styles.cardDetailText}>{formatDate(reservation.dateReservation)} - {reservation.hourReservation}</span>
                  </div>
                  <div style={styles.cardDetailRow}>
                    <div style={styles.sectionIconContainer}>
                      <Shopping />
                    </div>
                    <span style={styles.cardDetailText}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
                  </div>
                </div>
              </div>
              <div style={styles.arrowIconContainer}>
                <ArrowRight />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Mi disponibilidad */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div style={styles.sectionIconContainer}>
            <Clock />
          </div>
          <h2 style={styles.sectionTitle}>Mi disponibilidad</h2>
        </div>

        <button style={styles.availabilityButton}>
          <span style={styles.availabilityButtonText}>Completar disponibilidad</span>
        </button>
      </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden',
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
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #FF5136',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    marginBottom: spacing.large,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1F24',
    marginBottom: spacing.small,
    margin: `0 0 ${spacing.small}px 0`,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: '24px',
    margin: 0,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionHeaderRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionIconContainer: {
    marginRight: spacing.small,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  seeAllButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF5136',
    fontWeight: '600',
  },
  activeReservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.medium,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    padding: '4px 12px',
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  reservationInfo: {
    marginBottom: spacing.medium,
  },
  reservationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerNameRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileIconContainer: {
    marginRight: spacing.small,
    color: '#FF5136',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.small,
    margin: `0 0 ${spacing.small}px 0`,
  },
  reservationDetails: {
    marginTop: spacing.small,
  },
  detailRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIconContainer: {
    marginRight: spacing.small,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.small,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  viewDetailsButton: {
    backgroundColor: '#FF51361A',
    padding: '12px 0',
    borderRadius: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  viewDetailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF5136',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.large,
    display: 'flex',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#9CA3AF',
    margin: 0,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.small,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  reservationCardContent: {
    flex: 1,
  },
  reservationCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: spacing.small,
  },
  reservationCardLocation: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  reservationCardDetails: {
    marginTop: 4,
  },
  cardDetailRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDetailIconContainer: {
    marginRight: 6,
  },
  cardDetailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  cardDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  arrowIconContainer: {
    marginLeft: spacing.small,
  },
  availabilityButton: {
    backgroundColor: '#FF5136',
    padding: '16px 0',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  availabilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default HomeScreen;
