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
import { useAuth } from '../hooks/useAuth';
import { formatearFechaConDia } from '../utils/formatters';

const ReservationScreen = () => {
  const [activeTab, setActiveTab] = useState('confirmed');
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [requestReservations, setRequestReservations] = useState([]);
  const [activeReservation, setActiveReservation] = useState(null);
  const [activeSuscription, setActiveSuscription] = useState(null);
  const [suscriptionReservations, setSuscriptionReservations] = useState([]);
  const [expandedSuscription, setExpandedSuscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const { chefData } = useAuth();
  const chefId = chefData?.chefId; // Obtener del contexto de autenticación
  const navigate = useNavigate();

  // Helper para convertir fecha string a Date en zona horaria local
  const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  useEffect(() => {
    loadReservations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chefData?.id) {
      loadSuscriptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chefData?.id]);

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
        const todayTime = today.getTime();

        // Filtrar reservas en cocina o en trayecto (solo hoy o futuras)
        const activeReservations = data.filter(r => {
          const reservationDate = parseLocalDate(r.dateReservation);
          return (
            (r.statusReservation === StatusReservation.EnCocina ||
             r.statusReservation === StatusReservation.EnTrayecto) &&
            reservationDate.getTime() >= todayTime
          );
        });

        let activeReservation = null;

        if (activeReservations.length > 0) {
          // Buscar reserva del día de hoy
          const todayActive = activeReservations.find(r => {
            const reservationDate = parseLocalDate(r.dateReservation);
            return reservationDate.getTime() === todayTime;
          });

          if (todayActive) {
            activeReservation = todayActive;
          } else {
            // Si no hay del día de hoy, buscar la más cercana futura
            const sortedByDate = activeReservations
              .map(r => ({
                ...r,
                dateTime: parseLocalDate(r.dateReservation).getTime()
              }))
              .sort((a, b) => a.dateTime - b.dateTime);
            
            activeReservation = sortedByDate[0];
          }
        }

        // Si no hay reserva en cocina/trayecto, buscar la próxima reserva confirmada (solo hoy o futuras)
        if (!activeReservation) {
          const confirmedReservations = data.filter(r => {
            const reservationDate = parseLocalDate(r.dateReservation);
            return (
              r.statusReservation !== StatusReservation.Cancelada &&
              r.statusReservation !== StatusReservation.Completada &&
              reservationDate.getTime() >= todayTime
            );
          });

          if (confirmedReservations.length > 0) {
            const sortedByDate = confirmedReservations
              .map(r => ({
                ...r,
                dateTime: parseLocalDate(r.dateReservation).getTime()
              }))
              .sort((a, b) => a.dateTime - b.dateTime);
            
            activeReservation = sortedByDate[0];
          }
        }

        setActiveReservation(activeReservation);

        // Filtrar solo las confirmadas (Aceptada, Creada, Actualizada, EnCompra, EnTrayecto, EnCocina) - solo hoy o futuras
        const confirmed = data.filter(r => {
          const reservationDate = parseLocalDate(r.dateReservation);
          return (
            (r.statusReservation === StatusReservation.Aceptada ||
             r.statusReservation === StatusReservation.Creada ||
             r.statusReservation === StatusReservation.Actualizada ||
             r.statusReservation === StatusReservation.EnCompra ||
             r.statusReservation === StatusReservation.EnTrayecto ||
             r.statusReservation === StatusReservation.EnCocina) &&
            reservationDate.getTime() >= todayTime
          );
        }).map(r => ({ ...r, tipo: 'reserva' }));
        
        // Cargar suscripciones confirmadas del chef
        let allConfirmed = [...confirmed];
        
        if (chefId) {
          const suscriptionsResponse = await apiService.getSuscriptionsByChefId(chefId);
          
          if (suscriptionsResponse.success && suscriptionsResponse.data) {
            // Filtrar suscripciones activas (confirmadas)
            const activeSuscriptions = suscriptionsResponse.data
              .filter(s => s.statusSuscription === 1)
              .map(s => ({
                ...s,
                tipo: 'suscripcion',
                // Mapear campos para que sean compatibles con el renderizado
                customerName: s.customerName || 'Cliente',
                customerLastName: s.customerLastName || '',
                dateReservation: s.startDate,
                hourReservation: '00:00',
                direction: s.direction || 'Dirección no especificada',
                puchaseIngredients: false,
                statusReservation: StatusReservation.Aceptada // Considerarlas como aceptadas
              }));
            
            allConfirmed = [...allConfirmed, ...activeSuscriptions];
          }
        }
        
        setConfirmedReservations(allConfirmed);
      }

      // Cargar solicitudes pendientes con fecha y hora actual
      const now = new Date();
      const dateFilter = now.toISOString().split('T')[0]; // Formato: YYYY-MM-DD
      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5); // Formato: HH:mm
      
      // Cargar reservas normales pendientes
      const requestsResponse = await apiService.getPendingReservations({
        dateFilter,
        timeFilter,
      });
      
      // Cargar reservas de suscripción pendientes
      const suscriptionResponse = await apiService.getPendingReservationSuscription({
        dateFilter,
        timeFilter,
      });
      
      console.log('📋 Solicitudes de suscripción pendientes del API:', suscriptionResponse);
      if (suscriptionResponse.success && suscriptionResponse.data) {
        console.log('📋 Datos de solicitudes:', suscriptionResponse.data.map(r => ({
          id: r.id,
          suscriptionStatus: r.suscriptionStatus,
          suscriptionCode: r.suscriptionCode,
          customerName: r.customerName
        })));
      }
      
      // Combinar ambas listas y agregar tipo identificador
      // FILTRAR solicitudes pendientes: sin chef asignado (chefId === null) Y estado 1, 9 o 10
      const normalRequests = requestsResponse.success && requestsResponse.data 
        ? requestsResponse.data
            .filter(r => {
              // Debe tener chefId null (sin asignar) Y estar en estado Creada(1), Reprogramada(9) o Reasignación(10)
              const isPending = r.chefId === null && (
                r.statusReservation === 1 ||  // Creada
                r.statusReservation === 9 ||  // Reprogramada
                r.statusReservation === 10    // Reasignación Cocinera
              );
              return isPending;
            })
            .map(r => ({ ...r, tipo: 'reserva' }))
        : [];
      
      // FILTRAR suscripciones pendientes: sin chef asignado Y estado 1, 9 o 10
      const suscriptionRequests = suscriptionResponse.success && suscriptionResponse.data
        ? suscriptionResponse.data
            .filter(r => {
              // Debe tener chefId null (sin asignar) Y estar en estado Creada(1), Reprogramada(9) o Reasignación(10)
              const isPending = r.chefId === null && (
                r.suscriptionStatus === 1 ||  // Creada
                r.suscriptionStatus === 9 ||  // Reprogramada
                r.suscriptionStatus === 10    // Reasignación Cocinera
              );
              return isPending;
            })
            .map(r => ({ ...r, tipo: 'suscripcion' }))
        : [];
      
      console.log('📋 Solicitudes filtradas:', {
        normalRequests: normalRequests.length,
        normalRequestsData: normalRequests.map(r => ({ id: r.id, status: r.statusReservation, chefId: r.chefId })),
        suscriptionRequests: suscriptionRequests.length,
        suscriptionRequestsData: suscriptionRequests.map(r => ({ id: r.id, status: r.suscriptionStatus })),
        total: normalRequests.length + suscriptionRequests.length
      });
      
      const allRequests = [...normalRequests, ...suscriptionRequests];
      setRequestReservations(allRequests);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuscriptions = async () => {
    try {
      const response = await apiService.getSuscriptionsByChefId(chefId);
      
      if (response.success && response.data && response.data.length > 0) {
        // Filtrar suscripciones activas y ordenar por fecha más cercana
        const activeSuscriptions = response.data.filter(s => s.statusSuscription === 1);
        
        if (activeSuscriptions.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Ordenar por fecha de inicio más cercana
          const sorted = activeSuscriptions
            .map(s => ({
              ...s,
              dateNum: s.startDate ? new Date(s.startDate).getTime() : 0
            }))
            .sort((a, b) => Math.abs(a.dateNum - today.getTime()) - Math.abs(b.dateNum - today.getTime()));
          
          const firstActive = sorted[0];
          setActiveSuscription(firstActive);
          
          // Cargar las reservas hijas de esta suscripción
          const reservationsResponse = await apiService.getReservationsBySuscriptionId(firstActive.id);
          if (reservationsResponse.success && reservationsResponse.data) {
            setSuscriptionReservations(reservationsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading suscriptions:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Fecha no especificada';
    if (typeof date === 'string' && (date === 'string' || date.trim() === '')) {
      return 'Fecha no especificada';
    }
    try {
      return formatearFechaConDia(date);
    } catch (error) {
      console.error('Error formatting date:', date, 'Type:', typeof date, 'Error:', error);
      return 'Fecha inválida';
    }
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
        return { text: 'CONFIRMADA', color: '#10B981', bgColor: '#D1FAE5' };
      default:
        return { text: 'CONFIRMADA', color: '#10B981', bgColor: '#D1FAE5' };
    }
  };

  const handleViewReservation = (reservation, isActive, isRequest = false) => {
    console.log('🔍 handleViewReservation llamado:', {
      reservationId: reservation.id,
      tipo: reservation.tipo,
      isActive,
      isRequest,
      suscriptionStatus: reservation.suscriptionStatus,
      statusReservation: reservation.statusReservation,
      reservationSuscriptionId: reservation.reservationSuscriptionId
    });
    
    // Si es una suscripción confirmada (plan completo)
    if (reservation.tipo === 'suscripcion' && !reservation.reservationSuscriptionId) {
      console.log('📦 Navegando a suscripción (plan completo) con state:', {
        reservationSuscriptionId: reservation.id, 
        suscriptionId: reservation.id, 
        isActive: false, 
        isSuscription: true,
        isRequest // ✅ Pasar el valor correcto
      });
      
      // Navegar al detalle de suscripción usando el ID de la suscripción
      navigate(`/reservation-suscription/${reservation.id}`, {
        state: { 
          reservationSuscriptionId: reservation.id, 
          suscriptionId: reservation.id, 
          isActive: false, 
          isSuscription: true,
          isRequest // ✅ Usar el parámetro en lugar de hardcodear false
        }
      });
      return;
    }
    
    // Si es una reserva de suscripción (reserva individual dentro de un plan)
    if (reservation.tipo === 'suscripcion') {
      console.log('🚀 Navegando a suscripción con state:', {
        reservationSuscriptionId: reservation.id, 
        suscriptionId: reservation.suscriptionId, 
        isActive, 
        isSuscription: true,
        isRequest
      });
      
      navigate(`/reservation-suscription/${reservation.id}`, {
        state: { 
          reservationSuscriptionId: reservation.id, 
          suscriptionId: reservation.suscriptionId, 
          isActive, 
          isSuscription: true,
          isRequest // Agregar si es solicitud o confirmada
        }
      });
    } else {
      // Si es una reserva normal, navegar a reservationDetail
      navigate(`/reservation/${reservation.id}`, {
        state: { 
          reservationId: reservation.id, 
          isActive,
          isRequest // Agregar si es solicitud o confirmada
        }
      });
    }
  };

  const renderReservationCard = (reservation, isRequest) => {
    const statusBadge = getStatusBadge(reservation.statusReservation);
    
    console.log('🎴 renderReservationCard:', {
      id: reservation.id,
      tipo: reservation.tipo,
      isRequest,
      suscriptionStatus: reservation.suscriptionStatus,
      statusReservation: reservation.statusReservation
    });
    
    return (
      <button 
        key={reservation.id} 
        style={styles.reservationCard}
        onClick={() => {
          console.log('👆 Click en tarjeta:', {
            id: reservation.id,
            tipo: reservation.tipo,
            isRequest,
            suscriptionStatus: reservation.suscriptionStatus
          });
          handleViewReservation(
            reservation, 
            reservation.statusReservation === StatusReservation.EnCocina || reservation.statusReservation === StatusReservation.EnTrayecto,
            isRequest
          );
        }}
      >
        <div style={styles.reservationCardContent}>
          {/* Header con badge de estado y tipo */}
          <div style={styles.cardTopRow}>
            <span style={styles.reservationCardName}>
              {formatCustomerName(reservation.customerName, reservation.customerLastName, isRequest)}
            </span>
            <div style={styles.badgesContainer}>
              {/* Badge de tipo (Reserva/Suscripción) */}
              {reservation.tipo && (
                <div style={{
                  ...styles.typeBadgeMini, 
                  backgroundColor: reservation.tipo === 'suscripcion' ? '#FEF3C7' : '#E0E7FF'
                }}>
                  <span style={{
                    ...styles.typeBadgeMiniText, 
                    color: reservation.tipo === 'suscripcion' ? '#F59E0B' : '#6366F1'
                  }}>
                    {reservation.tipo === 'suscripcion' ? 'SUSCRIPCIÓN' : 'RESERVA'}
                  </span>
                </div>
              )}
              {/* Badge de estado */}
              <div style={{...styles.statusBadgeMini, backgroundColor: statusBadge.bgColor}}>
                <span style={{...styles.statusBadgeMiniText, color: statusBadge.color}}>
                  {statusBadge.text}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div style={styles.reservationCardDetails}>
            <div style={styles.cardDetailRow}>
              <div style={styles.cardDetailIconContainer}>
                <ListReservation />
              </div>
              <span style={styles.cardDetailText}>
                {reservation.dateReservation 
                  ? `${formatDate(reservation.dateReservation)} - ${reservation.hourReservation || 'Hora no especificada'}` 
                  : 'Fecha y hora por confirmar'}
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
      {/* Mis suscripciones */}
      {activeSuscription && (
        <div style={styles.suscriptionSection}>
          <div style={styles.suscriptionHeader}>
            <h2 style={styles.suscriptionTitle}>Mi suscripción</h2>
            <div style={styles.suscriptionBadge}>
              <span style={styles.suscriptionBadgeText}>Suscripción activa</span>
            </div>
          </div>

          <div style={styles.suscriptionCard}>
            <div style={styles.suscriptionCardHeader}>
              <h3 style={styles.suscriptionPlanName}>Plan Mensual Premium</h3>
              <span style={styles.suscriptionPrice}>S/ {activeSuscription.totalPrice}</span>
            </div>

            <p style={styles.suscriptionSubtitle}>
              {activeSuscription.visitsPerMonth} reservas incluidas al mes
            </p>

            <div style={styles.progressSection}>
              <div style={styles.progressHeader}>
                <span style={styles.progressLabel}>Fechas utilizadas</span>
                <span style={styles.progressCount}>
                  {suscriptionReservations.filter(r => r.suscriptionStatus >= 1).length}/{activeSuscription.visitsPerMonth}
                </span>
              </div>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(suscriptionReservations.filter(r => r.suscriptionStatus >= 1).length / activeSuscription.visitsPerMonth) * 100}%`
                  }}
                />
              </div>
              <p style={styles.progressText}>
                Te quedan {activeSuscription.visitsPerMonth - suscriptionReservations.filter(r => r.suscriptionStatus >= 1).length} reservas disponibles
              </p>
            </div>

            <div style={styles.renewalSection}>
              <span style={styles.renewalLabel}>Próxima renovación:</span>
              <span style={styles.renewalDate}>{activeSuscription.endDate ? formatDate(activeSuscription.endDate) : 'No especificada'}</span>
            </div>

            <button 
              style={styles.toggleButton}
              onClick={() => setExpandedSuscription(!expandedSuscription)}
            >
              <span style={styles.toggleButtonText}>
                {expandedSuscription ? 'Ocultar reservas' : 'Ver detalle de reservas'}
              </span>
              <span style={{...styles.toggleIcon, transform: expandedSuscription ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                ▼
              </span>
            </button>

            {/* Lista expandible de reservas */}
            {expandedSuscription && (
              <div style={styles.suscriptionReservationsList}>
                {suscriptionReservations.length === 0 ? (
                  <p style={styles.emptyReservationsText}>No hay reservas programadas aún</p>
                ) : (
                  suscriptionReservations.map((reservation, index) => (
                    <div key={reservation.id} style={styles.suscriptionReservationItem}>
                      <div style={styles.suscriptionReservationHeader}>
                        <span style={styles.suscriptionReservationNumber}>Reserva {index + 1}</span>
                        <span style={{
                          ...styles.suscriptionReservationStatus,
                          color: reservation.suscriptionStatus >= 1 ? '#10B981' : '#6B7280'
                        }}>
                          {reservation.suscriptionStatus >= 1 ? 'Completada' : 'Pendiente'}
                        </span>
                      </div>
                      {reservation.dateReservation && (
                        <p style={styles.suscriptionReservationDate}>
                          {formatDate(reservation.dateReservation)} - {reservation.hourReservation}
                        </p>
                      )}
                      <button 
                        style={{
                          ...styles.suscriptionReservationButton,
                          opacity: !reservation.dateReservation ? 0.5 : 1,
                          cursor: !reservation.dateReservation ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => reservation.dateReservation && navigate(`/suscription/${activeSuscription.id}`)}
                        disabled={!reservation.dateReservation}
                      >
                        <span style={styles.suscriptionReservationButtonText}>
                          {reservation.dateReservation ? 'Ver detalle' : 'Sin programar'}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
              onClick={() => handleViewReservation(activeReservation, true)}
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
  badgesContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: '6px',
    alignItems: 'center',
  },
  typeBadgeMini: {
    padding: '3px 8px',
    borderRadius: '8px',
    minWidth: '85px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeMiniText: {
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textAlign: 'center',
  },
  statusBadgeMini: {
    padding: '3px 8px',
    borderRadius: '8px',
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
  // Estilos para Suscripción
  suscriptionSection: {
    backgroundColor: '#FFFFFF',
    padding: `${spacing.medium}px`,
    borderBottom: '1px solid #E5E7EB',
  },
  suscriptionHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: `${spacing.small}px`,
  },
  suscriptionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  suscriptionBadge: {
    backgroundColor: '#D1FAE5',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  suscriptionBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: '0.5px',
  },
  suscriptionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    marginTop: `${spacing.small}px`,
  },
  suscriptionCardHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  suscriptionPlanName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  suscriptionPrice: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FF5136',
  },
  suscriptionSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
    marginTop: '4px',
  },
  progressSection: {
    marginBottom: `${spacing.medium}px`,
  },
  progressHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  progressLabel: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '600',
  },
  progressCount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#3B82F6',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0,
  },
  renewalSection: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: `${spacing.small}px`,
    borderTop: '1px solid #E5E7EB',
    marginBottom: `${spacing.medium}px`,
  },
  renewalLabel: {
    fontSize: '14px',
    color: '#6B7280',
  },
  renewalDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
  },
  toggleButton: {
    backgroundColor: '#FF51361A',
    padding: '12px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    marginBottom: `${spacing.small}px`,
  },
  toggleButtonText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF5136',
    marginRight: '8px',
  },
  toggleIcon: {
    fontSize: '12px',
    color: '#FF5136',
    transition: 'transform 0.3s ease',
  },
  suscriptionReservationsList: {
    marginTop: `${spacing.medium}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: `${spacing.small}px`,
  },
  suscriptionReservationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: `${spacing.small}px`,
    border: '1px solid #E5E7EB',
  },
  suscriptionReservationHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  suscriptionReservationNumber: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1A1F24',
  },
  suscriptionReservationStatus: {
    fontSize: '12px',
    fontWeight: '600',
  },
  suscriptionReservationDate: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '4px 0',
  },
  suscriptionReservationButton: {
    backgroundColor: 'transparent',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '8px 12px',
    width: '100%',
    cursor: 'pointer',
    marginTop: '8px',
  },
  suscriptionReservationButtonText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
  },
  emptyReservationsText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px`,
    margin: 0,
  },
};

export default ReservationScreen;
