import React, { useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { getDistrictName, getConceptName } from '../utils';
import RecipeModal from '../components/recipe-modal/recipe-modal';
import { loadIngredientDetailsFromChecklist } from '../utils/ingredients';
import { getClientComment, formatCurrency, getPerVisitPortions, parseSubscriptionPaymentConcepts, getSubscriptionChefCommission } from '../utils/formatters';
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
import menuIcon from '../assets/images/detalle/menu.png';

/**
 * Vista pública de suscripción - accesible sin login mediante token encriptado
 * URL: /suscripcion/:token
 * Mismo diseño que el detalle asignado vía DetalleReservaKit, sin acciones privadas.
 */
export const PublicSuscriptionScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [suscriptionInfo, setSuscriptionInfo] = useState(null);
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

    // Prevenir llamadas duplicadas
    let isMounted = true;

    const loadSuscription = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiService.publicGetReservationSuscriptionByToken(token);

        if (response.success && response.data) {
          const data = response.data;
          const id = data.id;

          if (!isMounted) return;
          setReservation(data);

          // Cargar la información de la suscripción padre PRIMERO (tiene los datos del cliente)
          if (data.suscriptionId) {
            const suscriptionResponse = await apiService.getSuscriptionById(data.suscriptionId);
            if (suscriptionResponse.success && suscriptionResponse.data) {
              if (!isMounted) return;
              setSuscriptionInfo(suscriptionResponse.data);
            }
          }

          // Cargar ingredientes si tiene compras
          if (data.puchaseIngredients) {
            const ingredientsResponse = await apiService.getIngredientChecklistByReservationSuscription(id);

            if (ingredientsResponse.success && ingredientsResponse.data && ingredientsResponse.data.length > 0) {
              const ingredientsDetails = await loadIngredientDetailsFromChecklist(
                ingredientsResponse.data,
                (ingredientId) => apiService.getIngredientById(ingredientId),
                formatQuantity
              );

              if (!isMounted) return;
              setIngredients(ingredientsDetails);

              const storageKey = `ingredients_suscription_${id}`;
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

          // Parsear recetas
          try {
            const requestedDishes = JSON.parse(data.jsonRequest || '[]');
            const optionalDishes = data.jsonOptional ? JSON.parse(data.jsonOptional) : [];
            setRecipes([...requestedDishes, ...optionalDishes]);
          } catch (e) {
            console.error('Error parsing recipes:', e);
          }
        } else {
          if (!isMounted) return;
          setError(response.errorMessage || 'No se pudo cargar la suscripción');
        }
      } catch (err) {
        console.error('Error cargando suscripción pública:', err);
        const errorMessage = err instanceof Error ? err.message : 'Enlace inválido o expirado';
        if (!isMounted) return;
        setError(errorMessage);
      } finally {
        // eslint-disable-next-line no-unsafe-finally
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadSuscription();

    // Cleanup para prevenir actualizaciones en componente desmontado
    return () => {
      isMounted = false;
    };
  }, [token, formatQuantity]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !reservation) {
    return <ErrorScreen mensaje={error || 'Suscripción no encontrada. El enlace puede ser inválido o haber expirado.'} />;
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
      const storageKey = `ingredients_suscription_${reservation.id}`;
      localStorage.setItem(storageKey, JSON.stringify(newChecked));
    }
  };

  const clientComment = getClientComment(reservation);
  const portionsPerVisit = getPerVisitPortions(reservation, suscriptionInfo);
  const paymentConcepts = parseSubscriptionPaymentConcepts(
    reservation?.jsonPaymentChef ?? reservation?.JsonPaymentChef
  );
  const totalPerVisit = getSubscriptionChefCommission(reservation, suscriptionInfo);

  const nombreCliente = `${suscriptionInfo?.customerName || reservation.customerName || 'Cliente'} ${suscriptionInfo?.customerLastName || reservation.customerLastName || ''}`.trim();

  const conceptos = paymentConcepts.length > 0
    ? paymentConcepts.map(c => ({
        label: getConceptName(c.concept),
        valor: formatCurrency(c.amount),
      }))
    : [{ label: 'Servicio', valor: formatCurrency(totalPerVisit) }];

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <DetalleContainer>
      <DetalleContent>
        <CustomerHeader
          nombre={nombreCliente}
          subtitulo={`Vista pública • Reserva ${reservation.suscriptionCount} de ${reservation.visitsPerMonth}`}
        />

        <InfoCard
          rows={[
            { icon: dayIcon, label: formatDate(reservation.dateReservation) },
            { icon: hourIcon, label: reservation.hourReservation },
            { icon: listIcon, label: reservation.puchaseIngredients ? 'Con compras' : 'Sin compras' },
            { icon: chefIcon, label: `${portionsPerVisit} porciones` },
          ]}
        />

        {suscriptionInfo && (
          <Seccion icon={menuIcon} titulo="Información de Suscripción">
            <InfoCardTextoSuscripcion suscriptionInfo={suscriptionInfo} formatDate={formatDate} diasSemana={diasSemana} />
          </Seccion>
        )}

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
            direccion={reservation.direction || reservation.suscriptionDirection}
            distrito={getDistrictName(reservation.district || reservation.suscriptionDistrict)}
            referencia={reservation.reference || reservation.suscriptionReference}
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
          <BloqueMonto
            conceptos={conceptos}
            totalLabel="Total por visita"
            totalValor={formatCurrency(totalPerVisit)}
          />
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

// Filas de texto de la información de suscripción (período, visitas, día).
function InfoCardTextoSuscripcion({ suscriptionInfo, formatDate, diasSemana }) {
  const filaStyle = { fontSize: '14px', color: '#1A1F24', margin: '0 0 8px 0' };
  return (
    <>
      <p style={filaStyle}>
        <strong>Período:</strong> {formatDate(suscriptionInfo.startDate)} - {formatDate(suscriptionInfo.endDate)}
      </p>
      <p style={filaStyle}>
        <strong>Visitas al mes:</strong> {suscriptionInfo.visitsPerMonth}
      </p>
      <p style={{ ...filaStyle, margin: 0 }}>
        <strong>Día de visita:</strong> {diasSemana[suscriptionInfo.visitWeekday] || suscriptionInfo.visitWeekday}
      </p>
    </>
  );
}

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
