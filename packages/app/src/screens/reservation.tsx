import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { Datum, StatusReservation, RootStackParamList } from '../types';
import { 
  CalendarReservation, 
  CheckReservation, 
  ArrowRightReservation,
  MapReservation,
  NotificationReservation,
  AgentReservation,
  ListReservation
} from '../assets/svgs';

type ReservationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reservation'>;

type TabType = 'confirmed' | 'requests';

interface ReservationScreenProps {
  navigation?: ReservationScreenNavigationProp;
}

const ReservationScreen: React.FC<ReservationScreenProps> = ({ navigation: navProp }) => {
  const [activeTab, setActiveTab] = useState<TabType>('confirmed');
  const [confirmedReservations, setConfirmedReservations] = useState<Datum[]>([]);
  const [requestReservations, setRequestReservations] = useState<Datum[]>([]);
  const [activeReservation, setActiveReservation] = useState<Datum | null>(null);
  const [loading, setLoading] = useState(true);
  const chefId = 30; // TODO: Obtener del contexto de autenticación
  
  // Intentar obtener navigation del hook o usar el prop
  let navigation: ReservationScreenNavigationProp | undefined;
  try {
    navigation = navProp || useNavigation<ReservationScreenNavigationProp>();
  } catch (e) {
    navigation = navProp;
  }

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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    return d.toLocaleDateString('es-ES', options);
  };

  const formatCustomerName = (firstName: string | null, lastName: string | null, isRequest: boolean) => {
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

  const getStatusBadge = (status: number) => {
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

  const handleViewReservation = (reservationId: number, isActive: boolean) => {
    if (navigation) {
      navigation.navigate('ReservationDetail', {
        reservationId,
        isActive,
      });
    }
  };

  const renderReservationCard = (reservation: Datum, isRequest: boolean) => {
    const statusBadge = getStatusBadge(reservation.statusReservation);
    
    return (
      <TouchableOpacity 
        key={reservation.id} 
        style={styles.reservationCard}
        onPress={() => handleViewReservation(reservation.id, reservation.statusReservation === StatusReservation.EnCocina || reservation.statusReservation === StatusReservation.EnTrayecto)}
      >
        <View style={styles.reservationCardContent}>
          {/* Header con badge de estado */}
          <View style={styles.cardTopRow}>
            <Text style={styles.reservationCardName}>
              {formatCustomerName(reservation.customerName, reservation.customerLastName, isRequest)}
            </Text>
            <View style={[styles.statusBadgeMini, { backgroundColor: statusBadge.bgColor }]}>
              <Text style={[styles.statusBadgeMiniText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          {/* Detalles */}
          <View style={styles.reservationCardDetails}>
            <View style={styles.cardDetailRow}>
              <View style={styles.cardDetailIconContainer}>
                <ListReservation />
              </View>
              <Text style={styles.cardDetailText}>
                {formatDate(reservation.dateReservation)} - {reservation.hourReservation}
              </Text>
            </View>
            <View style={styles.cardDetailRow}>
              <View style={styles.cardDetailIconContainer}>
                <AgentReservation />
              </View>
              <Text style={styles.cardDetailText}>
                {reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}
              </Text>
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.locationRow}>
            <MapReservation />
            <Text style={styles.locationText}>{reservation.direction}</Text>
          </View>
        </View>
        <View style={styles.arrowIconContainer}>
          <ArrowRightReservation />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
      </View>
    );
  }

  const currentReservations = activeTab === 'confirmed' ? confirmedReservations : requestReservations;

  return (
    <View style={styles.container}>
      {/* Header con título */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <CalendarReservation />
          <Text style={styles.headerTitle}>Tus reservas</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'confirmed' && styles.tabActive]}
          onPress={() => setActiveTab('confirmed')}
        >
          <CheckReservation />
          <Text style={[styles.tabText, activeTab === 'confirmed' && styles.tabTextActive]}>
            Confirmadas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <NotificationReservation />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Solicitudes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reserva en curso */}
      {activeReservation && (
        <View style={styles.activeReservationSection}>
          <View style={styles.activeReservationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>EN CURSO</Text>
              </View>
              <Text style={styles.reservationDate}>{formatDate(activeReservation.dateReservation)}</Text>
            </View>

            <View style={styles.reservationInfo}>
              <Text style={styles.customerName}>
                {formatCustomerName(activeReservation.customerName, activeReservation.customerLastName, false)}
              </Text>
              <Text style={styles.customerAddress}>{activeReservation.direction}</Text>

              <View style={styles.reservationDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <ListReservation />
                  </View>
                  <Text style={styles.detailText}>{activeReservation.hourReservation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <AgentReservation />
                  </View>
                  <Text style={styles.detailText}>
                    {activeReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.viewDetailsButton} 
              onPress={() => handleViewReservation(activeReservation.id, true)}
            >
              <Text style={styles.viewDetailsButtonText}>Ver Reserva en Curso</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de reservas */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>
              {activeTab === 'confirmed' ? '📅' : '🔔'}
            </Text>
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'confirmed' ? 'No tienes reservas confirmadas' : 'No tienes solicitudes pendientes'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeTab === 'confirmed' 
                ? 'Tus reservas confirmadas aparecerán aquí.' 
                : 'Las nuevas solicitudes de reserva aparecerán aquí.'}
            </Text>
          </View>
        ) : (
          currentReservations.map((reservation) => 
            renderReservationCard(reservation, activeTab === 'requests')
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: spacing.medium,
    paddingTop: Platform.OS === 'web' ? spacing.medium : 50,
    paddingBottom: spacing.small,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1F24',
    marginLeft: spacing.small,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.small,
    marginHorizontal: 4,
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FF5136',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: 80,
  },
  reservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  reservationCardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservationCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    flex: 1,
  },
  statusBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusBadgeMiniText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  reservationCardDetails: {
    marginTop: 4,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardDetailIconContainer: {
    marginRight: 6,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  arrowIconContainer: {
    marginLeft: spacing.small,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.extraLarge * 2,
    alignItems: 'center',
    marginTop: spacing.large,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.medium,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  activeReservationSection: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: spacing.medium,
    paddingTop: spacing.medium,
    paddingBottom: spacing.small,
  },
  activeReservationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  statusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  reservationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reservationInfo: {
    marginBottom: spacing.medium,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.small,
  },
  reservationDetails: {
    marginTop: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIconContainer: {
    marginRight: spacing.small,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  viewDetailsButton: {
    backgroundColor: '#FF51361A',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF5136',
  },
});

export default ReservationScreen;
