import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { decryptToken } from '../utils/crypto';
import { apiService } from '../services/api.service';
import { spacing } from '../styles';
import { getDistrictName, getConceptName } from '../utils';
import { UbicationDetail, RedhatDetail, MoneyDetail, OrderDetail, ClockDetail, ListDetail, HatblueDetail, ArrowRightDetail } from '../assets/svgs';
import { RecipeModal } from '../components/recipe-modal';

/**
 * Vista pública de reserva - accesible sin login mediante token encriptado
 * URL: /reserva/:token
 */
export const PublicReservationScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    const loadReservation = async () => {
      try {
        setLoading(true);
        setError(null);

        // Desencriptar el token para obtener el reservationId
        console.log('Desencriptando token:', token);
        const id = decryptToken(token);
        console.log('Reservation ID desencriptado:', id);

        // Cargar los detalles de la reserva
        const response = await apiService.getReservationById(id);
        
        if (response.success && response.data) {
          setReservation(response.data);
          
          // Cargar recetas de la reserva
          const recipesResponse = await apiService.getReservationRecipes(id);
          
          if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
            const firstRecipe = recipesResponse.data[0];
            try {
              const requestedDishes = JSON.parse(firstRecipe.jsonRequest);
              const optionalDishes = firstRecipe.jsonOptional 
                ? JSON.parse(firstRecipe.jsonOptional) 
                : [];
              setRecipes([...requestedDishes, ...optionalDishes]);
            } catch (e) {
              console.error('Error parsing recipes:', e);
            }
          }
        } else {
          setError(response.errorMessage || 'No se pudo cargar la reserva');
        }
      } catch (err) {
        console.error('Error cargando reserva pública:', err);
        const errorMessage = err instanceof Error ? err.message : 'Enlace inválido o expirado';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
        <Text style={styles.loadingText}>Cargando reserva...</Text>
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Reserva no encontrada'}</Text>
        <Text style={styles.errorHint}>
          El enlace puede ser inválido o haber expirado.
        </Text>
      </View>
    );
  }

  const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-ES', options);
  };

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalVisible(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>
            {reservation.customerName} {reservation.customerLastName}
          </Text>
          <Text style={styles.publicBadge}>Vista pública</Text>
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

        {/* Ubicación */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UbicationDetail />
            <Text style={styles.sectionTitle}>Ubicación</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.addressText}>{reservation.direction}</Text>
            <Text style={styles.districtText}>{getDistrictName(reservation.district)}</Text>
            {reservation.reference && (
              <Text style={styles.referenceText}>{reservation.reference}</Text>
            )}
          </View>
        </View>

        {/* Platos Elegidos */}
        {recipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <RedhatDetail />
              <Text style={styles.sectionTitle}>Platos elegidos</Text>
            </View>
            <View style={styles.card}>
              {recipes.map((recipe, index) => (
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
              ))}
            </View>
          </View>
        )}

        {/* Mi garantía */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MoneyDetail />
            <Text style={styles.sectionTitle}>Detalle del servicio</Text>
          </View>
          <View style={styles.card}>
            {(() => {
              try {
                const paymentConcepts = JSON.parse(reservation.jsonPaymentChef || '[]');
                return paymentConcepts.map((concept, index) => (
                  <View key={index} style={styles.garantiaRow}>
                    <Text style={styles.garantiaLabel}>{getConceptName(parseInt(concept.Concepto))}</Text>
                    <Text style={styles.garantiaValue}>S/ {parseFloat(concept.Monto).toFixed(2)}</Text>
                  </View>
                ));
              } catch {
                return (
                  <View style={styles.garantiaRow}>
                    <Text style={styles.garantiaLabel}>Servicio</Text>
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

        {/* Comentarios */}
        {(reservation.comments || reservation.commentClient) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>💬</Text>
              <Text style={styles.sectionTitle}>Comentarios</Text>
            </View>
            <View style={styles.card}>
              {reservation.commentClient && (
                <View style={styles.commentSection}>
                  <Text style={styles.commentLabel}>Del cliente:</Text>
                  <Text style={styles.commentText}>{reservation.commentClient}</Text>
                </View>
              )}
              {reservation.comments && (
                <View style={styles.commentSection}>
                  <Text style={styles.commentLabel}>Notas adicionales:</Text>
                  <Text style={styles.commentText}>{reservation.comments}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Nota de Privacidad */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Vista de solo lectura</Text>
          <Text style={styles.helpText}>
            Para modificaciones, contacte con el servicio al cliente.
          </Text>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: spacing.large,
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: spacing.medium,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'web' ? spacing.medium : 50,
    paddingHorizontal: spacing.medium,
    paddingBottom: 100,
  },
  customerHeader: {
    paddingBottom: spacing.small,
    marginBottom: spacing.small,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF5136',
    marginBottom: 4,
  },
  publicBadge: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
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
  sectionIcon: {
    fontSize: 20,
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
  chefName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
  },
  chefPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  commentSection: {
    marginBottom: spacing.medium,
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
  helpSection: {
    alignItems: 'center',
    marginTop: spacing.medium,
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
    textAlign: 'center',
  },
});


