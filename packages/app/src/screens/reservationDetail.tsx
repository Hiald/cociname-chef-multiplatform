import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ReservationDetailData, RecipeMenuItem, StatusReservation } from '../types';
import { ArrowLeftDetail, UbicationDetail, RedhatDetail, MoneyDetail, ArrowRightDetail, ChecklistDetail, ClockDetail, HelpDetail, OrderDetail, ListDetail, HatblueDetail } from '../assets/svgs';
import { RecipeModal } from '../components/recipe-modal';
import { getConceptName } from '../utils/formatters';

interface ReservationDetailScreenProps {
  route?: {
    params: {
      reservationId: number;
      isActive?: boolean; // true si es "en curso", false si es "próxima"
    };
  };
  navigation?: any;
}

const ReservationDetailScreen: React.FC<ReservationDetailScreenProps> = ({ route, navigation }) => {
  const [reservation, setReservation] = useState<ReservationDetailData | null>(null);
  const [recipes, setRecipes] = useState<RecipeMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeMenuItem | null>(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const reservationId = route?.params?.reservationId;
  const isActive = route?.params?.isActive || false;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar detalle de la reserva
        const reservationResponse = await apiService.getReservationById(reservationId!);
        
        if (isMounted && reservationResponse.success && reservationResponse.data) {
          setReservation(reservationResponse.data);
          
          // Cargar recetas de la reserva
          const recipesResponse = await apiService.getReservationRecipes(reservationId!);
          
          if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
            // Parsear jsonRequest para obtener los platos
            const firstRecipe = recipesResponse.data[0];
            try {
              const requestedDishes: RecipeMenuItem[] = JSON.parse(firstRecipe.jsonRequest);
              const optionalDishes: RecipeMenuItem[] = firstRecipe.jsonOptional 
                ? JSON.parse(firstRecipe.jsonOptional) 
                : [];
              if (isMounted) {
                setRecipes([...requestedDishes, ...optionalDishes]);
              }
            } catch (e) {
              console.error('Error parsing recipes:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading reservation detail:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [reservationId]);

  const loadReservationDetail = async () => {
    try {
      setLoading(true);
      
      // Cargar detalle de la reserva
      const reservationResponse = await apiService.getReservationById(reservationId!);
      
      if (reservationResponse.success && reservationResponse.data) {
        setReservation(reservationResponse.data);
        
        // Cargar recetas de la reserva
        const recipesResponse = await apiService.getReservationRecipes(reservationId!);
        
        if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
          // Parsear jsonRequest para obtener los platos
          const firstRecipe = recipesResponse.data[0];
          try {
            const requestedDishes: RecipeMenuItem[] = JSON.parse(firstRecipe.jsonRequest);
            const optionalDishes: RecipeMenuItem[] = firstRecipe.jsonOptional 
              ? JSON.parse(firstRecipe.jsonOptional) 
              : [];
            setRecipes([...requestedDishes, ...optionalDishes]);
          } catch (e) {
            console.error('Error parsing recipes:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reservation detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-ES', options);
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case StatusReservation.EnCocina:
        return { text: 'EN CURSO', color: '#10B981', bgColor: '#D1FAE5' };
      case StatusReservation.EnTrayecto:
        return { text: 'EN TRAYECTO', color: '#F59E0B', bgColor: '#FEF3C7' };
      case StatusReservation.Aceptada:
        return { text: 'ACEPTADA', color: '#3B82F6', bgColor: '#DBEAFE' };
      case StatusReservation.Creada:
        return { text: 'PENDIENTE', color: '#6B7280', bgColor: '#F3F4F6' };
      default:
        return { text: 'PENDIENTE', color: '#6B7280', bgColor: '#F3F4F6' };
    }
  };

  const handleGoBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleArriveHome = () => {
    // Lógica para marcar que llegaste al domicilio
    console.log('Llegué al domicilio');
  };
  const handleOpenMaps = () => {
    if (reservation && reservation.latitude && reservation.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${reservation.latitude},${reservation.longitude}`;
      Linking.openURL(url);
    }
  };

  const handleViewRecipe = (recipe: RecipeMenuItem) => {
    console.log('Opening recipe modal for:', recipe);
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleCloseRecipeModal = () => {
    console.log('Closing recipe modal');
    setRecipeModalVisible(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró la reserva</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(reservation.statusReservation);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <View style={styles.backButtonContent}>
            <ArrowLeftDetail />
            <Text style={styles.backButtonText}>Volver</Text>
          </View>
        </TouchableOpacity>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Customer Name */}
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>
            {reservation.customerName || 'Cliente'} {reservation.customerLastName || ''}
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardContainer}>
          <View style={styles.infoRow}>
            <OrderDetail />
            <Text style={styles.infoRowLabel}>{formatDate(reservation.dateReservation).split(',')[0]}</Text>
            <Text style={styles.infoRowValue}>{formatDate(reservation.dateReservation).split(', ')[1]}</Text>
          </View>
          <View style={styles.infoRow}>
            <ClockDetail />
            <Text style={styles.infoRowLabel}>{reservation.hourReservation}</Text>
          </View>
          <View style={styles.infoRow}>
            <ListDetail />
            <Text style={styles.infoRowLabel}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</Text>
          </View>
          <View style={styles.infoRow}>
            <HatblueDetail />
            <Text style={styles.infoRowLabel}>{reservation.totalPortion} porciones totales</Text>
          </View>
        </View>

        {/* Arrive Button - Solo si es activa */}
        {isActive && (
          <TouchableOpacity style={styles.arriveButton} onPress={handleArriveHome}>
            <View style={styles.arriveButtonContent}>
              <ChecklistDetail />
              <Text style={styles.arriveButtonText}>Llegué al domicilio</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Ubicación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UbicationDetail />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.addressText}>{reservation.direction}</Text>
            <Text style={styles.districtText}>Distrito {reservation.district}</Text>
            {reservation.reference && (
              <Text style={styles.referenceText}>
                {reservation.reference}
              </Text>
            )}
            <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
              <Text style={styles.mapButtonText}>Abrir en Maps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Platos Elegidos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <RedhatDetail />
            <Text style={styles.sectionTitle}>Platos elegidos</Text>
          </View>
          <View style={styles.card}>
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <View key={recipe.key || index} style={styles.dishItem}>
                  <Text style={styles.dishName}>
                    {recipe.MenuNombre} - {recipe.MasterRecipeNombre}
                  </Text>
                  <View style={styles.dishFooter}>
                    <Text style={styles.portionsText}>{recipe.iCantidadPlatos} porciones</Text>
                    <TouchableOpacity style={styles.viewRecipeButton} onPress={() => handleViewRecipe(recipe)}>
                      <Text style={styles.viewRecipeText}>Ver receta</Text>
                      <View style={styles.arrowIcon}>
                        <ArrowRightDetail />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay platos registrados</Text>
            )}
          </View>
        </View>

        {/* Mi garantía */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MoneyDetail />
            <Text style={styles.sectionTitle}>Mi ganancia</Text>
          </View>
          <View style={styles.card}>
            {(() => {
              try {
                const paymentConcepts = JSON.parse(reservation.jsonPaymentChef || '[]');
                return paymentConcepts.map((concept: any, index: number) => (
                  <View key={index} style={styles.garantiaRow}>
                    <Text style={styles.garantiaLabel}>{getConceptName(parseInt(concept.Concepto))}</Text>
                    <Text style={styles.garantiaValue}>S/ {parseFloat(concept.Monto).toFixed(2)}</Text>
                  </View>
                ));
              } catch (e) {
                return (
                  <View style={styles.garantiaRow}>
                    <Text style={styles.garantiaLabel}>Comisión chef</Text>
                    <Text style={styles.garantiaValue}>S/ {reservation.commissiontoChef.toFixed(2)}</Text>
                  </View>
                );
              }
            })()}
            <View style={styles.divider} />
            <View style={styles.garantiaRow}>
              <Text style={styles.garantiaTotal}>Total</Text>
              <Text style={styles.garantiaTotalValue}>S/ {reservation.commissiontoChef.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
          <Text style={styles.helpText}>Comunícate con un asesor</Text>
          <TouchableOpacity style={styles.helpButton}>
            <View style={styles.helpButtonContent}>
              <HelpDetail />
              <Text style={styles.helpButtonText}>Ayuda con mi servicio</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          visible={recipeModalVisible}
          onClose={handleCloseRecipeModal}
          recipeName={`${selectedRecipe.MenuNombre} - ${selectedRecipe.MasterRecipeNombre}`}
          masterRecipeId={parseInt(selectedRecipe.MasterRecipeId)}
          portions={selectedRecipe.iCantidadPlatos}
          recipeSteps={selectedRecipe.sPasos}
        />
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: spacing.large,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: spacing.medium,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1A1F24',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingTop: Platform.OS === 'web' ? spacing.medium : 50,
    paddingBottom: spacing.small,
    backgroundColor: '#FFFFFF',
  },
  customerHeader: {
    paddingBottom: spacing.small,
    paddingHorizontal: 0,
    marginBottom: spacing.small,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF5136',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.medium,
    paddingHorizontal: spacing.medium,
    paddingBottom: 100,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#1A1F24',
    marginLeft: spacing.small,
    fontWeight: '500',
    flex: 1,
  },
  infoRowValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  arriveButton: {
    backgroundColor: '#FF5136',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  arriveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arriveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    marginLeft: spacing.small,
  },
  card: {
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
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
  },
  districtText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.small,
  },
  referenceText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: spacing.medium,
  },
  mapButton: {
    backgroundColor: '#FF51361A',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5136',
  },
  dishItem: {
    marginBottom: spacing.medium,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewRecipeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 4,
  },
  arrowIcon: {
    marginTop: 5,
  },
  garantiaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  garantiaLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  garantiaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F24',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.small,
  },
  garantiaTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
  },
  garantiaTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  contactText: {
    fontSize: 14,
    color: '#1A1F24',
    marginLeft: spacing.small,
  },
  commentSection: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#1A1F24',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: spacing.medium,
  },
  helpSection: {
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.medium,
  },
  helpButton: {
    backgroundColor: '#FF5136',
    paddingVertical: 16,
    paddingHorizontal: spacing.medium,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: spacing.small,
    alignSelf: 'stretch',
  },
  helpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default ReservationDetailScreen;