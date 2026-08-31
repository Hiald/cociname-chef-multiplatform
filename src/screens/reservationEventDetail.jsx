import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail } from '../assets/svgs';
import {
  formatearFechaConDia,
  formatIngredientQuantity,
  getClientComment,
  getChefPaymentBreakdown,
  getDistrictName,
} from '../utils/formatters';
import { loadIngredientDetailsFromChecklist } from '../utils/ingredients';
import { useAuth } from '../hooks/useAuth';
import { RecipeModal } from '../components/recipe-modal';
import { RequestDetailShell } from '../components/request-detail/RequestDetailShell';
import {
  buildEventScheduleRows,
  getDistrictLabel,
  getReferenceLabel,
  getRequestAllergies,
  getRequestCustomerName,
  getRequestServiceAmount,
  getRequestServiceTitle,
  mapRecipesToDishes,
} from '../utils/requestDetail';
import {
  DetalleContainer,
  DetalleContent,
  DetalleHeader,
  StatusBadge,
  CustomerHeader,
  InfoCard,
  Seccion,
  UbicacionContenido,
  ListaPlatos,
  ListaIngredientes,
  BloqueMonto,
  ComentariosCliente,
  HelpSection,
  LoadingScreen,
} from '../components/detalle-reserva/DetalleReservaKit';
import mapIcon from '../assets/images/detalle/map.png';
import menuIcon from '../assets/images/detalle/menu.png';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import listIcon from '../assets/images/detalle/lista.png';
import chefIcon from '../assets/images/detalle/chef.png';
import gainIcon from '../assets/images/detalle/ganancia.png';

// Badge de estado del evento. StatusEvent: 0 Draft, 1 En revisión, 2 Confirmado,
// 3 Activo, 4 Completado, 5 Cancelado (ver specs/reservation-event.yaml).
const getEventStatusInfo = (statusEvent) => {
  switch (Number(statusEvent)) {
    case 3:
      return { text: 'EN CURSO', color: '#2EBE60', bgColor: '#2EBE601A' };
    case 4:
      return { text: 'COMPLETADO', color: '#6B7280', bgColor: '#E5E7EB' };
    case 5:
      return { text: 'CANCELADO', color: '#FF5136', bgColor: '#FF51361A' };
    default:
      return { text: 'PROXIMA', color: '#1763C9', bgColor: '#EAF4FB' };
  }
};

const ReservationEventDetailScreen = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { id: eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chefData } = useAuth();
  const eventDataFromState = location.state?.reservationData || null;
  const isRequest = location.state?.isRequest || false;

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

        // Lista de compra: igual que en la reserva independiente, solo se pide
        // cuando el evento lleva compras. El typo PuchaseIngredients es histórico.
        if (eventData.puchaseIngredients) {
          const ingredientsResponse = await apiService.getIngredientChecklistByReservationEvent(
            parseInt(eventId, 10)
          );

          if (isMounted && ingredientsResponse.success && ingredientsResponse.data?.length > 0) {
            const ingredientsDetails = await loadIngredientDetailsFromChecklist(
              ingredientsResponse.data,
              (ingredientId) => apiService.getIngredientById(ingredientId),
              formatIngredientQuantity
            );

            if (isMounted) {
              setIngredients(ingredientsDetails);

              const storageKey = `ingredients_event_${eventId}`;
              const savedChecks = localStorage.getItem(storageKey);
              if (savedChecks) {
                try {
                  setCheckedIngredients(JSON.parse(savedChecks));
                } catch (savedChecksError) {
                  console.error('Error parsing saved checks:', savedChecksError);
                }
              }
            }
          }
        } else if (isMounted) {
          setIngredients([]);
          setCheckedIngredients({});
        }

        // Mapear eventDetails directamente como platos
        if (eventData.eventDetails && Array.isArray(eventData.eventDetails) && eventData.eventDetails.length > 0) {
          const mappedRecipes = eventData.eventDetails.map((dish) => ({
            MenuNombre: dish.menuNameSnapshot || '',
            MasterRecipeNombre: dish.recipeNameSnapshot || 'original',
            iCantidadPlatos: dish.portions || 1,
            MasterRecipeId: dish.masterRecipeId,
            MenuId: dish.menuId,
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

  const handleIngredientCheck = (ingredientId) => {
    const newChecked = { ...checkedIngredients, [ingredientId]: !checkedIngredients[ingredientId] };
    setCheckedIngredients(newChecked);
    localStorage.setItem(`ingredients_event_${eventId}`, JSON.stringify(newChecked));
  };

  const handleOpenMaps = () => {
    if (event?.latitude && event?.longitude) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`,
        '_blank'
      );
    }
  };

  const handleAcceptReservation = async () => {
    if (!chefData?.chefId || !event?.id) {
      alert('Error: Datos incompletos');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.updateReservationEventAssignment(
        chefData.chefId,
        {
          eventReservationId: event.id,
          chefId: chefData.chefId,
          assignmentStatus: 1,
          status: true,
        }
      );

      if (response.success) {
        setAcceptModalVisible(true);
      } else {
        alert('Error al aceptar el evento: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error accepting event:', error);
      alert('Error al aceptar el evento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAcceptModal = () => {
    setAcceptModalVisible(false);
    navigate('/reservation', { state: { defaultTab: 'confirmed' } });
  };

  const handleRejectReservation = async () => {
    if (!chefData?.chefId || !event?.id || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.updateReservationEventAssignment(
        chefData.chefId,
        {
          eventReservationId: event.id,
          chefId: chefData.chefId,
          assignmentStatus: 2,
          rejectionReason: rejectionReason.trim(),
          status: false,
        }
      );

      if (response.success) {
        setRejectionReason('');
        setRejectModalVisible(false);
        navigate('/reservation', { state: { defaultTab: 'requests' } });
      } else {
        alert('Error al rechazar el evento: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      alert('Error al rechazar el evento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!event) {
    return (
      <DetalleContainer>
        <DetalleHeader>
          <button style={styles.backButton} onClick={handleGoBack} type="button">
            <ArrowLeftDetail />
          </button>
        </DetalleHeader>
        <DetalleContent>
          <p style={styles.errorText}>No se pudo cargar el detalle del evento</p>
        </DetalleContent>
      </DetalleContainer>
    );
  }

  const clientComment = getClientComment(event);

  if (isRequest) {
    const eventComment = [clientComment, event.customMenuRequest].filter(Boolean).join('\n\n');

    return (
      <>
        <RequestDetailShell
          onBack={() => navigate('/reservation?tab=requests')}
          serviceTitle={getRequestServiceTitle('evento')}
          clientName={getRequestCustomerName(event)}
          isEvent
          scheduleRows={buildEventScheduleRows(event)}
          allergies={getRequestAllergies(event)}
          district={getDistrictLabel(event) || event.direction || ''}
          reference={getReferenceLabel(event)}
          dishes={mapRecipesToDishes(recipes, handleViewRecipe)}
          serviceAmount={getRequestServiceAmount({ ...event, tipo: 'evento' })}
          clientComment={eventComment}
          onAccept={handleAcceptReservation}
          onReject={() => setRejectModalVisible(true)}
          submitting={submitting}
        />

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

        {acceptModalVisible && (
          <div style={styles.modalOverlay} onClick={() => !submitting && setAcceptModalVisible(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>¿Evento aceptado?</h3>
              <p style={styles.modalDescription}>Lo verás en tus reservas confirmadas.</p>
              <button style={styles.modalButton} onClick={handleCloseAcceptModal} type="button">
                Ver reservas
              </button>
            </div>
          </div>
        )}

        {rejectModalVisible && (
          <div style={styles.modalOverlay} onClick={() => !submitting && setRejectModalVisible(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={styles.modalTitle}>Evento rechazado</h3>
              <textarea
                style={styles.modalTextarea}
                placeholder="Motivo de rechazo"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={submitting}
                rows={4}
              />
              <button
                style={styles.modalButtonDanger}
                onClick={handleRejectReservation}
                disabled={submitting || !rejectionReason.trim()}
                type="button"
              >
                {submitting ? 'Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const statusInfo = getEventStatusInfo(event.statusEvent);
  const tipoAsistentes = event.attendeesType === 1 ? 'Formal' : 'Casual';
  const tieneCoordenadas = Boolean(
    event.latitude && event.longitude
    && event.latitude !== '-' && event.longitude !== '-'
    && Number(event.latitude) !== 0
  );

  // El total es la SUMA de los conceptos, no el campo suelto de comisión.
  // Ver getChefPaymentBreakdown en utils/formatters.
  const { conceptos, totalTexto } = getChefPaymentBreakdown(event);

  return (
    <DetalleContainer>
      <DetalleHeader>
        <button style={styles.backButton} onClick={handleGoBack} type="button">
          <ArrowLeftDetail />
        </button>
        <StatusBadge text={statusInfo.text} color={statusInfo.color} bgColor={statusInfo.bgColor} />
      </DetalleHeader>

      <DetalleContent>
        <CustomerHeader
          nombre={`${event.customerName || 'Cliente'} ${event.customerLastName || ''}`.trim()}
        />

        <InfoCard
          rows={[
            { icon: dayIcon, label: formatDate(event.dateEvent) },
            { icon: hourIcon, label: event.hourEvent || 'Hora no especificada' },
            { icon: listIcon, label: event.puchaseIngredients ? 'Con compras' : 'Sin compras' },
            { icon: chefIcon, label: `${event.attendeesCount || 0} asistentes · ${tipoAsistentes}` },
          ]}
        />

        <ComentariosCliente texto={clientComment} />

        {event.puchaseIngredients && ingredients.length > 0 && (
          <Seccion icon={listIcon} titulo="Lista de compra">
            <ListaIngredientes
              ingredientes={ingredients}
              checked={checkedIngredients}
              onCheck={handleIngredientCheck}
              subtitulo="Debes comprar todos estos ingredientes."
            />
          </Seccion>
        )}

        <Seccion icon={mapIcon} titulo="Ubicación">
          <UbicacionContenido
            direccion={event.direction}
            distrito={getDistrictName(event.district)}
            referencia={event.reference || event.ubication}
            onAbrirMaps={tieneCoordenadas ? handleOpenMaps : null}
          />
        </Seccion>

        {event.customMenuRequest && (
          <Seccion icon={menuIcon} titulo="Menú personalizado">
            <ComentariosCliente texto={event.customMenuRequest} />
          </Seccion>
        )}

        {recipes.length > 0 && (
          <Seccion icon={chefIcon} titulo="Platos elegidos">
            <ListaPlatos
              platos={recipes.map((recipe, index) => ({
                key: recipe.key || index,
                nombre: `${recipe.MenuNombre} - ${recipe.MasterRecipeNombre}`,
                porciones: `${recipe.iCantidadPlatos} porciones`,
                // Sin MasterRecipeId el modal no puede cargar nada: mejor no
                // ofrecer "Ver receta" que abrir una ficha vacía.
                onVerReceta: recipe.MasterRecipeId ? () => handleViewRecipe(recipe) : null,
              }))}
            />
          </Seccion>
        )}

        <Seccion icon={gainIcon} titulo="Detalle del servicio">
          <BloqueMonto conceptos={conceptos} totalValor={totalTexto} />
        </Seccion>

        <HelpSection />
      </DetalleContent>

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
    </DetalleContainer>
  );
};

// Solo quedan los estilos que el kit no cubre: el botón "Volver", el texto de
// error y los modales de aceptar/rechazar de la vista de solicitud.
const styles = {
  backButton: {
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  errorText: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 31, 36, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '360px',
    boxSizing: 'border-box',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: '0 0 8px',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 20px',
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#1763C9',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalTextarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1A1F24',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '16px',
    boxSizing: 'border-box',
  },
  modalButtonDanger: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#FF5136',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ReservationEventDetailScreen;
