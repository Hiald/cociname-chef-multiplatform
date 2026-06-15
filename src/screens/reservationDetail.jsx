import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import { ArrowLeftDetail, ChecklistDetail } from '../assets/svgs';
import { RecipeModal } from '../components/recipe-modal';
import { getConceptName } from '../utils/formatters';
import { formatearFechaConDia } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import { sortIngredientsAlphabetically } from '../utils/ingredients';
import profileIcon from '../assets/images/detalle/perfil.png';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import menuIcon from '../assets/images/detalle/menu.png';
import chefIcon from '../assets/images/detalle/chef.png';
import mapIcon from '../assets/images/detalle/map.png';
import gainIcon from '../assets/images/detalle/ganancia.png';
import upIcon from '../assets/images/detalle/up.png';
import rightIcon from '../assets/images/detalle/right.png';
import helpIcon from '../assets/images/detalle/ayuda.png';
import listIcon from '../assets/images/detalle/lista.png';

const SUPPORT_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';
const CARD_SHADOW = '0px 2px 4px 0px #289FDF0A, 0px 7px 7px 0px #289FDF0A, 0px 15px 9px 0px #289FDF05, 0px 26px 10px 0px #289FDF03, 0px 41px 11px 0px #289FDF00';

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

const ReservationDetailScreen = () => {
  const [reservation, setReservation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [chefReservationId, setChefReservationId] = useState(null);
  const [, setChefReservation] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({
    shopping: false,
    location: false,
    dishes: false,
    gain: false,
  });
  const { id: reservationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chefData } = useAuth();
  const isActive = location.state?.isActive || false;
  const isRequest = location.state?.isRequest || false;
  const source = location.state?.source || null;
  const originTab = location.state?.originTab || (isRequest ? 'requests' : 'confirmed');
  const showPast = location.state?.showPast === true;
  const reservationDataFromState = location.state?.reservationData || null;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        let reservationData = reservationDataFromState;
        
        // Si hay datos del estado, usarlos; si no, cargar del API
        if (!reservationDataFromState) {
          const reservationResponse = await apiService.getReservationById(reservationId);
          if (isMounted && reservationResponse.success && reservationResponse.data) {
            reservationData = reservationResponse.data;
          }
        }
        
        if (isMounted && reservationData) {
          setReservation(reservationData);

          if (reservationData.puchaseIngredients) {
            const ingredientsResponse = await apiService.getIngredientChecklistByReservation(parseInt(reservationId, 10));

            if (ingredientsResponse.success && ingredientsResponse.data && ingredientsResponse.data.length > 0) {
              const checklistData = ingredientsResponse.data[0];

              if (checklistData.jsonIngredientsCheckList) {
                try {
                  const parsedIngredients = JSON.parse(checklistData.jsonIngredientsCheckList);
                  const ingredientsDetails = await Promise.all(
                    parsedIngredients.map(async (item) => {
                      try {
                        const details = await apiService.getIngredientById(item.IngredientId);
                        if (details.success && details.data) {
                          const size = parseFloat(item.TotalSize);
                          return {
                            id: item.IngredientId,
                            ingredientName: details.data.name,
                            quantity: formatIngredientQuantity(size, details.data.unit),
                          };
                        }
                      } catch (ingredientError) {
                        console.error(`Error cargando ingrediente ${item.IngredientId}:`, ingredientError);
                      }

                      return {
                        id: item.IngredientId,
                        ingredientName: `Ingrediente #${item.IngredientId}`,
                        quantity: `${parseFloat(item.TotalSize).toFixed(2)} kg`,
                      };
                    })
                  );

                  if (isMounted) {
                    setIngredients(sortIngredientsAlphabetically(ingredientsDetails));
                    const storageKey = `ingredients_reservation_${reservationId}`;
                    const savedChecks = localStorage.getItem(storageKey);
                    if (savedChecks) {
                      try {
                        setCheckedIngredients(JSON.parse(savedChecks));
                      } catch (savedChecksError) {
                        console.error('Error parsing saved checks:', savedChecksError);
                      }
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing jsonIngredientsCheckList:', parseError);
                }
              }
            }
          } else if (isMounted) {
            setIngredients([]);
            setCheckedIngredients({});
          }
          
          // SIEMPRE cargar recetas del API, incluso cuando hay datos del estado
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
          
          // Cargar marcaciones de chef si existe reservationId
          const markingsResponse = await apiService.getChefReservationByReservationId(reservationId);
          
          if (isMounted && markingsResponse.success && markingsResponse.data && markingsResponse.data.length > 0) {
            const marking = markingsResponse.data[0];
            setChefReservationId(marking.id);
            setChefReservation(marking);
            setHasStarted(!!marking.arrivedAt || !!marking.startedAt);
            setHasEnded(!!marking.completedAt);
            console.log('Marcaciones cargadas:', marking);
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
  }, [reservationId, reservationDataFromState]);

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
    
    console.log('🕐 isWithinArrivalWindow Check:', {
      now: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      nowTime: now.getTime(),
      reservationDate,
      reservationHour,
      reservationDateTime: reservationDateTime.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      reservationStartTime: reservationDateTime.getTime(),
      windowEnd: windowEnd.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      windowEndTime: windowEnd.getTime(),
      isAfterStart: now >= reservationDateTime,
      isBeforeEnd: now <= windowEnd,
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
    
    console.log('⏰ isWithinServiceWindow Check:', {
      now: now.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      reservationDateTime: reservationDateTime.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      preparationTime,
      windowEnd: windowEnd.toLocaleString('es-PE', { timeZone: 'America/Lima' }),
      result: now >= reservationDateTime && now <= windowEnd
    });
    
    return now >= reservationDateTime && now <= windowEnd;
  };

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
    // Usar la función que maneja correctamente la zona horaria
    return formatearFechaConDia(date);
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

  const navigateToOrigin = () => {
    if (source === 'home') {
      navigate('/', { replace: true });
      return;
    }

    if (source === 'reservation') {
      navigate(`/reservation?tab=${originTab}${showPast && originTab === 'confirmed' ? '&history=true' : ''}`, {
        state: { defaultTab: originTab, showPast: showPast && originTab === 'confirmed' },
        replace: true,
      });
      return;
    }

    navigate(-1);
  };

  const handleGoBack = () => {
    navigateToOrigin();
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
      
      // Obtener ubicación actual (simulada por ahora)
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
                // Si falla, usar coordenadas vacías
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
        reservationId: parseInt(reservationId),
        startAt: now.toISOString(),
        isEmergency: 0,
        emergencyComment: ''
      };
      
      console.log('Marcando llegada al domicilio:', request);
      
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
        reservationId: parseInt(reservationId),
        finishedAt: now.toISOString()
      };
      
      console.log('Marcando culminación de servicio:', request);
      
      const response = await apiService.markReservationEnd(chefReservationId, request);
      
      if (response.success) {
        setHasEnded(true);
        alert('✓ Servicio culminado correctamente');
        // Navegar de vuelta después de un momento
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

  const getReservationReference = () => {
    const rawReference = reservation?.reference ?? reservation?.Reference ?? reservation?.referenceText ?? '';
    return typeof rawReference === 'string' ? rawReference.trim() : String(rawReference ?? '').trim();
  };

  const handleSupportClick = () => {
    window.open(SUPPORT_CONTACT_URL, '_blank', 'noopener,noreferrer');
  };

  const toggleSection = (sectionKey) => {
    setCollapsedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
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

    const storageKey = `ingredients_reservation_${reservationId}`;
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  };

  const handleAcceptReservation = async () => {
    console.log('=== ACEPTAR RESERVA ===');
    console.log('chefData:', chefData);
    console.log('reservationId:', reservationId);
    
    if (!chefData?.chefId) {
      alert('Error: No se encontró el ID del chef');
      return;
    }
    
    if (!reservationId) {
      alert('Error: No se encontró el ID de la reserva');
      return;
    }
    
    try {
      setSubmitting(true);
      console.log('Llamando al endpoint con:', {
        chefId: chefData.chefId,
        reservationId: parseInt(reservationId),
        assignmentStatus: 1
      });
      
      const response = await apiService.updateReservationAssignment(
        chefData.chefId,
        parseInt(reservationId),
        1, // assignmentStatus: 1 = Aceptada
        ''
      );

      console.log('Respuesta del endpoint:', response);

      if (response.success) {
        console.log('Reserva aceptada exitosamente');
        // Mostrar el modal de confirmación
        setAcceptModalVisible(true);
      } else {
        console.error('Error en la respuesta:', response.errorMessage);
        alert('Error al aceptar la reserva: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error accepting reservation:', error);
      alert('Error al aceptar la reserva: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAcceptModal = () => {
    setAcceptModalVisible(false);
    // Navegar al listado de reservas, no al inicio.
    navigate('/reservation?tab=confirmed', {
      state: { defaultTab: 'confirmed' },
      replace: true,
    });
  };

  const handleRejectReservation = async () => {
    if (!chefData?.chefId || !reservationId || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await apiService.updateReservationAssignment(
        chefData.chefId,
        parseInt(reservationId),
        2, // assignmentStatus: 2 = Rechazada
        rejectionReason
      );

      if (response.success) {
        setRejectModalVisible(false);
        setRejectionReason('');
        // Navegar de vuelta
        navigate(-1);
      } else {
        alert('Error al rechazar la reserva: ' + (response.errorMessage || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      alert('Error al rechazar la reserva');
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
        <p style={styles.errorText}>No se encontró la reserva</p>
        <button style={styles.backButton} onClick={handleGoBack}>
          <span style={styles.backButtonText}>Volver</span>
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(reservation.statusReservation);
  const headerStatusInfo = (() => {
    if (source === 'home' && isActive) {
      return { text: 'EN CURSO', color: '#10B981', bgColor: '#D1FAE5' };
    }

    if (source === 'reservation' && originTab === 'confirmed' && !isRequest) {
      return { text: 'PROXIMA', color: '#E88700', bgColor: '#FFF2DE' };
    }

    return statusInfo;
  })();

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
        <div style={{...styles.statusBadge, backgroundColor: headerStatusInfo.bgColor}}>
          <span style={{...styles.statusBadgeText, color: headerStatusInfo.color}}>
            {headerStatusInfo.text}
          </span>
        </div>
      </div>

      <div style={{...styles.scrollView, ...styles.contentContainer}}>
        {/* Customer Name */}
        <div style={styles.customerHeader}>
            <div style={styles.customerNameRow}>
              <img src={profileIcon} alt="" style={styles.headerIcon} />
              <h2 style={styles.customerName}>
                {reservation.customerName || 'Cliente'} {reservation.customerLastName || ''}
              </h2>
            </div>
        </div>

        {/* Info Cards */}
        <div style={styles.infoCardContainer}>
          <div style={styles.infoRow}>
              <img src={dayIcon} alt="" style={styles.infoRowIcon} />
              <span style={styles.infoRowLabel}>{formatDate(reservation.dateReservation)}</span>
          </div>
          <div style={styles.infoRow}>
              <img src={hourIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{reservation.hourReservation}</span>
          </div>
          <div style={styles.infoRow}>
              <img src={listIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{reservation.puchaseIngredients ? 'Con compras' : 'Sin compras'}</span>
          </div>
          <div style={styles.infoRow}>
              <img src={menuIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>
              {reservation.diner != null && reservation.portionperDay != null
                ? `${reservation.diner} personas, ${reservation.portionperDay} comidas`
                : reservation.diner != null && reservation.portionPerDay != null
                  ? `${reservation.diner} personas, ${reservation.portionPerDay} comidas`
                  : 'Personas y comidas no disponibles'}
            </span>
          </div>
          <div style={styles.infoRow}>
              <img src={chefIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{reservation.totalPortion} porciones totales</span>
          </div>
        </div>

        {/* Arrive Button - Solo en los primeros 15 minutos y si no ha empezado */}
        {isActive && !hasStarted && chefReservationId && 
         reservation && isWithinArrivalWindow(reservation.dateReservation, reservation.hourReservation) && (
          <button 
            style={styles.arriveButton} 
            onClick={handleArriveHome}
            disabled={submitting}
          >
            <div style={styles.arriveButtonContent}>
              <ChecklistDetail />
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
              <ChecklistDetail />
              <span style={styles.finishButtonText}>
                {submitting ? 'Registrando...' : 'Culminé el servicio'}
              </span>
            </div>
          </button>
        )}

        {reservation.puchaseIngredients && (
          <div style={styles.section}>
            <button style={styles.sectionHeaderButton} onClick={() => toggleSection('shopping')} type="button">
              <div style={styles.sectionHeaderLeft}>
                <img src={listIcon} alt="" style={styles.sectionHeaderIcon} />
                <h3 style={styles.sectionTitle}>Lista de compra</h3>
              </div>
              <img
                src={upIcon}
                alt=""
                style={collapsedSections.shopping ? {...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed} : styles.sectionToggleIcon}
              />
            </button>
            {!collapsedSections.shopping && (
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
                {reservation.comments && (
                  <div style={styles.commentSection}>
                    <p style={styles.commentLabel}>Comentarios</p>
                    <p style={styles.commentText}>{reservation.comments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ubicación */}
        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('location')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={mapIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Ubicación</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.location ? {...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed} : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.location && (
            <div style={styles.card}>
              <p style={styles.addressText}>{reservation.direction}</p>
              {getReservationReference() ? (
                <p style={styles.referenceText}>
                  {getReservationReference()}
                </p>
              ) : (
                <p style={styles.referenceText}>Sin referencia registrada</p>
              )}
              <button style={styles.mapButton} onClick={handleOpenMaps}>
                <span style={styles.mapButtonText}>Abrir en Maps</span>
              </button>
            </div>
          )}
        </div>

        {/* Platos Elegidos */}
        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('dishes')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={chefIcon} alt="" style={styles.sectionHeaderIcon} />
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
                        <img src={rightIcon} alt="" style={styles.recipeArrowIcon} />
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

        {/* Mi garantía */}
        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('gain')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={gainIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Mi ganancia</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.gain ? {...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed} : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.gain && (
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
          )}
        </div>

        <div style={styles.helpSection}>
          <p style={styles.helpTitle}>¿Necesitas ayuda?</p>
          <p style={styles.helpText}>Comunícate con una asesora</p>
          <button style={styles.helpButton} onClick={handleSupportClick} type="button">
            <img src={helpIcon} alt="" style={styles.helpIcon} />
            <span style={styles.helpButtonText}>Ayuda con el servicio</span>
          </button>
        </div>

        {/* Accept/Reject Buttons - Solo si es una solicitud pendiente */}
        {isRequest && (
          <div style={styles.actionButtonsContainer}>
            <button 
              style={styles.acceptButton} 
              onClick={handleAcceptReservation}
              disabled={submitting}
            >
              <span style={styles.acceptButtonText}>
                {submitting ? 'Aceptando...' : 'Aceptar'}
              </span>
            </button>
            <button 
              style={styles.rejectButton} 
              onClick={() => setRejectModalVisible(true)}
              disabled={submitting}
            >
              <span style={styles.rejectButtonText}>Rechazar</span>
            </button>
          </div>
        )}
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

      {/* Accept Modal */}
      {acceptModalVisible && (
        <div style={styles.modalOverlay} onClick={() => !submitting && setAcceptModalVisible(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIconContainer}>
              <div style={styles.checkIconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 style={styles.modalTitle}>¿Reserva aceptada?</h3>
            <p style={styles.modalDescription}>
              La verás en tus reservas confirmadas.
            </p>
            <button 
              style={{...styles.modalButton, ...styles.modalButtonPrimary}} 
              onClick={handleCloseAcceptModal}
            >
              <span style={styles.modalButtonText}>Ver Reservas</span>
            </button>
            <button 
              style={styles.modalButtonSecondary}
              onClick={handleCloseAcceptModal}
            >
              <span style={styles.modalButtonSecondaryText}>Volver al inicio</span>
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalVisible && (
        <div style={styles.modalOverlay} onClick={() => !submitting && setRejectModalVisible(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIconContainer}>
              <div style={styles.closeIconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 style={styles.modalTitle}>Reserva rechazada</h3>
            <p style={styles.modalDescription}>
              Gracias por contestar.
            </p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Motivo de rechazo"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={submitting}
              rows={4}
            />
            <button 
              style={{...styles.modalButton, ...styles.modalButtonDanger}} 
              onClick={handleRejectReservation}
              disabled={submitting || !rejectionReason.trim()}
            >
              <span style={styles.modalButtonText}>
                {submitting ? 'Rechazando...' : 'Volver al inicio'}
              </span>
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
  },
  customerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  customerName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1C2837',
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
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '7px 0',
    gap: '10px',
  },
  infoRowIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  infoRowLabel: {
    fontSize: '14px',
    color: '#1A1F24',
    fontWeight: '500',
    lineHeight: '18px',
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
  section: {
    marginBottom: `${spacing.large}px`,
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
    marginBottom: `${spacing.small}px`,
    cursor: 'pointer',
  },
  sectionHeaderLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
  },
  sectionHeaderIcon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
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
  dishCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: '18px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
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
  recipeArrowIcon: {
    width: '16px',
    height: '16px',
    objectFit: 'contain',
    display: 'block',
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
    marginBottom: `${spacing.large}px`,
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  helpText: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
  helpButton: {
    backgroundColor: '#FFF0EE',
    padding: `16px ${spacing.medium}px`,
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    width: '100%',
    border: 'none',
    cursor: 'pointer',
  },
  helpIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  helpButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FF5136',
    marginLeft: '8px',
  },
  sectionToggleIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    display: 'block',
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s ease',
  },
  sectionToggleIconCollapsed: {
    transform: 'rotate(180deg)',
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

export default ReservationDetailScreen;