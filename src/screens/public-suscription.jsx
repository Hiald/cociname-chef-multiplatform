import React, { useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { spacing } from '../styles';
import { getDistrictName, getConceptName } from '../utils';
import { UbicationDetail, RedhatDetail, MoneyDetail, OrderDetail, ClockDetail, ListDetail, HatblueDetail, ArrowRightDetail, BuyingDetail } from '../assets/svgs';
import RecipeModal from '../components/recipe-modal/recipe-modal';

/**
 * Vista pública de suscripción - accesible sin login mediante token encriptado
 * URL: /suscripcion/:token
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
              const checklistData = ingredientsResponse.data[0];
              
              // Parsear jsonIngredientsCheckList
              if (checklistData.jsonIngredientsCheckList) {
                try {
                  const parsedIngredients = JSON.parse(checklistData.jsonIngredientsCheckList);
                  
                  // Cargar detalles de cada ingrediente
                  const ingredientsDetails = await Promise.all(
                    parsedIngredients.map(async (item) => {
                      try {
                        const details = await apiService.getIngredientById(item.IngredientId);
                        if (details.success && details.data) {
                          const size = parseFloat(item.TotalSize);
                          return {
                            id: item.IngredientId,
                            ingredientId: item.IngredientId,
                            ingredientName: details.data.name,
                            quantity: formatQuantity(size, details.data.unit),
                            unit: details.data.unit,
                            rawSize: item.TotalSize
                          };
                        }
                      } catch (e) {
                        console.error(`Error cargando ingrediente ${item.IngredientId}:`, e);
                      }
                      
                      // Fallback si no se puede cargar el detalle
                      return {
                        id: item.IngredientId,
                        ingredientId: item.IngredientId,
                        ingredientName: `Ingrediente #${item.IngredientId}`,
                        quantity: parseFloat(item.TotalSize).toFixed(2),
                        unit: 'kg',
                        rawSize: item.TotalSize
                      };
                    })
                  );
                  
                  if (!isMounted) return;
                  setIngredients(ingredientsDetails);
                  
                  // Cargar estado de checkboxes desde localStorage
                  const storageKey = `ingredients_suscription_${id}`;
                  const savedChecks = localStorage.getItem(storageKey);
                  if (savedChecks) {
                    try {
                      setCheckedIngredients(JSON.parse(savedChecks));
                    } catch (e) {
                      console.error('Error parsing saved checks:', e);
                    }
                  }
                } catch (e) {
                  console.error('❌ Error parsing jsonIngredientsCheckList:', e);
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
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader} />
        <p style={styles.loadingText}>Cargando suscripción...</p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorTitle}>⚠️</span>
        <p style={styles.errorText}>{error || 'Suscripción no encontrada'}</p>
        <p style={styles.errorHint}>
          El enlace puede ser inválido o haber expirado.
        </p>
      </div>
    );
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

  return (
    <div style={styles.container}>
      <div style={styles.scrollView}>
        <div style={styles.contentContainer}>
          {/* Header con badge de suscripción */}
          <div style={styles.customerHeader}>
            <h1 style={styles.customerName}>
              {suscriptionInfo?.customerName || reservation.customerName || 'Cliente'} {suscriptionInfo?.customerLastName || reservation.customerLastName || ''}
            </h1>
            <p style={styles.publicBadge}>
              Vista pública • Reserva {reservation.suscriptionCount} de {reservation.visitsPerMonth}
            </p>
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

          {/* Información de la suscripción */}
          {suscriptionInfo && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <BuyingDetail />
                <h2 style={styles.sectionTitle}>Información de Suscripción</h2>
              </div>
              <div style={styles.card}>
                <p style={styles.suscriptionText}>
                  <strong>Período:</strong> {formatDate(suscriptionInfo.startDate)} - {formatDate(suscriptionInfo.endDate)}
                </p>
                <p style={styles.suscriptionText}>
                  <strong>Visitas al mes:</strong> {suscriptionInfo.visitsPerMonth}
                </p>
                <p style={styles.suscriptionText}>
                  <strong>Día de visita:</strong> {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][suscriptionInfo.visitWeekday] || suscriptionInfo.visitWeekday}
                </p>
              </div>
            </div>
          )}

          {/* Lista de compra */}
          {reservation.puchaseIngredients && ingredients.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <BuyingDetail />
                <h2 style={styles.sectionTitle}>Lista de compra</h2>
              </div>
              <div style={styles.card}>
                <p style={styles.shoppingListSubtitle}>Debes comprar todos estos ingredientes.</p>
                {ingredients.map((ingredient) => (
                  <div key={ingredient.id} style={styles.ingredientRow}>
                    <input
                      type="checkbox"
                      checked={checkedIngredients[ingredient.id] || false}
                      onChange={() => handleIngredientCheck(ingredient.id)}
                      style={styles.checkbox}
                    />
                    <div style={styles.ingredientInfo}>
                      <span style={styles.ingredientName}>{ingredient.ingredientName}</span>
                      <span style={styles.ingredientQuantity}>
                        {ingredient.quantity}
                      </span>
                    </div>
                  </div>
                ))}
                {reservation.comments && (
                  <div style={styles.clientCommentBox}>
                    <p style={styles.commentBoxTitle}>Comentarios</p>
                    <p style={styles.commentBoxText}>{reservation.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ubicación */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <UbicationDetail />
              <h2 style={styles.sectionTitle}>Ubicación</h2>
            </div>
            <div style={styles.card}>
              <p style={styles.addressText}>{reservation.direction || reservation.suscriptionDirection}</p>
              <p style={styles.districtText}>{getDistrictName(reservation.district || reservation.suscriptionDistrict)}</p>
              {(reservation.reference || reservation.suscriptionReference) && (
                <p style={styles.referenceText}>{reservation.reference || reservation.suscriptionReference}</p>
              )}
            </div>
          </div>

          {/* Platos Elegidos */}
          {recipes.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <RedhatDetail />
                <h2 style={styles.sectionTitle}>Platos elegidos</h2>
              </div>
              <div style={styles.card}>
                {recipes.map((recipe, index) => (
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
                ))}
              </div>
            </div>
          )}

          {/* Detalle del servicio */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <MoneyDetail />
              <h2 style={styles.sectionTitle}>Detalle del servicio</h2>
            </div>
            <div style={styles.card}>
              {(() => {
                try {
                  const paymentConcepts = JSON.parse(reservation.jsonPaymentChef || '[]');
                  if (paymentConcepts.length > 0) {
                    return paymentConcepts.map((concept, index) => (
                      <div key={index} style={styles.garantiaRow}>
                        <span style={styles.garantiaLabel}>{getConceptName(parseInt(concept.Concepto))}</span>
                        <span style={styles.garantiaValue}>S/ {parseFloat(concept.Monto).toFixed(2)}</span>
                      </div>
                    ));
                  }
                  return (
                    <div style={styles.garantiaRow}>
                      <span style={styles.garantiaLabel}>Servicio</span>
                      <span style={styles.garantiaValue}>S/ {Number(reservation.totalPrice ?? 0).toFixed(2)}</span>
                    </div>
                  );
                } catch {
                  return (
                    <div style={styles.garantiaRow}>
                      <span style={styles.garantiaLabel}>Servicio</span>
                      <span style={styles.garantiaValue}>S/ {Number(reservation.totalPrice ?? 0).toFixed(2)}</span>
                    </div>
                  );
                }
              })()}
              <div style={styles.divider} />
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaTotal}>Total por visita</span>
                <span style={styles.garantiaTotalValue}>
                  S/ {(() => {
                    try {
                      const concepts = JSON.parse(reservation.jsonPaymentChef || '[]');
                      if (concepts.length > 0) {
                        return concepts.reduce((sum, c) => sum + parseFloat(c.Monto), 0).toFixed(2);
                      }
                      return Number(reservation.totalPrice ?? 0).toFixed(2);
                    } catch {
                      return Number(reservation.totalPrice ?? 0).toFixed(2);
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Nota de Privacidad */}
          <div style={styles.helpSection}>
            <p style={styles.helpTitle}>Vista de solo lectura</p>
            <p style={styles.helpText}>
              Para modificaciones, contacte con el servicio al cliente.
            </p>
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
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#1A1F24',
    marginLeft: spacing.small,
    fontWeight: '500',
    flex: 1,
  },
  infoRowValue: {
    fontSize: 12,
    color: '#6B7280',
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
  sectionIcon: {
    fontSize: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
  },
  suscriptionText: {
    fontSize: 14,
    color: '#1A1F24',
    marginBottom: 8,
    margin: '0 0 8px 0',
  },
  addressText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  districtText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.small,
    margin: `0 0 ${spacing.small}px 0`,
  },
  referenceText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: '20px',
    margin: 0,
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
  },
  viewRecipeText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
    marginRight: 4,
  },
  arrowIcon: {
    marginTop: 5,
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
    marginTop: spacing.small,
    marginBottom: spacing.small,
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
  commentSection: {
    marginBottom: spacing.medium,
  },
  commentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  commentText: {
    fontSize: 14,
    color: '#1A1F24',
    lineHeight: '20px',
    margin: 0,
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
  shoppingListSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: spacing.medium,
    margin: `0 0 ${spacing.medium}px 0`,
  },
  ingredientRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottom: '1px solid #F3F4F6',
  },
  checkbox: {
    width: 20,
    height: 20,
    marginRight: spacing.small,
    cursor: 'pointer',
    accentColor: '#FF5136',
  },
  ingredientInfo: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    color: '#1A1F24',
    fontWeight: '500',
    marginBottom: 2,
  },
  ingredientQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  clientCommentBox: {
    marginTop: spacing.medium,
    padding: spacing.small,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeft: '3px solid #F59E0B',
  },
  commentBoxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  commentBoxText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: '18px',
    margin: 0,
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
