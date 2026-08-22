import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import { spacing } from '../styles';
import { HelpDetail } from '../assets/svgs';
import RecipeModal from '../components/recipe-modal/recipe-modal';
import { getClientComment } from '../utils/formatters';
import mapIcon from '../assets/images/detalle/map.png';
import profileIcon from '../assets/images/detalle/perfil.png';
import menuIcon from '../assets/images/detalle/menu.png';
import dayIcon from '../assets/images/detalle/dia.png';
import gainIcon from '../assets/images/detalle/ganancia.png';
import rightIcon from '../assets/images/detalle/right.png';

const SUPPORT_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';

/**
 * Vista pública de evento - accesible sin login mediante token encriptado
 * URL: /evento/:token
 * Mismo diseño que el detalle asignado de evento (reservationEventDetail.jsx),
 * sin las acciones privadas (aceptar/rechazar).
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
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.errorText}>{error || 'No se pudo cargar el detalle del evento'}</p>
        </div>
      </div>
    );
  }

  const clientComment = getClientComment(event);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Detalle del Evento</h1>
        <span style={styles.publicBadge}>Vista pública</span>
      </div>

      <div style={styles.content}>
        {/* Cliente */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={profileIcon} alt="Cliente" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Cliente</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>{event.customerName || 'No especificado'}</span>
          </div>
        </div>

        {/* Fecha y Hora */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={dayIcon} alt="Fecha" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Fecha y Hora</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>{formatDate(event.dateEvent)}</span>
            <span style={styles.infoRowValue}>{event.hourEvent || 'No especificada'}</span>
          </div>
        </div>

        {/* Asistentes */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={menuIcon} alt="Asistentes" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Asistentes</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>Cantidad: {event.attendeesCount || 0} personas</span>
            <span style={styles.infoRowValue}>Tipo: {event.attendeesType === 1 ? 'Formal' : 'Casual'}</span>
          </div>
        </div>

        {/* Ubicación */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={mapIcon} alt="Ubicación" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Ubicación</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>{event.direction || 'No especificada'}</span>
            <span style={styles.infoRowValue}>{event.ubication || event.reference || ''}</span>
          </div>
        </div>

        {/* Menú Personalizado */}
        {event.customMenuRequest && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <img src={menuIcon} alt="Menú" style={styles.sectionIcon} />
              <span style={styles.sectionTitle}>Menú Personalizado</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoRowValue}>{event.customMenuRequest}</span>
            </div>
          </div>
        )}

        {/* Platos Elegidos */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={menuIcon} alt="" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Platos elegidos</span>
          </div>
          <div style={styles.card}>
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <div key={recipe.key || index} style={styles.dishCard}>
                  <p style={styles.dishName}>
                    {recipe.MenuNombre} - {recipe.MasterRecipeNombre}
                  </p>
                  <div style={styles.dishFooter}>
                    <span style={styles.portionsText}>{recipe.iCantidadPlatos} porciones</span>
                    <button style={styles.viewRecipeButton} onClick={() => handleViewRecipe(recipe)}>
                      <span style={styles.viewRecipeText}>Ver receta</span>
                      <img src={rightIcon} alt="" style={styles.recipeArrowIcon} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.emptyText}>No hay platos registrados</p>
            )}
          </div>
        </div>

        {/* Comentarios del Cliente */}
        {clientComment && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <span style={styles.sectionTitle}>Comentarios del Cliente</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoRowValue}>{clientComment}</span>
            </div>
          </div>
        )}

        {/* Detalle del servicio — SIEMPRE la comisión de la cocinera, nunca el total del cliente */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={gainIcon} alt="" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Detalle del servicio</span>
          </div>
          <div style={styles.card}>
            <div style={styles.garantiaRow}>
              <span style={styles.garantiaTotal}>Total</span>
              <span style={styles.garantiaTotalValue}>S/ {Number(event.commissionToChef ?? event.CommissionToChef ?? 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botón de Ayuda */}
        <div style={styles.footer}>
          <a href={SUPPORT_CONTACT_URL} style={styles.helpLink}>
            <button style={styles.helpButton}>
              <HelpDetail />
              <span style={styles.helpButtonText}>Necesito Ayuda</span>
            </button>
          </a>
        </div>
      </div>

      {/* Recipe Modal */}
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

// Estilos copiados 1:1 de reservationEventDetail.jsx (diseño canónico de evento).
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: spacing.medium,
    paddingLeft: spacing.medium,
    paddingRight: spacing.medium,
    paddingBottom: spacing.small,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: '#1B2736',
    flex: 1,
  },
  publicBadge: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: `${spacing.medium}px`,
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #DDE6EE',
    borderTop: '4px solid #FF4336',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.small,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1B2736',
    margin: 0,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.medium,
    boxShadow: '0px 2px 4px 0px #289FDF0A, 0px 7px 7px 0px #289FDF0A, 0px 15px 9px 0px #289FDF05, 0px 26px 10px 0px #289FDF03, 0px 41px 11px 0px #289FDF00',
  },
  infoRowLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoRowValue: {
    display: 'block',
    fontSize: 15,
    fontWeight: 500,
    color: '#1B2736',
    lineHeight: '22px',
    wordBreak: 'break-word',
  },
  dishCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: 18,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    boxShadow: '0px 2px 4px 0px #289FDF0A',
  },
  dishName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A1F24',
    marginBottom: 4,
    margin: 0,
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
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    gap: 4,
  },
  viewRecipeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: 500,
  },
  recipeArrowIcon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
    display: 'block',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
  garantiaRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: spacing.small,
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
  helpLink: {
    textDecoration: 'none',
  },
  helpButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingLeft: spacing.medium,
    paddingRight: spacing.medium,
    paddingTop: spacing.small,
    paddingBottom: spacing.small,
    borderRadius: 20,
    backgroundColor: '#FCE9E8',
    border: 'none',
    cursor: 'pointer',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FF4336',
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 16,
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
