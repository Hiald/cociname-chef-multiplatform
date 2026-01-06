import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { Datum, StatusReservation, ChefData } from '../types';
import { Calendar, CalendarCheck, Chef, Clock, Profile, Time, Shopping, ArrowRight } from '../assets/svgs';

const HomeScreen = () => {
  const [reservations, setReservations] = useState<Datum[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReservation, setActiveReservation] = useState<Datum | null>(null);
  const [upcomingReservations, setUpcomingReservations] = useState<Datum[]>([]);
  const [chefData, setChefData] = useState<ChefData | null>(null);
  const chefId = 30; // TODO: Obtener del contexto de autenticación

  useEffect(() => {
    loadChefData();
    loadReservations();
  }, []);

  const loadChefData = async () => {
    try {
      const response = await apiService.getChef(chefId);
      if (response.success && response.data) {
        setChefData(response.data);
      }
    } catch (error) {
      console.error('Error loading chef data:', error);
    }
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      const response = await apiService.listReservationByChefId(chefId);

      if (response.success && response.data) {
        console.log('Reservations loaded:', response.data);
        console.log('Status de cada reserva:', response.data.map(r => ({ id: r.id, status: r.statusReservation })));
        setReservations(response.data);

        // Filtrar reserva activa (En Cocina o En Trayecto)
        const active = response.data.find(r =>
          r.statusReservation === StatusReservation.EnCocina ||
          r.statusReservation === StatusReservation.EnTrayecto
        );

        // Si no hay reserva en cocina o trayecto, mostrar la primera reserva que no esté cancelada
        const firstActive = active || response.data.find(r => r.statusReservation !== StatusReservation.Cancelada);
        setActiveReservation(firstActive || null);

        // Filtrar próximas reservas (Aceptadas, Creadas, Actualizadas)
        const upcoming = response.data.filter(r =>
          r.statusReservation === StatusReservation.Aceptada ||
          r.statusReservation === StatusReservation.Creada ||
          r.statusReservation === StatusReservation.Actualizada
        );
        setUpcomingReservations(upcoming);
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

  const getStatusBadge = (status: number) => {
    if (status === StatusReservation.EnCocina) {
      return { text: 'EN CURSO', color: '#10B981' };
    }
    return { text: '', color: '#6B7280' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {chefData?.firstName || 'Chef'}!</Text>
        <Text style={styles.message}>
          {upcomingReservations.length} hogar{upcomingReservations.length !== 1 ? 'es te esperan' : ' te espera'} hoy para comer rico y sano.
        </Text>
      </View>

      {/* Reserva en curso */}
      {activeReservation && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Chef />
            </View>
            <Text style={styles.sectionTitle}>Reserva en curso</Text>
          </View>

          <View style={styles.activeReservationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>EN CURSO</Text>
              </View>
              <Text style={styles.reservationDate}>{formatDate(activeReservation.dateReservation)}</Text>
            </View>

            <View style={styles.reservationInfo}>
              <View style={styles.customerNameRow}>
                <View style={styles.profileIconContainer}>
                  <Profile />
                </View>
                <Text style={styles.customerName}>{activeReservation.customerName || 'Cliente'}</Text>
              </View>
              <Text style={styles.customerAddress}>{activeReservation.direction}</Text>

              <View style={styles.reservationDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Time />
                  </View>
                  <Text style={styles.detailText}>{activeReservation.hourReservation}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Shopping />
                  </View>
                  <Text style={styles.detailText}>{activeReservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsButtonText}>Ver Detalles</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tus próximas reservas */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Calendar />
            </View>
            <Text style={styles.sectionTitle}>Tus próximas reservas</Text>
          </View>
          {upcomingReservations.length > 0 && (
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          )}
        </View>

        {upcomingReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Hoy no tienes reservas en curso...</Text>
          </View>
        ) : (
          upcomingReservations.map((reservation) => (
            <TouchableOpacity key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationCardContent}>
                <Text style={styles.reservationCardName}>
                  {reservation.customerName || 'Cliente'} | <Text style={styles.reservationCardLocation}>{reservation.district}</Text>
                </Text>
                <View style={styles.reservationCardDetails}>
                  <View style={styles.cardDetailRow}>
                    <View style={styles.cardDetailIconContainer}>
                      <Time />
                    </View>
                    <Text style={styles.cardDetailText}>{formatDate(reservation.dateReservation)} - {reservation.hourReservation}</Text>
                  </View>
                  <View style={styles.cardDetailRow}>
                    <View style={styles.sectionIconContainer}>
                      <Shopping />
                    </View>
                    <Text style={styles.cardDetailText}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.arrowIconContainer}>
                <ArrowRight />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Mi disponibilidad */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Clock />
          </View>
          <Text style={styles.sectionTitle}>Mi disponibilidad</Text>
        </View>

        <TouchableOpacity style={styles.availabilityButton}>
          <Text style={styles.availabilityButtonText}>Completar disponibilidad</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: 80, // Espacio para bottom tabs
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    marginBottom: spacing.large,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1F24',
    marginBottom: spacing.small,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionHeader: {
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
  reservationInfo: {
    marginBottom: spacing.medium,
  },
  reservationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerNameRow: {
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
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
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
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#9CA3AF',
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
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  availabilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default HomeScreen;
