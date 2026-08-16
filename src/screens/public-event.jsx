import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import { spacing } from '../styles';
import { UbicationDetail, RedhatDetail, MoneyDetail, OrderDetail, ClockDetail, ListDetail, HatblueDetail, ArrowRightDetail } from '../assets/svgs';
import RecipeModal from '../components/recipe-modal/recipe-modal';
import { getClientComment } from '../utils/formatters';

/**
 * Vista pública de evento - accesible sin login mediante token encriptado
 * URL: /evento/:token
 */
export const PublicEventScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);

  const formatDate = useCallback((date) => {
    if (!date) return 'Fecha no especificada';
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat('es-PE', options).format(new Date(date));
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.publicGetReservationEventByToken(token);

        if (!isMounted) return;

        if (response.success && response.data) {
          const eventData = response.data;
          setEvent(eventData);

          if (eventData.eventDetails && Array.isArray(eventData.eventDetails) && eventData.eventDetails.length > 0) {
            const mappedRecipes = eventData.eventDetails.map((dish) => ({
              MenuNombre: dish.menuNameSnapshot || '',
              MasterRecipeNombre: dish.recipeNameSnapshot || 'original',
              iCantidadPlatos: dish.portions || 1,
              MasterRecipeId: dish.masterRecipeId,
              id: dish.id,
              key: dish.id,
            }));
            setRecipes(mappedRecipes);
          } else {
            setRecipes([]);
          }
        } else {
          setError(response.errorMessage || 'No se pudo cargar el evento');
        }
      } catch (err) {
        console.error('Error cargando evento público:', err);
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Enlace inválido o expirado');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadEvent();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalVisible(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <p style={styles.loadingText}>Cargando evento...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorTitle}>⚠️</span>
        <p style={styles.errorText}>{error || 'Evento no encontrado'}</p>
        <p style={styles.errorHint}>El enlace puede ser inválido o haber expirado.</p>
      </div>
    );
  }

  const clientComment = getClientComment(event);

  return (
    <div style={styles.container}>
      <div style={styles.scrollView}>
        <div style={styles.contentContainer}>
          <div style={styles.customerHeader}>
            <h1 style={styles.customerName}>
              {event.customerName || 'Cliente'}
            </h1>
            <p style={styles.publicBadge}>Vista pública • Evento</p>
          </div>

          <div style={styles.infoCardContainer}>
            <div style={styles.infoRow}>
              <ClockDetail />
              <span style={styles.infoRowLabel}>Fecha y hora</span>
              <span style={styles.infoRowValue}>{formatDate(event.dateEvent)} - {event.hourEvent || 'No especificada'}</span>
            </div>
            <div style={styles.infoRow}>
              <ListDetail />
              <span style={styles.infoRowLabel}>Asistentes</span>
              <span style={styles.infoRowValue}>{event.attendeesCount || 0} personas</span>
            </div>
            <div style={styles.infoRow}>
              <HatblueDetail />
              <span style={styles.infoRowLabel}>Tipo</span>
              <span style={styles.infoRowValue}>{event.attendeesType === 1 ? 'Formal' : 'Casual'}</span>
            </div>
            <div style={styles.infoRow}>
              <OrderDetail />
              <span style={styles.infoRowLabel}>Porciones</span>
              <span style={styles.infoRowValue}>{event.totalPortion || 0} porciones</span>
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <UbicationDetail />
              <h2 style={styles.sectionTitle}>Ubicación</h2>
            </div>
            <div style={styles.card}>
              <p style={styles.addressText}>{event.direction || 'No especificada'}</p>
              {event.reference ? (
                <p style={styles.referenceText}>{event.reference}</p>
              ) : null}
              {event.customMenuRequest ? (
                <p style={styles.referenceText}>{event.customMenuRequest}</p>
              ) : null}
            </div>
          </div>

          {event.customMenuRequest && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <RedhatDetail />
                <h2 style={styles.sectionTitle}>Menú personalizado</h2>
              </div>
              <div style={styles.card}>
                <p style={styles.referenceText}>{event.customMenuRequest}</p>
              </div>
            </div>
          )}

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <RedhatDetail />
              <h2 style={styles.sectionTitle}>Platos elegidos</h2>
            </div>
            <div style={styles.card}>
              {recipes.length > 0 ? (
                recipes.map((recipe, index) => (
                  <div key={recipe.key || index} style={styles.dishItem}>
                    <p style={styles.dishName}>{recipe.MenuNombre} - {recipe.MasterRecipeNombre}</p>
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
                ))
              ) : (
                <p style={styles.emptyText}>No hay platos registrados</p>
              )}
            </div>
          </div>

          {clientComment && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <ListDetail />
                <h2 style={styles.sectionTitle}>Comentarios del cliente</h2>
              </div>
              <div style={styles.card}>
                <p style={styles.emptyText}>{clientComment}</p>
              </div>
            </div>
          )}

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MoneyDetail />
              <h2 style={styles.sectionTitle}>Detalle del servicio</h2>
            </div>
            <div style={styles.card}>
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaLabel}>Estado</span>
                <span style={styles.garantiaValue}>Evento público</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaTotal}>Total</span>
                <span style={styles.garantiaTotalValue}>S/ {Number(event.commissionToChef ?? event.CommissionToChef ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={styles.helpSection}>
            <p style={styles.helpTitle}>Vista de solo lectura</p>
            <p style={styles.helpText}>Para modificaciones, contacta con el servicio al cliente.</p>
          </div>
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          visible={recipeModalVisible}
          onClose={handleCloseRecipeModal}
          recipeName={`${selectedRecipe.MenuNombre} - ${selectedRecipe.MasterRecipeNombre}`}
          masterRecipeId={parseInt(selectedRecipe.MasterRecipeId, 10)}
          menuId={parseInt(selectedRecipe.MenuId, 10)}
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
    gap: 8,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#1A1F24',
    fontWeight: '500',
    flex: 1,
  },
  infoRowValue: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
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
  referenceText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: '20px',
    margin: '0 0 8px 0',
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
    gap: 4,
  },
  viewRecipeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  arrowIcon: {
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
    margin: `${spacing.small}px 0`,
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
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
};
