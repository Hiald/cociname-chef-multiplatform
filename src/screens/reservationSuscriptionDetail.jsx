import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail, UbicationDetail, RedhatDetail, MoneyDetail, ClockDetail, HelpDetail, OrderDetail, ListDetail, ArrowRightDetail } from '../assets/svgs';
import { RecipeModal } from '../components/recipe-modal';
import { useAuth } from '../hooks/useAuth';
import { formatearFechaConDia, getClientComment, getConceptName, formatCurrency, getPerVisitPortions, parseSubscriptionPaymentConcepts, getSubscriptionChefCommission } from '../utils';
import { loadIngredientDetailsFromChecklist } from '../utils/ingredients';
import { RequestDetailShell } from '../components/request-detail/RequestDetailShell';
import {
  buildSubscriptionScheduleRows,
  getDistrictLabel,
  getReferenceLabel,
  getRequestAllergies,
  getRequestClientComment,
  getRequestCustomerName,
  getRequestServiceAmount,
  getRequestServiceTitle,
  mapRecipesToDishes,
} from '../utils/requestDetail';

const getUnitName = (unitNumber) => {
  const units = {
    1: 'un',
    2: 'kg',
    4: 'lt',
    6: 'cda',
    7: 'cdta',
    8: 'atado',
    9: 'hojas',
    10: 'ramita',
    11: 'tazas',
  };
  return units[unitNumber] || 'un';
};

const formatIngredientQuantity = (size, unit) => {
  const kilo = 1000;

  if (unit === 1) {
    return `${Math.round(size)} un`;
  }

  if (unit === 2) {
    if (size < 1) {
      if (size === 0.25) return '1/4 kg';
      if (size === 0.5) return '1/2 kg';
      if (size === 0.75) return '3/4 kg';
      return `${(size * kilo).toFixed(0)} gr`;
    }
    return `${size.toFixed(2)} kg`;
  }

  if (unit === 4) {
    if (size < 1) {
      return `${(size * 1000).toFixed(0)} ml`;
    }
    return `${size.toFixed(2)} lt`;
  }

  return `${size.toFixed(2)} ${getUnitName(unit)}`;
};

const ReservationSuscriptionDetailScreen = () => {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chefReservationId, setChefReservationId] = useState(null);
  const [, setChefReservation] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [suscriptionInfo, setSuscriptionInfo] = useState(null);
  const { id: reservationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chefData } = useAuth();
  const isActive = location.state?.isActive || false;
  const isRequest = location.state?.isRequest || false;
  const reservationDataFromState = location.state?.reservationData || null;

  console.log('🔍 Estado del componente ReservationSuscriptionDetail:', { 
    reservationId, 
    isActive,
    isRequest,
    locationState: location.state,
    chefData: chefData?.chefId 
  });

  console.log('🔍 Estado del componente:', { 
    reservationId, 
    isActive,
    isRequest,
    locationState: location.state,
    chefData: chefData?.chefId 
  });

  // Función para verificar si está en el rango de tiempo para marcar llegada (1 hora desde inicio)
  const isWithinArrivalWindow = (reservationDate, reservationHour) => {
    if (!reservationDate || !reservationHour) return false;
    
    const now = new Date();
    const [hours, minutes] = reservationHour.split(':').map(Number);
    
    // Parsear fecha en timezone local (evitar UTC)
    const [year, month, day] = reservationDate.split('-').map(Number);
    const reservationDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Ventana de tiempo: desde la hora de reserva hasta 1 hora después
    const windowEnd = new Date(reservationDateTime.getTime() + 60 * 60 * 1000);
    
    console.log('🕐 isWithinArrivalWindow Check (Suscripción):', {
      now: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      reservationDateTime: reservationDateTime.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      windowEnd: windowEnd.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      result: now >= reservationDateTime && now <= windowEnd
    });
    
    return now >= reservationDateTime && now <= windowEnd;
  };

  // Función para verificar si está dentro del tiempo de servicio (para culminar)
  const isWithinServiceWindow = (reservationDate, reservationHour, preparationTime) => {
    if (!reservationDate || !reservationHour) return false;
    
    const now = new Date();
    const [hours, minutes] = reservationHour.split(':').map(Number);
    
    // Parsear fecha en timezone local (evitar UTC)
    const [year, month, day] = reservationDate.split('-').map(Number);
    const reservationDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Ventana de tiempo: desde la hora de reserva hasta hora + preparationTime
    const preparationTimeMs = (preparationTime || 2.5) * 60 * 60 * 1000;
    const windowEnd = new Date(reservationDateTime.getTime() + preparationTimeMs);
    
    console.log('⏰ isWithinServiceWindow Check (Suscripción):', {
      now: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      reservationDateTime: reservationDateTime.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      preparationTime,
      windowEnd: windowEnd.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      result: now >= reservationDateTime && now <= windowEnd
    });
    
    return now >= reservationDateTime && now <= windowEnd;
  };

  const loadReservationDetail = async () => {
    try {
      setLoading(true);

      let reservationData = reservationDataFromState
        ? {
            ...reservationDataFromState,
            id: reservationDataFromState.id
              ?? reservationDataFromState.reservationSuscriptionId
              ?? reservationDataFromState.Id
              ?? Number(reservationId),
            suscriptionId: reservationDataFromState.suscriptionId
              ?? reservationDataFromState.SuscriptionId,
            tipo: 'suscripcion',
          }
        : null;

      // Intentar detalle por ID (puede 404 si aún no está asignada a la chef)
      const reservationResponse = await apiService.getReservationSuscriptionById(parseInt(reservationId, 10));
      if (reservationResponse.success && reservationResponse.data && reservationResponse.data.id) {
        reservationData = {
          ...(reservationData || {}),
          ...reservationResponse.data,
          tipo: 'suscripcion',
        };
      } else if (!reservationData?.suscriptionId && reservationDataFromState?.suscriptionId) {
        // Fallback: buscar hijas por suscriptionId
        const bySuscription = await apiService.getReservationsBySuscriptionId(
          Number(reservationDataFromState.suscriptionId)
        );
        if (bySuscription.success && Array.isArray(bySuscription.data)) {
          const match = bySuscription.data.find((item) => (
            Number(item.id) === Number(reservationId)
            || Number(item.reservationSuscriptionId) === Number(reservationId)
          )) || bySuscription.data[0];
          if (match) {
            reservationData = { ...(reservationData || {}), ...match, tipo: 'suscripcion' };
          }
        }
      }

      // Último recurso: si el chef ya la tiene asignada, buscar en su listado
      if ((!reservationData || !reservationData.suscriptionId) && chefData?.chefId) {
        const chefList = await apiService.listReservationSuscriptionByChefId(chefData.chefId);
        if (chefList.success && Array.isArray(chefList.data)) {
          const match = chefList.data.find((item) => Number(item.id) === Number(reservationId));
          if (match) {
            reservationData = { ...(reservationData || {}), ...match, tipo: 'suscripcion' };
          }
        }
      }
      
      if (reservationData) {
        setReservation(reservationData);
        console.log('Reserva de suscripción cargada:', reservationData);

        const resolvedSuscriptionId = reservationData.suscriptionId ?? reservationData.SuscriptionId;
        const resolvedReservationSuscriptionId = Number(
          reservationData.id ?? reservationData.reservationSuscriptionId ?? reservationId
        );

        if (resolvedSuscriptionId) {
          const suscriptionResponse = await apiService.getSuscriptionById(resolvedSuscriptionId);
          if (suscriptionResponse.success && suscriptionResponse.data) {
            setSuscriptionInfo(suscriptionResponse.data);
          }
        }
        
        try {
          const requestedDishes = reservationData.jsonRequest 
            ? JSON.parse(reservationData.jsonRequest) 
            : [];
          const optionalDishes = reservationData.jsonOptional 
            ? JSON.parse(reservationData.jsonOptional) 
            : [];
          setRecipes([...requestedDishes, ...optionalDishes]);
        } catch (e) {
          console.error('Error parsing recipes:', e);
          setRecipes([]);
        }

        if (reservationData.puchaseIngredients && resolvedReservationSuscriptionId) {
          const ingredientsResponse = await apiService.getIngredientChecklistByReservationSuscription(
            resolvedReservationSuscriptionId
          );

          if (ingredientsResponse.success && ingredientsResponse.data && ingredientsResponse.data.length > 0) {
            const ingredientsDetails = await loadIngredientDetailsFromChecklist(
              ingredientsResponse.data,
              (ingredientId) => apiService.getIngredientById(ingredientId),
              formatIngredientQuantity
            );

            setIngredients(ingredientsDetails);
            const storageKey = `ingredients_suscription_${resolvedReservationSuscriptionId}`;
            const savedChecks = localStorage.getItem(storageKey);
            if (savedChecks) {
              try {
                setCheckedIngredients(JSON.parse(savedChecks));
              } catch (savedChecksError) {
                console.error('Error parsing saved checks:', savedChecksError);
              }
            }
          }
        } else {
          setIngredients([]);
          setCheckedIngredients({});
        }
        
        if (resolvedReservationSuscriptionId) {
          const markingsResponse = await apiService.getChefReservationByReservationSuscriptionId(
            resolvedReservationSuscriptionId
          );
          
          if (markingsResponse.success && markingsResponse.data && markingsResponse.data.length > 0) {
            const marking = markingsResponse.data[0];
            setChefReservationId(marking.id);
            setChefReservation(marking);
            setHasStarted(!!marking.arrivedAt || !!marking.startedAt);
            setHasEnded(!!marking.completedAt);
          }
        }
      }
    } catch (error) {
      console.error('Error loading reservation suscription detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) {
      loadReservationDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, chefData?.chefId]);

  const formatDate = (date) => {
    if (!date) return 'Fecha no especificada';
    if (typeof date === 'string' && date.trim() === '') {
      return 'Fecha no especificada';
    }
    try {
      return formatearFechaConDia(date);
    } catch (error) {
      console.error('Error formatting date:', date, 'Type:', typeof date, 'Error:', error);
      return 'Fecha inválida';
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleArriveHome = async () => {
    if (!chefReservationId) {
      alert('Error: No se encontró el ID de marcación');
      return;
    }
    
    if (!chefData?.chefId || !reservation) {
      alert('Error: Datos incompletos');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Obtener ubicación actual
      const getCurrentLocation = () => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude.toString(),
                  longitude: position.coords.longitude.toString()
                });
              },
              () => {
                resolve({ latitude: '-', longitude: '-' });
              }
            );
          } else {
            resolve({ latitude: '-', longitude: '-' });
          }
        });
      };
      
      const location = await getCurrentLocation();
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
      
      const request = {
        securityCode: reservation.securityCode || '',
        dateReservationStart: dateString,
        hourReservationStart: timeString,
        latitudeStart: location.latitude,
        longitudeStart: location.longitude,
        chefId: chefData.chefId,
        reservationSuscriptionId: parseInt(reservationId),
        startAt: now.toISOString(),
        isEmergency: 0,
        emergencyComment: ''
      };
      
      console.log('Marcando llegada al domicilio (suscripción):', request);
      
      const response = await apiService.markReservationStart(chefReservationId, request);
      
      if (response.success) {
        setHasStarted(true);
        alert('✓ Llegada registrada correctamente');
      } else {
        alert('Error al registrar llegada: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error marking arrival:', error);
      alert('Error al registrar llegada');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishService = async () => {
    if (!chefReservationId) {
      alert('Error: No se encontró el ID de marcación');
      return;
    }
    
    if (!chefData?.chefId || !reservation) {
      alert('Error: Datos incompletos');
      return;
    }
    
    if (!hasStarted) {
      alert('Debes marcar tu llegada antes de culminar el servicio');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Obtener ubicación actual
      const getCurrentLocation = () => {
        return new Promise((resolve) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude.toString(),
                  longitude: position.coords.longitude.toString()
                });
              },
              () => {
                resolve({ latitude: '-', longitude: '-' });
              }
            );
          } else {
            resolve({ latitude: '-', longitude: '-' });
          }
        });
      };
      
      const location = await getCurrentLocation();
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
      
      // Calcular tiempo de preparación en horas
      const preparationTime = reservation.preparationTime || 0;
      
      const request = {
        preparationTime: preparationTime,
        dateReservationEnd: dateString,
        hourReservationEnd: timeString,
        latitudeEnd: location.latitude,
        longitudeEnd: location.longitude,
        chefId: chefData.chefId,
        customerId: reservation.customerId,
        reservationSuscriptionId: parseInt(reservationId),
        finishedAt: now.toISOString()
      };
      
      console.log('Marcando culminación de servicio (suscripción):', request);
      
      const response = await apiService.markReservationEnd(chefReservationId, request);
      
      if (response.success) {
        setHasEnded(true);
        alert('✓ Servicio culminado correctamente');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      } else {
        alert('Error al registrar culminación: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error marking finish:', error);
      alert('Error al registrar culminación del servicio');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMaps = () => {
    if (reservation?.latitude && reservation?.longitude && reservation.latitude !== '-' && reservation.longitude !== '-') {
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

  const handleIngredientCheck = (ingredientId) => {
    const newChecked = {
      ...checkedIngredients,
      [ingredientId]: !checkedIngredients[ingredientId],
    };
    setCheckedIngredients(newChecked);

    const storageKey = `ingredients_suscription_${reservationId}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  };


  const handleAcceptReservation = async () => {
    console.log('=== ACEPTAR RESERVA DE SUSCRIPCIÓN ===');

    const reservationSuscriptionId = Number(
      reservation?.id
      ?? reservation?.reservationSuscriptionId
      ?? reservation?.Id
      ?? reservationId
    );
    const suscriptionId = Number(reservation?.suscriptionId ?? reservation?.SuscriptionId);
    
    if (!chefData?.chefId) {
      alert('Error: No se encontró el ID del chef');
      return;
    }
    
    if (!reservationSuscriptionId) {
      alert('Error: No se encontró el ID de la reserva de suscripción');
      return;
    }

    if (!suscriptionId) {
      alert('Error: No se encontró el ID de la suscripción');
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('Llamando al endpoint con:', {
        chefId: chefData.chefId,
        reservationSuscriptionId,
        suscriptionId,
        assignmentStatus: 1,
      });
      
      const response = await apiService.updateReservationSuscriptionAssignment(
        chefData.chefId,
        reservationSuscriptionId,
        suscriptionId,
        1,
        ''
      );

      console.log('Respuesta del endpoint:', response);

      // Algunos 400 del API igual dejan la asignación hecha: verificar listado del chef
      let assigned = response.success;
      if (!assigned && chefData.chefId) {
        const chefList = await apiService.listReservationSuscriptionByChefId(chefData.chefId);
        assigned = !!(
          chefList.success
          && chefList.data?.some((item) => Number(item.id) === reservationSuscriptionId)
        );
      }

      if (assigned) {
        alert('Suscripción aceptada exitosamente');
        navigate('/reservation?tab=confirmed', { state: { defaultTab: 'confirmed' }, replace: true });
      } else {
        console.error('Error en la respuesta:', response.errorMessage);
        alert('Error al aceptar la suscripción: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error accepting suscription:', error);
      alert('Error al aceptar la suscripción: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReservation = async () => {
    const reservationSuscriptionId = Number(
      reservation?.id
      ?? reservation?.reservationSuscriptionId
      ?? reservation?.Id
      ?? reservationId
    );
    const suscriptionId = Number(reservation?.suscriptionId ?? reservation?.SuscriptionId);

    if (!chefData?.chefId || !reservationSuscriptionId || !suscriptionId || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await apiService.updateReservationSuscriptionAssignment(
        chefData.chefId,
        reservationSuscriptionId,
        suscriptionId,
        2,
        rejectionReason
      );

      if (response.success) {
        alert('Suscripción rechazada exitosamente');
        navigate('/reservation?tab=requests', { state: { defaultTab: 'requests' }, replace: true });
      } else {
        alert('Error al rechazar la suscripción: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error rejecting suscription:', error);
      alert('Error al rechazar la suscripción');
    } finally {
      setSubmitting(false);
    }
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
        <p style={styles.errorText}>No se pudo cargar la reserva de suscripción</p>
        <button style={styles.backButton} onClick={handleGoBack}>
          Volver
        </button>
      </div>
    );
  }

  const clientComment = getClientComment(reservation);
  const portionsPerVisit = getPerVisitPortions(reservation, suscriptionInfo);
  const paymentConcepts = parseSubscriptionPaymentConcepts(
    reservation?.jsonPaymentChef ?? reservation?.JsonPaymentChef
  );
  const chefCommissionPerVisit = getSubscriptionChefCommission(reservation, suscriptionInfo);

  if (isRequest) {
    return (
      <>
        <RequestDetailShell
          onBack={() => navigate('/reservation?tab=requests')}
          serviceTitle={getRequestServiceTitle('suscripcion')}
          clientName={getRequestCustomerName(reservation)}
          scheduleRows={buildSubscriptionScheduleRows(reservation, suscriptionInfo)}
          allergies={getRequestAllergies(reservation)}
          district={getDistrictLabel(reservation)}
          reference={getReferenceLabel(reservation) || reservation.direction || ''}
          dishes={mapRecipesToDishes(recipes, handleViewRecipe)}
          serviceAmount={getRequestServiceAmount({ ...reservation, tipo: 'suscripcion' }, suscriptionInfo)}
          clientComment={getRequestClientComment(reservation)}
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
            portions={selectedRecipe.iCantidadPlatos}
            recipeSteps={selectedRecipe.sPasos}
          />
        )}

        {rejectModalVisible && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalIconContainer}>
                <div style={styles.closeIconCircle}>✕</div>
              </div>
              <h3 style={styles.modalTitle}>¿Rechazar esta reserva?</h3>
              <p style={styles.modalDescription}>Por favor indica el motivo del rechazo</p>
              <textarea
                style={styles.modalTextarea}
                placeholder="Escribe el motivo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <button
                style={{...styles.modalButton, ...styles.modalButtonDanger}}
                onClick={handleRejectReservation}
                disabled={submitting || !rejectionReason.trim()}
                type="button"
              >
                <span style={styles.modalButtonText}>{submitting ? 'Procesando...' : 'Rechazar'}</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={{ ...styles.header, ...styles.customerHeader }}>
        <button style={styles.backButton} onClick={handleGoBack}>
          <div style={styles.backButtonContent}>
            <ArrowLeftDetail />
            <span style={styles.backButtonText}>Atrás</span>
          </div>
        </button>
        <h1 style={styles.customerName}>
          {reservation.customerName} {reservation.customerLastName}
        </h1>
      </div>

      <div style={styles.scrollView}>
        <div style={styles.contentContainer}>
          {/* Arrive Button - Solo en los primeros 15 minutos y si no ha empezado */}
          {isActive && !hasStarted && chefReservationId && 
           reservation && isWithinArrivalWindow(reservation.dateReservation, reservation.hourReservation) && (
            <button 
              style={styles.arriveButton} 
              onClick={handleArriveHome}
              disabled={submitting}
            >
              <div style={styles.arriveButtonContent}>
                <ClockDetail />
                <span style={styles.arriveButtonText}>
                  {submitting ? 'Registrando...' : 'Llegué al domicilio'}
                </span>
              </div>
            </button>
          )}
          
          {/* Finish Button - Solo si ya empezó, no ha terminado y está dentro del tiempo de servicio */}
          {isActive && hasStarted && !hasEnded && chefReservationId && 
           reservation && isWithinServiceWindow(reservation.dateReservation, reservation.hourReservation, reservation.preparationTime) && (
            <button 
              style={styles.finishButton} 
              onClick={handleFinishService}
              disabled={submitting}
            >
              <div style={styles.finishButtonContent}>
                <ClockDetail />
                <span style={styles.finishButtonText}>
                  {submitting ? 'Registrando...' : 'Culminé el servicio'}
                </span>
              </div>
            </button>
          )}

          {/* Subscription Info Card */}
          <div style={styles.infoCardContainer}>
            <div style={styles.suscriptionBadge}>
              <span style={styles.suscriptionBadgeText}>RESERVA DE SUSCRIPCIÓN</span>
            </div>
            
            <div style={styles.infoRow}>
              <ClockDetail />
              <span style={styles.infoRowLabel}>Código Reserva</span>
              <span style={styles.infoRowValue}>{reservation.reservationSuscriptionCode}</span>
            </div>

            <div style={styles.infoRow}>
              <RedhatDetail />
              <span style={styles.infoRowLabel}>Código Suscripción</span>
              <span style={styles.infoRowValue}>{reservation.suscriptionCode}</span>
            </div>

            <div style={styles.infoRow}>
              <ListDetail />
              <span style={styles.infoRowLabel}>Comensales</span>
              <span style={styles.infoRowValue}>{reservation.diner} personas</span>
            </div>

            <div style={styles.infoRow}>
              <ClockDetail />
              <span style={styles.infoRowLabel}>Fecha y Hora</span>
              <span style={styles.infoRowValue}>
                {reservation.dateReservation ? `${formatDate(reservation.dateReservation)} - ${reservation.hourReservation}` : 'No especificada'}
              </span>
            </div>

            <div style={styles.infoRow}>
              <OrderDetail />
              <span style={styles.infoRowLabel}>Porciones</span>
              <span style={styles.infoRowValue}>{portionsPerVisit} porciones</span>
            </div>

            <div style={styles.infoRow}>
              <RedhatDetail />
              <span style={styles.infoRowLabel}>Reserva</span>
              <span style={styles.infoRowValue}>
                {reservation.suscriptionCount} de {reservation.visitsPerMonth}
              </span>
            </div>
          </div>

          {reservation.puchaseIngredients && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <ListDetail />
                <h2 style={styles.sectionTitle}>Lista de compra</h2>
              </div>
              <div style={styles.card}>
                {ingredients.length > 0 ? (
                  ingredients.map((ingredient) => (
                    <div key={ingredient.id} style={styles.ingredientRow}>
                      <input
                        type="checkbox"
                        checked={checkedIngredients[ingredient.id] || false}
                        onChange={() => handleIngredientCheck(ingredient.id)}
                        style={styles.checkbox}
                      />
                      <div style={styles.ingredientInfo}>
                        <span style={styles.ingredientName}>{ingredient.ingredientName}</span>
                        <span style={styles.ingredientQuantity}>{ingredient.quantity}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={styles.emptyText}>No hay ingredientes registrados</p>
                )}
              </div>
            </div>
          )}

          {/* Address Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <UbicationDetail />
              <h2 style={styles.sectionTitle}>Dirección</h2>
            </div>
            <div style={styles.card}>
              <p style={styles.addressText}>{reservation.direction}</p>
              <p style={styles.districtText}>Distrito: {reservation.district}</p>
              {reservation.reference && (
                <p style={styles.referenceText}>Referencia: {reservation.reference}</p>
              )}
              <button style={styles.mapButton} onClick={handleOpenMaps}>
                <span style={styles.mapButtonText}>Abrir en Google Maps</span>
              </button>
            </div>
          </div>

          {/* Platos Elegidos */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <RedhatDetail />
              <h2 style={styles.sectionTitle}>Platos elegidos</h2>
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

          {/* Payment Details */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MoneyDetail />
              <h2 style={styles.sectionTitle}>Detalles de Pago</h2>
            </div>
            <div style={styles.card}>
              {paymentConcepts.length > 0 ? (
                paymentConcepts.map((concept, index) => (
                  <div key={index} style={styles.garantiaRow}>
                    <span style={styles.garantiaLabel}>{getConceptName(concept.concept)}</span>
                    <span style={styles.garantiaValue}>{formatCurrency(concept.amount)}</span>
                  </div>
                ))
              ) : (
                <div style={styles.garantiaRow}>
                  <span style={styles.garantiaLabel}>Comisión chef</span>
                  <span style={styles.garantiaValue}>{formatCurrency(chefCommissionPerVisit)}</span>
                </div>
              )}
              <div style={styles.divider} />
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaTotal}>Total por visita</span>
                <span style={styles.garantiaTotalValue}>{formatCurrency(chefCommissionPerVisit)}</span>
              </div>
            </div>
          </div>

          {(reservation.comments || clientComment) && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <HelpDetail />
                <h2 style={styles.sectionTitle}>Comentarios</h2>
              </div>
              <div style={styles.card}>
                {reservation.comments && (
                  <div style={styles.commentSectionFirst}>
                    <p style={styles.commentLabel}>Comentarios del chef:</p>
                    <p style={styles.commentText}>{reservation.comments}</p>
                  </div>
                )}
                {clientComment && (
                  <div style={reservation.comments ? styles.commentSection : styles.commentSectionFirst}>
                    <p style={styles.commentLabel}>Comentarios del cliente:</p>
                    <p style={styles.commentText}>{clientComment}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons for Pending Requests - Solo si es solicitud pendiente */}
          {isRequest && (
            <div style={styles.actionButtonsContainer}>
              <button 
                style={styles.acceptButton}
                onClick={() => {
                  console.log('🔵 Click en botón Aceptar');
                  handleAcceptReservation();
                }}
                disabled={submitting}
              >
                <span style={styles.acceptButtonText}>
                  {submitting ? 'Procesando...' : 'Aceptar'}
                </span>
              </button>
              <button 
                style={styles.rejectButton}
                onClick={() => setRejectModalVisible(true)}
              >
                <span style={styles.rejectButtonText}>Rechazar</span>
              </button>
            </div>
          )}

          {/* Help Section */}
          <div style={styles.section}>
            <div style={styles.card}>
              <div style={styles.helpSection}>
                <h3 style={styles.helpTitle}>¿Necesitas ayuda?</h3>
                <p style={styles.helpText}>Contacta con nuestro equipo de soporte</p>
                <button style={styles.helpButton}>
                  <div style={styles.helpButtonContent}>
                    <HelpDetail />
                    <span style={styles.helpButtonText}>Llamar a Soporte</span>
                  </div>
                </button>
              </div>
            </div>
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

      {/* Reject Modal */}
      {rejectModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalIconContainer}>
              <div style={styles.closeIconCircle}>
                ✕
              </div>
            </div>
            <h3 style={styles.modalTitle}>¿Rechazar esta reserva?</h3>
            <p style={styles.modalDescription}>
              Por favor indica el motivo del rechazo
            </p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Escribe el motivo..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <button 
              style={{...styles.modalButton, ...styles.modalButtonDanger}}
              onClick={handleRejectReservation}
              disabled={submitting || !rejectionReason.trim()}
            >
              <span style={styles.modalButtonText}>
                {submitting ? 'Procesando...' : 'Rechazar'}
              </span>
            </button>
            <button 
              style={styles.modalButtonSecondary}
              onClick={() => !submitting && setRejectModalVisible(false)}
              disabled={submitting}
            >
              <span style={styles.modalButtonSecondaryText}>Cancelar</span>
            </button>
          </div>
        </div>
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  customerName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FF5136',
    margin: `${spacing.small}px 0 0 0`,
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
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.medium}px`,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  suscriptionBadge: {
    backgroundColor: '#F59E0B',
    padding: '6px 12px',
    borderRadius: '12px',
    alignSelf: 'flex-start',
    marginBottom: `${spacing.small}px`,
  },
  suscriptionBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: '0.5px',
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
    width: '100%',
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
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
  ingredientRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #F3F4F6',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginRight: `${spacing.small}px`,
    cursor: 'pointer',
    accentColor: '#FF5136',
  },
  ingredientInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  ingredientName: {
    fontSize: '14px',
    color: '#1A1F24',
    fontWeight: '500',
    marginBottom: '2px',
  },
  ingredientQuantity: {
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
    width: '100%',
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
  finishButton: {
    backgroundColor: '#10B981',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  finishButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: '8px',
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
  commentSectionFirst: {
    marginTop: 0,
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
  actionButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: `${spacing.small}px`,
    marginBottom: `${spacing.medium}px`,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2EBE60',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  acceptButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF51361A',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  rejectButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FF5136',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: `${spacing.medium}px`,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.large}px`,
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  modalIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: `${spacing.medium}px`,
  },
  checkIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#D1FAE5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: '#EF4444',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: `${spacing.small}px`,
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: `${spacing.medium}px`,
    lineHeight: '20px',
  },
  modalTextarea: {
    width: '100%',
    padding: `${spacing.small}px`,
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1A1F24',
    marginBottom: `${spacing.medium}px`,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalButton: {
    width: '100%',
    padding: '16px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: `${spacing.small}px`,
  },
  modalButtonPrimary: {
    backgroundColor: '#FF5136',
  },
  modalButtonDanger: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonSecondary: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  modalButtonSecondaryText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
  },
};

export default ReservationSuscriptionDetailScreen;
