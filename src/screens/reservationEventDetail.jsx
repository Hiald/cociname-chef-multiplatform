import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail, UbicationDetail, RedhatDetail, MoneyDetail, ClockDetail, HelpDetail, OrderDetail, ListDetail } from '../assets/svgs';
import { formatearFechaConDia } from '../utils/formatters';
import { RecipeModal } from '../components/recipe-modal';
import mapIcon from '../assets/images/detalle/map.png';
import profileIcon from '../assets/images/detalle/perfil.png';
import menuIcon from '../assets/images/detalle/menu.png';
import dayIcon from '../assets/images/detalle/dia.png';
import upIcon from '../assets/images/detalle/up.png';

const ReservationEventDetailScreen = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    dishes: false,
  });
  const { id: eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const eventDataFromState = location.state?.reservationData || null;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        const eventResponse = await apiService.getReservationEventById(parseInt(eventId, 10));
        const eventData = eventResponse.success && eventResponse.data
          ? eventResponse.data
          : eventDataFromState;

        if (!isMounted || !eventData) {
          return;
        }

        setEvent(eventData);

        // Mapear eventDetails directamente como platos
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
        }
      } catch (error) {
        console.error('Error loading event detail:', error);
        if (isMounted && eventDataFromState) {
          setEvent(eventDataFromState);
        }
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
  }, [eventId, eventDataFromState]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const formatDate = (date) => {
    return formatearFechaConDia(date);
  };

  const handleViewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setRecipeModalVisible(true);
  };

  const handleCloseRecipeModal = () => {
    setRecipeModalVisible(false);
    setTimeout(() => setSelectedRecipe(null), 300);
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={handleGoBack}>
            <ArrowLeftDetail />
          </button>
        </div>
        <div style={styles.content}>
          <p style={styles.errorText}>No se pudo cargar el detalle del evento</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleGoBack}>
          <ArrowLeftDetail />
        </button>
        <h1 style={styles.title}>Detalle del Evento</h1>
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
            <span style={styles.infoRowValue}>{event.contactPhone || 'Sin teléfono'}</span>
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
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('dishes')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={menuIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Platos elegidos</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.dishes ? {...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed} : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.dishes && (
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
                        <img src={upIcon} alt="" style={styles.recipeArrowIcon} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>No hay platos registrados</p>
              )}
            </div>
          )}
        </div>

        {/* Comentarios del Cliente */}
        {event.commentsClient && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <span style={styles.sectionTitle}>Comentarios del Cliente</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoRowValue}>{event.commentsClient}</span>
            </div>
          </div>
        )}

        {/* Botón de Ayuda */}
        <div style={styles.footer}>
          <a href="https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta" style={styles.helpLink}>
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
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: '#1B2736',
    flex: 1,
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
  sectionHeaderButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    marginBottom: spacing.small,
    cursor: 'pointer',
  },
  sectionHeaderLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    flexShrink: 0,
  },
  sectionToggleIcon: {
    width: 18,
    height: 18,
    objectFit: 'contain',
    display: 'block',
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  },
  sectionToggleIconCollapsed: {
    transform: 'rotate(180deg)',
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
    transform: 'rotate(90deg)',
    display: 'block',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
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

export default ReservationEventDetailScreen;
