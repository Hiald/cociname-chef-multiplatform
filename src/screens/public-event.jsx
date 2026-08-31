import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api.service';
import { getDistrictName, getChefPaymentBreakdown } from '../utils';
import RecipeModal from '../components/recipe-modal/recipe-modal';
import { loadIngredientDetailsFromChecklist } from '../utils/ingredients';
import { getClientComment } from '../utils/formatters';
import {
  DetalleContainer,
  DetalleContent,
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
  ErrorScreen,
} from '../components/detalle-reserva/DetalleReservaKit';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import listIcon from '../assets/images/detalle/lista.png';
import chefIcon from '../assets/images/detalle/chef.png';
import menuIcon from '../assets/images/detalle/menu.png';
import mapIcon from '../assets/images/detalle/map.png';
import gainIcon from '../assets/images/detalle/ganancia.png';

/**
 * Vista pública de evento - accesible sin login mediante token encriptado
 * URL: /evento/:token
 *
 * Usa DetalleReservaKit, igual que public-reservation. Antes tenía su propio
 * maquetado y estilos: se veía distinto y, sobre todo, le faltaba el blindaje
 * mobile-first del kit (maxWidth, overflowX y boxSizing), así que una dirección
 * larga desbordaba la pantalla en el móvil.
 */
export const PublicEventScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  const getUnitName = (unitNumber) => {
    const units = {
      1: 'un', 2: 'kg', 4: 'lt', 6: 'cda', 7: 'cdta',
      8: 'atado', 9: 'hojas', 10: 'ramita', 11: 'tazas',
    };
    return units[unitNumber] || 'un';
  };

  // Mismo formateo que la reserva independiente, para que las cantidades se lean
  // igual en toda la app.
  const formatQuantity = useCallback((size, unit) => {
    const kilo = 1000;

    if (unit === 1) return `${Math.round(size)} un`;

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
      if (size < 1) return `${(size * 1000).toFixed(0)} ml`;
      return `${size.toFixed(2)} lt`;
    }

    return `${size.toFixed(2)} ${getUnitName(unit)}`;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'Fecha no especificada';
    // UTC para que no se corra el día por zona horaria.
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
          const id = eventData.id;
          setEvent(eventData);

          // Lista de compra: el cliente la arma desde la webapp y el API ya la
          // expone por evento. Solo se pide si el evento lleva compras.
          if (eventData.puchaseIngredients) {
            const ingredientsResponse = await apiService.getIngredientChecklistByReservationEvent(id);

            if (isMounted && ingredientsResponse.success && ingredientsResponse.data?.length > 0) {
              const ingredientsDetails = await loadIngredientDetailsFromChecklist(
                ingredientsResponse.data,
                (ingredientId) => apiService.getIngredientById(ingredientId),
                formatQuantity
              );

              if (!isMounted) return;
              setIngredients(ingredientsDetails);

              const storageKey = `ingredients_event_${id}`;
              const savedChecks = localStorage.getItem(storageKey);
              if (savedChecks) {
                try {
                  setCheckedIngredients(JSON.parse(savedChecks));
                } catch (e) {
                  console.error('Error parsing saved checks:', e);
                }
              }
            }
          }

          if (Array.isArray(eventData.eventDetails) && eventData.eventDetails.length > 0) {
            setRecipes(eventData.eventDetails.map((dish) => ({
              MenuNombre: dish.menuNameSnapshot || '',
              MasterRecipeNombre: dish.recipeNameSnapshot || 'original',
              iCantidadPlatos: dish.portions || 1,
              MasterRecipeId: dish.masterRecipeId,
              MenuId: dish.menuId,
              id: dish.id,
              key: dish.id,
            })));
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
  }, [token, formatQuantity]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !event) {
    return <ErrorScreen mensaje={error || 'Evento no encontrado. El enlace puede ser inválido o haber expirado.'} />;
  }

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

    if (event?.id) {
      localStorage.setItem(`ingredients_event_${event.id}`, JSON.stringify(newChecked));
    }
  };

  const handleOpenMaps = () => {
    if (event?.latitude && event?.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`, '_blank');
    }
  };

  const clientComment = getClientComment(event);
  const tieneCoordenadas = Boolean(event.latitude && event.longitude
    && event.latitude !== '-' && event.longitude !== '-'
    && Number(event.latitude) !== 0);

  // El total es la SUMA de los conceptos, no el campo de comisión suelto: la
  // clave cambia de grafía según el DTO y leía undefined -> S/ 0.00.
  // Ver getChefPaymentBreakdown en utils/formatters.
  const { conceptos, totalTexto } = getChefPaymentBreakdown(event);

  const tipoAsistentes = event.attendeesType === 1 ? 'Formal' : 'Casual';

  return (
    <DetalleContainer>
      <DetalleContent>
        <CustomerHeader
          nombre={`${event.customerName || 'Cliente'} ${event.customerLastName || ''}`.trim()}
          subtitulo="Vista pública"
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

// Animación del loader del kit.
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
