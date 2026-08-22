import React, { useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { getDistrictName, getConceptName } from '../utils';
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
import mapIcon from '../assets/images/detalle/map.png';
import gainIcon from '../assets/images/detalle/ganancia.png';

/**
 * Vista pública de reserva - accesible sin login mediante token encriptado
 * URL: /reserva/:token
 * Mismo diseño que el detalle asignado (reservationDetail.jsx) vía DetalleReservaKit,
 * sin las acciones privadas del flujo de la cocinera logueada.
 */
export const PublicReservationScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Función para mapear números de unidad a texto (según el backend)
  const getUnitName = (unitNumber) => {
    const units = {
      1: 'un',        // Unidad
      2: 'kg',        // Kilogramos
      4: 'lt',        // Litros
      6: 'cda',       // Cucharada
      7: 'cdta',      // Cucharadita
      8: 'atado',     // Atado
      9: 'hojas',     // Hojas
      10: 'ramita',    // Ramita
      11: "tazas",    // Tazas
    };
    return units[unitNumber] || 'un';
  };

  // Función para formatear cantidades con fracciones
  const formatQuantity = useCallback((size, unit) => {
    const kilo = 1000;
    let description = '';

    // unit 1 = Unidad (mostrar solo el número)
    if (unit === 1) {
      const cantidad = Math.round(size);
      return `${cantidad} un`;
    }

    // unit 2 = Kilogramos (aplicar lógica de fracciones para kg/gr)
    if (unit === 2) {
      if (size < 1) {
        const fraccion = size;
        if (fraccion === 0.25) {
          description = "1/4 kg";
        } else if (fraccion === 0.5) {
          description = "1/2 kg";
        } else if (fraccion === 0.75) {
          description = "3/4 kg";
        } else {
          // Convertir a gramos
          const gramos = (size * kilo).toFixed(0);
          description = gramos + " gr";
        }
      } else {
        description = size.toFixed(2) + " kg";
      }
      return description;
    }

    // unit 4 = Litros (aplicar lógica similar a kg)
    if (unit === 4) {
      if (size < 1) {
        // Convertir a mililitros
        const mililitros = (size * 1000).toFixed(0);
        return mililitros + " ml";
      } else {
        return size.toFixed(2) + " lt";
      }
    }

    // Para otras unidades, retornar con formato estándar
    return size.toFixed(2) + ' ' + getUnitName(unit);
  }, []);

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

        const response = await apiService.publicGetReservationByToken(token);

        if (response.success && response.data) {
          const id = response.data.id;
          setReservation(response.data);

          // Cargar ingredientes si tiene compras
          if (response.data.puchaseIngredients) {
            const ingredientsResponse = await apiService.getIngredientChecklistByReservation(id);

            if (ingredientsResponse.success && ingredientsResponse.data && ingredientsResponse.data.length > 0) {
              const ingredientsDetails = await loadIngredientDetailsFromChecklist(
                ingredientsResponse.data,
                (ingredientId) => apiService.getIngredientById(ingredientId),
                formatQuantity
              );

              setIngredients(ingredientsDetails);

              const storageKey = `ingredients_reservation_${id}`;
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

          // Cargar recetas de la reserva
          const recipesResponse = await apiService.getReservationRecipes(id);

          if (recipesResponse.success && recipesResponse.data && recipesResponse.data.length > 0) {
            const firstRecipe = recipesResponse.data[0];
            try {
              const requestedDishes = JSON.parse(firstRecipe.jsonRequest);
              const optionalDishes = firstRecipe.jsonOptional
                ? JSON.parse(firstRecipe.jsonOptional)
                : [];
              const allRecipes = [...requestedDishes, ...optionalDishes];
              setRecipes(allRecipes);

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
  }, [token, formatQuantity]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !reservation) {
    return <ErrorScreen mensaje={error || 'Reserva no encontrada. El enlace puede ser inválido o haber expirado.'} />;
  }

  const formatDate = (date) => {
    // Usa UTC para evitar cambios de día por zona horaria
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    return new Intl.DateTimeFormat('es-PE', options).format(new Date(date));
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
    const newChecked = {
      ...checkedIngredients,
      [ingredientId]: !checkedIngredients[ingredientId]
    };
    setCheckedIngredients(newChecked);

    // Guardar en localStorage
    if (reservation?.id) {
      const storageKey = `ingredients_reservation_${reservation.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newChecked));
    }
  };

  const handleOpenMaps = () => {
    if (reservation && reservation.latitude && reservation.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${reservation.latitude},${reservation.longitude}`;
      window.open(url, '_blank');
    }
  };

  const clientComment = getClientComment(reservation);
  const tieneCoordenadas = Boolean(reservation.latitude && reservation.longitude
    && reservation.latitude !== '-' && reservation.longitude !== '-'
    && Number(reservation.latitude) !== 0);

  // Conceptos del desglose "Detalle del servicio" — SIEMPRE sobre la comisión
  // de la cocinera, nunca el total que pagó el cliente.
  const comision = Number(reservation.commissionToChef ?? 0);
  let conceptos;
  try {
    const paymentConcepts = JSON.parse(reservation.jsonPaymentChef || '[]');
    conceptos = paymentConcepts.length > 0
      ? paymentConcepts.map(c => ({
          label: getConceptName(parseInt(c.Concepto)),
          valor: `S/ ${parseFloat(c.Monto).toFixed(2)}`,
        }))
      : [{ label: 'Servicio', valor: `S/ ${comision.toFixed(2)}` }];
  } catch {
    conceptos = [{ label: 'Servicio', valor: `S/ ${comision.toFixed(2)}` }];
  }

  return (
    <DetalleContainer>
      <DetalleContent>
        <CustomerHeader
          nombre={`${reservation.customerName || 'Cliente'} ${reservation.customerLastName || ''}`.trim()}
          subtitulo="Vista pública"
        />

        <InfoCard
          rows={[
            { icon: dayIcon, label: formatDate(reservation.dateReservation) },
            { icon: hourIcon, label: reservation.hourReservation },
            { icon: listIcon, label: reservation.puchaseIngredients ? 'Con compras' : 'Sin compras' },
            { icon: chefIcon, label: `${reservation.totalPortion} porciones totales` },
          ]}
        />

        <ComentariosCliente texto={clientComment} />

        {reservation.puchaseIngredients && ingredients.length > 0 && (
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
            direccion={reservation.direction}
            distrito={getDistrictName(reservation.district)}
            referencia={reservation.reference}
            onAbrirMaps={tieneCoordenadas ? handleOpenMaps : null}
          />
        </Seccion>

        {recipes.length > 0 && (
          <Seccion icon={chefIcon} titulo="Platos elegidos">
            <ListaPlatos
              platos={recipes.map((recipe, index) => ({
                key: recipe.key || index,
                nombre: `${recipe.MenuNombre} - ${recipe.MasterRecipeNombre}`,
                porciones: `${recipe.iCantidadPlatos} porciones`,
                onVerReceta: () => handleViewRecipe(recipe),
              }))}
            />
          </Seccion>
        )}

        <Seccion icon={gainIcon} titulo="Detalle del servicio">
          <BloqueMonto conceptos={conceptos} totalValor={`S/ ${comision.toFixed(2)}`} />
        </Seccion>

        <HelpSection />
      </DetalleContent>

      {/* Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal
          visible={recipeModalVisible}
          onClose={handleCloseRecipeModal}
          recipeName={`${selectedRecipe.MenuNombre} - ${selectedRecipe.MasterRecipeNombre}`}
          masterRecipeId={parseInt(selectedRecipe.MasterRecipeId)}
          menuId={parseInt(selectedRecipe.MenuId, 10)}
          portions={selectedRecipe.iCantidadPlatos}
          recipeSteps={selectedRecipe.sPasos}
        />
      )}
    </DetalleContainer>
  );
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
