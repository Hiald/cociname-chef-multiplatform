import React, { useEffect, useState } from 'react';
import { decryptToken } from '../utils/crypto';
import { apiService } from '../services/api.service';
import { spacing } from '../styles';
import { getDistrictName, getConceptName } from '../utils';
import { UbicationDetail, RedhatDetail, MoneyDetail, OrderDetail, ClockDetail, ListDetail, HatblueDetail, ArrowRightDetail } from '../assets/svgs';
import RecipeModal from '../components/recipe-modal/recipe-modal';

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
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Cargando reserva...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorTitle}>⚠️</span>
        <p style={styles.errorText}>{error || 'Reserva no encontrada'}</p>
        <p style={styles.errorHint}>
          El enlace puede ser inválido o haber expirado.
        </p>
      </div>
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
    <div style={styles.container}>
      <div style={styles.scrollView}>
        <div style={styles.contentContainer}>
          {/* Header */}
          <div style={styles.customerHeader}>
            <h1 style={styles.customerName}>
              {reservation.customerName} {reservation.customerLastName}
            </h1>
            <p style={styles.publicBadge}>Vista pública</p>
          </div>

          {/* Info Cards */}
          <div style={styles.infoCardContainer}>
            <div style={styles.infoRow}>
              <OrderDetail />
              <span style={styles.infoRowLabel}>{formatDate(reservation.dateReservation).split(',')[0]}</span>
              <span style={styles.infoRowValue}>{formatDate(reservation.dateReservation).split(', ')[1]}</span>
            </div>
            <div style={styles.infoRow}>
              <ClockDetail />
              <span style={styles.infoRowLabel}>{reservation.hourReservation}</span>
            </div>
            <div style={styles.infoRow}>
              <ListDetail />
              <span style={styles.infoRowLabel}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
            </div>
            <div style={styles.infoRow}>
              <HatblueDetail />
              <span style={styles.infoRowLabel}>{reservation.totalPortion} porciones totales</span>
            </div>
          </div>

          {/* Ubicación */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <UbicationDetail />
              <h2 style={styles.sectionTitle}>Ubicación</h2>
            </div>
            <div style={styles.card}>
              <p style={styles.addressText}>{reservation.direction}</p>
              <p style={styles.districtText}>{getDistrictName(reservation.district)}</p>
              {reservation.reference && (
                <p style={styles.referenceText}>{reservation.reference}</p>
              )}
            </div>
          </div>

          {/* Platos Elegidos */}
          {recipes.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <RedhatDetail />
                <h2 style={styles.sectionTitle}>Platos elegidos</h2>
              </div>
              <div style={styles.card}>
                {recipes.map((recipe, index) => (
                  <div key={recipe.key || index} style={styles.dishItem}>
                    <p style={styles.dishName}>
                      {recipe.MenuNombre} - {recipe.MasterRecipeNombre}
                    </p>
                    <div style={styles.dishFooter}>
                      <span style={styles.portionsText}>{recipe.iCantidadPlatos} porciones</span>
                      <button style={styles.viewRecipeButton} onClick={() => handleViewRecipe(recipe)}>
                        <span style={styles.viewRecipeText}>Ver receta</span>
                        <div style={styles.arrowIcon}>
                          <ArrowRightDetail />
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mi garantía */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MoneyDetail />
              <h2 style={styles.sectionTitle}>Detalle del servicio</h2>
            </div>
            <div style={styles.card}>
              {(() => {
                try {
                  const paymentConcepts = JSON.parse(reservation.jsonPaymentChef || '[]');
                  return paymentConcepts.map((concept, index) => (
                    <div key={index} style={styles.garantiaRow}>
                      <span style={styles.garantiaLabel}>{getConceptName(parseInt(concept.Concepto))}</span>
                      <span style={styles.garantiaValue}>S/ {parseFloat(concept.Monto).toFixed(2)}</span>
                    </div>
                  ));
                } catch {
                  return (
                    <div style={styles.garantiaRow}>
                      <span style={styles.garantiaLabel}>Servicio</span>
                      <span style={styles.garantiaValue}>S/ {reservation.commissiontoChef.toFixed(2)}</span>
                    </div>
                  );
                }
              })()}
              <div style={styles.divider} />
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaTotal}>Total</span>
                <span style={styles.garantiaTotalValue}>S/ {reservation.commissiontoChef.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          {(reservation.comments || reservation.commentClient) && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionIcon}>💬</span>
                <h2 style={styles.sectionTitle}>Comentarios</h2>
              </div>
              <div style={styles.card}>
                {reservation.commentClient && (
                  <div style={styles.commentSection}>
                    <p style={styles.commentLabel}>Del cliente:</p>
                    <p style={styles.commentText}>{reservation.commentClient}</p>
                  </div>
                )}
                {reservation.comments && (
                  <div style={styles.commentSection}>
                    <p style={styles.commentLabel}>Notas adicionales:</p>
                    <p style={styles.commentText}>{reservation.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nota de Privacidad */}
          <div style={styles.helpSection}>
            <p style={styles.helpTitle}>Vista de solo lectura</p>
            <p style={styles.helpText}>
              Para modificaciones, contacte con el servicio al cliente.
            </p>
          </div>
        </div>
      </div>

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
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100%',
    backgroundColor: '#F5F7FA',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loader: {
    width: 48,
    height: 48,
    border: '4px solid #FEE2E2',
    borderTopColor: '#FF5136',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    margin: '16px 0 0 0',
  },
  errorContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
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
    margin: `0 0 ${spacing.small}px 0`,
  },
  errorHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    margin: 0,
  },
  scrollView: {
    width: '100%',
    overflowY: 'auto',
  },
  contentContainer: {
    paddingTop: spacing.medium,
    paddingLeft: spacing.medium,
    paddingRight: spacing.medium,
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
    margin: '0 0 4px 0',
  },
  publicBadge: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    margin: 0,
  },
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #F3F4F6',
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
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    marginLeft: spacing.small,
    margin: `0 0 0 ${spacing.small}px`,
  },
  sectionIcon: {
    fontSize: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  districtText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.small,
    margin: `0 0 ${spacing.small}px 0`,
  },
  referenceText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: '20px',
    margin: 0,
  },
  dishItem: {
    marginBottom: spacing.medium,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  dishFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  viewRecipeButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  viewRecipeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 4,
  },
  arrowIcon: {
    marginTop: 5,
    display: 'flex',
  },
  garantiaRow: {
    display: 'flex',
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
    marginTop: spacing.small,
    marginBottom: spacing.small,
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
  commentSection: {
    marginBottom: spacing.medium,
  },
  commentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  commentText: {
    fontSize: 14,
    color: '#1A1F24',
    lineHeight: '20px',
    margin: 0,
  },
  helpSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    margin: 0,
  },
};

// Inyectar animación del loader
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}


