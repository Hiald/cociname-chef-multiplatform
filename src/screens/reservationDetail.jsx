import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { ArrowLeftDetail, UbicationDetail, RedhatDetail, MoneyDetail, ArrowRightDetail, ChecklistDetail, ClockDetail, HelpDetail, OrderDetail, ListDetail, HatblueDetail } from '../assets/svgs';
import { RecipeModal } from '../components/recipe-modal';
import { getConceptName } from '../utils/formatters';

const ReservationDetailScreen = () => {
  const [reservation, setReservation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const { id: reservationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = location.state?.isActive || false;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar detalle de la reserva
        const reservationResponse = await apiService.getReservationById(reservationId);
        
        if (isMounted && reservationResponse.success && reservationResponse.data) {
          setReservation(reservationResponse.data);
          
          // Cargar recetas de la reserva
          const recipesResponse = await apiService.getReservationRecipes(reservationId);
          
          if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
            // Parsear jsonRequest para obtener los platos
            const firstRecipe = recipesResponse.data[0];
            try {
              const requestedDishes = JSON.parse(firstRecipe.jsonRequest);
              const optionalDishes = firstRecipe.jsonOptional 
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

  // eslint-disable-next-line no-unused-vars
  const loadReservationDetail = async () => {
    try {
      setLoading(true);
      
      // Cargar detalle de la reserva
      const reservationResponse = await apiService.getReservationById(reservationId);
      
      if (reservationResponse.success && reservationResponse.data) {
        setReservation(reservationResponse.data);
        
        // Cargar recetas de la reserva
        const recipesResponse = await apiService.getReservationRecipes(reservationId);
        
        if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
          // Parsear jsonRequest para obtener los platos
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
      }
    } catch (error) {
      console.error('Error loading reservation detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return d.toLocaleDateString('es-ES', options);
  };

  const getStatusInfo = (status) => {
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
    navigate(-1);
  };

  const handleArriveHome = () => {
    // Lógica para marcar que llegaste al domicilio
    console.log('Llegué al domicilio');
  };
  const handleOpenMaps = () => {
    if (reservation && reservation.latitude && reservation.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${reservation.latitude},${reservation.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleViewRecipe = (recipe) => {
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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>No se encontró la reserva</p>
        <button style={styles.backButton} onClick={handleGoBack}>
          <span style={styles.backButtonText}>Volver</span>
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(reservation.statusReservation);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleGoBack}>
          <div style={styles.backButtonContent}>
            <ArrowLeftDetail />
            <span style={styles.backButtonText}>Volver</span>
          </div>
        </button>
        <div style={{...styles.statusBadge, backgroundColor: statusInfo.bgColor}}>
          <span style={{...styles.statusBadgeText, color: statusInfo.color}}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      <div style={{...styles.scrollView, ...styles.contentContainer}}>
        {/* Customer Name */}
        <div style={styles.customerHeader}>
          <h2 style={styles.customerName}>
            {reservation.customerName || 'Cliente'} {reservation.customerLastName || ''}
          </h2>
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

        {/* Arrive Button - Solo si es activa */}
        {isActive && (
          <button style={styles.arriveButton} onClick={handleArriveHome}>
            <div style={styles.arriveButtonContent}>
              <ChecklistDetail />
              <span style={styles.arriveButtonText}>Llegué al domicilio</span>
            </div>
          </button>
        )}

        {/* Ubicación */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <UbicationDetail />
            <h3 style={styles.sectionTitle}>Ubicación</h3>
          </div>
          <div style={styles.card}>
            <p style={styles.addressText}>{reservation.direction}</p>
            <p style={styles.districtText}>Distrito {reservation.district}</p>
            {reservation.reference && (
              <p style={styles.referenceText}>
                {reservation.reference}
              </p>
            )}
            <button style={styles.mapButton} onClick={handleOpenMaps}>
              <span style={styles.mapButtonText}>Abrir en Maps</span>
            </button>
          </div>
        </div>

        {/* Platos Elegidos */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <RedhatDetail />
            <h3 style={styles.sectionTitle}>Platos elegidos</h3>
          </div>
          <div style={styles.card}>
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
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
              ))
            ) : (
              <p style={styles.emptyText}>No hay platos registrados</p>
            )}
          </div>
        </div>

        {/* Mi garantía */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <MoneyDetail />
            <h3 style={styles.sectionTitle}>Mi ganancia</h3>
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
                    <span style={styles.garantiaLabel}>Comisión chef</span>
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

        {/* Help Section */}
        <div style={styles.helpSection}>
          <p style={styles.helpTitle}>¿Necesitas ayuda?</p>
          <p style={styles.helpText}>Comunícate con un asesor</p>
          <button style={styles.helpButton}>
            <div style={styles.helpButtonContent}>
              <HelpDetail />
              <span style={styles.helpButtonText}>Ayuda con mi servicio</span>
            </div>
          </button>
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
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: `${spacing.large}px`,
  },
  errorText: {
    fontSize: '16px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
  backButton: {
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  backButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1A1F24',
    fontSize: '16px',
    fontWeight: '600',
    marginLeft: '4px',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
    backgroundColor: '#FFFFFF',
  },
  customerHeader: {
    paddingBottom: `${spacing.small}px`,
    marginBottom: `${spacing.small}px`,
  },
  customerName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FF5136',
    margin: 0,
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
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
  },
  statusBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.medium}px`,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  infoRowLabel: {
    fontSize: '13px',
    color: '#1A1F24',
    marginLeft: `${spacing.small}px`,
    fontWeight: '500',
    flex: 1,
  },
  infoRowValue: {
    fontSize: '12px',
    color: '#6B7280',
  },
  arriveButton: {
    backgroundColor: '#FF5136',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    border: 'none',
    cursor: 'pointer',
  },
  arriveButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  arriveButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: '8px',
  },
  section: {
    marginBottom: `${spacing.large}px`,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: `${spacing.small}px`,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    marginLeft: `${spacing.small}px`,
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  addressText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  districtText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.small}px`,
  },
  referenceText: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '20px',
    marginBottom: `${spacing.medium}px`,
  },
  mapButton: {
    backgroundColor: '#FF51361A',
    padding: '10px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  mapButtonText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF5136',
  },
  dishItem: {
    marginBottom: `${spacing.medium}px`,
  },
  dishName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  dishFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionsText: {
    fontSize: '13px',
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
  },
  viewRecipeText: {
    fontSize: '13px',
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: '4px',
  },
  arrowIcon: {
    marginTop: '5px',
  },
  garantiaRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  garantiaLabel: {
    fontSize: '14px',
    color: '#6B7280',
  },
  garantiaValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
  },
  divider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    margin: `${spacing.small}px 0`,
  },
  garantiaTotal: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
  },
  garantiaTotalValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
  },
  contactRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: `${spacing.small}px`,
  },
  contactText: {
    fontSize: '14px',
    color: '#1A1F24',
    marginLeft: `${spacing.small}px`,
  },
  commentSection: {
    marginTop: `${spacing.medium}px`,
    paddingTop: `${spacing.medium}px`,
    borderTop: '1px solid #E5E7EB',
  },
  commentLabel: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  commentText: {
    fontSize: '14px',
    color: '#1A1F24',
    lineHeight: '20px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
  helpSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  helpText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
  helpButton: {
    backgroundColor: '#FF5136',
    padding: `16px ${spacing.medium}px`,
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
  },
  helpButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: '8px',
  },
};

export default ReservationDetailScreen;