import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../services/api.service';
import { formatIngredientQuantity } from '../../utils/formatters';
import { sortIngredientsAlphabetically } from '../../utils/ingredients';

/**
 * Detalle de un plato del catálogo (bottom sheet).
 * Réplica del maquetado `catPlato` del staff: foto, ingredientes, preparación,
 * utensilios, consejos y el botón para corregir.
 *
 * Es un componente propio y no el `recipe-modal` de las reservas: aquel tiene
 * otro layout y se usa en el detalle de servicio, donde cambiarlo rompería
 * pantallas en producción.
 */
/**
 * Utensilios y consejos vienen con `order` para respetar el orden del staff.
 * Estos endpoints devuelven el arreglo plano en unos casos y envuelto en
 * `data` en otros, así que se aceptan ambas formas.
 */
const sortByOrder = (response) => {
  const rows = Array.isArray(response)
    ? response
    : (Array.isArray(response?.data) ? response.data : []);

  return [...rows].sort((a, b) => Number(a?.order ?? a?.Order ?? 0) - Number(b?.order ?? b?.Order ?? 0));
};

const CatalogRecipeSheet = ({
  visible,
  onClose,
  menu,
  versions = [],
  selectedVersionId,
  onVersionChange,
  onReport,
}) => {
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [utensils, setUtensils] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);

  const menuId = Number(menu?.id || 0);

  const loadRecipe = useCallback(async () => {
    if (!selectedVersionId) {
      setRecipe(null);
      setIngredients([]);
      setTips([]);
      return;
    }

    setLoading(true);
    try {
      const [recipeResponse, ingredientsResponse, tipsResponse] = await Promise.all([
        apiService.getMasterRecipeById(selectedVersionId),
        apiService.getIngredientsByRecipeId(selectedVersionId),
        apiService.getTipsByRecipeId(selectedVersionId),
      ]);

      setRecipe(recipeResponse?.success ? recipeResponse.data : null);
      setIngredients(
        ingredientsResponse?.success && Array.isArray(ingredientsResponse.data)
          ? sortIngredientsAlphabetically(ingredientsResponse.data)
          : []
      );
      setTips(sortByOrder(tipsResponse));
    } catch (error) {
      console.error('Error loading catalog recipe:', error);
      setRecipe(null);
      setIngredients([]);
      setTips([]);
    } finally {
      setLoading(false);
    }
  }, [selectedVersionId]);

  const loadUtensils = useCallback(async () => {
    if (!menuId) {
      setUtensils([]);
      return;
    }

    try {
      const utensilsResponse = await apiService.getUtensilsByMenuId(menuId);
      setUtensils(sortByOrder(utensilsResponse));
    } catch (error) {
      console.error('Error loading menu utensils:', error);
      setUtensils([]);
    }
  }, [menuId]);

  useEffect(() => {
    if (visible) void loadRecipe();
  }, [visible, loadRecipe]);

  useEffect(() => {
    if (visible) void loadUtensils();
  }, [visible, loadUtensils]);

  if (!visible || !menu) return null;

  // MasterRecipe guarda los pasos como texto en `description`, uno por línea.
  const steps = String(recipe?.description || '')
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);

  const image = menu.image1 || menu.image2 || menu.image3;
  const portionsLabel = ingredients.length > 0 ? 'Ingredientes base de la receta' : '';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.overlayInner}>
        <div style={styles.sheet} onClick={(event) => event.stopPropagation()}>

          <div style={styles.header}>
            <div style={styles.handle} />
            <div style={styles.headerRow}>
              <div style={{ ...styles.headerIcon, background: menu.tileBg }}>
                {image ? <img src={image} alt={menu.name} style={styles.headerImage} /> : '🍲'}
              </div>

              <div style={styles.headerText}>
                <div style={styles.headerTitle}>{menu.name}</div>
                <div style={styles.headerMeta}>
                  {menu.typeLabel && <span style={styles.categoryChip}>{menu.typeLabel}</span>}

                  {versions.length > 0 && (
                    <span style={styles.versionWrap}>
                      <select
                        value={selectedVersionId || ''}
                        onChange={(event) => onVersionChange(Number(event.target.value))}
                        style={styles.versionSelect}
                      >
                        {versions.map((version) => (
                          <option key={version.id} value={version.id}>{version.title}</option>
                        ))}
                      </select>
                      <span style={styles.versionChevron}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
          </div>

          <div style={styles.body}>
            <div style={styles.photo}>
              {image
                ? <img src={image} alt={menu.name} style={styles.photoImage} />
                : (
                  <>
                    <div style={styles.photoEmoji}>🍲</div>
                    <span style={styles.photoTag}>foto del plato</span>
                  </>
                )}
            </div>

            {loading ? (
              <div style={styles.stateText}>Cargando receta...</div>
            ) : !selectedVersionId ? (
              <div style={styles.stateText}>Elige una versión para ver la receta.</div>
            ) : (
              <>
                {ingredients.length > 0 && (
                  <>
                    <div style={styles.sectionTitle}>
                      <span style={styles.sectionIcon}>🧺</span> Ingredientes
                    </div>
                    {portionsLabel && <div style={styles.sectionHint}>{portionsLabel}</div>}
                    <div style={styles.card}>
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          style={{
                            ...styles.ingredientRow,
                            ...(index === ingredients.length - 1 ? { borderBottom: 'none' } : {}),
                          }}
                        >
                          <span style={styles.ingredientName}>{ingredient.name}</span>
                          <span style={styles.ingredientQty}>{formatIngredientQuantity(ingredient)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {steps.length > 0 && (
                  <>
                    <div style={styles.sectionTitle}>
                      <span style={styles.sectionIcon}>👩‍🍳</span> Preparación
                    </div>
                    <div style={styles.stepsWrap}>
                      {steps.map((step, index) => (
                        <div key={index} style={styles.stepRow}>
                          <div style={styles.stepNumber}>{index + 1}</div>
                          <div style={styles.stepText}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {utensils.length > 0 && (
                  <>
                    <div style={styles.sectionTitle}>
                      <span style={styles.sectionIcon}>🔎</span> Utensilios necesarios
                    </div>
                    <div style={styles.utensilsWrap}>
                      {utensils.map((utensil, index) => (
                        <span key={utensil.id ?? utensil.Id ?? index} style={styles.utensilChip}>
                          {utensil.value ?? utensil.Value}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {tips.length > 0 && (
                  <>
                    <div style={styles.sectionTitle}>
                      <span style={styles.sectionIcon}>💡</span> Consejos
                    </div>
                    <div style={styles.tipsCard}>
                      {tips.map((tip, index) => (
                        <div key={tip.id ?? tip.Id ?? index} style={styles.tipRow}>
                          <span style={styles.tipBullet}>✦</span>
                          <span style={styles.tipText}>{tip.tip ?? tip.Tip}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {ingredients.length === 0 && steps.length === 0
                  && utensils.length === 0 && tips.length === 0 && (
                  <div style={styles.stateText}>Esta versión todavía no tiene receta cargada.</div>
                )}

                <button type="button" style={styles.reportButton} onClick={onReport}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                  </svg>
                  Corregir o mejorar
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 95,
    display: 'flex',
    justifyContent: 'center',
  },
  overlayInner: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    background: 'rgba(20,30,50,.5)',
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    overflowY: 'auto',
    background: '#F8F4EF',
    borderRadius: '26px 26px 0 0',
    boxShadow: '0 -12px 40px rgba(0,0,0,.28)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: '#F8F4EF',
    padding: '14px 22px 10px',
    borderBottom: '1px solid #EDE6DD',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    background: '#D8D0C6',
    margin: '0 auto 14px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 32,
    flex: 'none',
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 1.15,
    color: '#1B2436',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  categoryChip: {
    fontSize: 11,
    fontWeight: 700,
    color: '#C2492A',
    background: '#FFF3EF',
    borderRadius: 999,
    padding: '4px 11px',
  },
  versionWrap: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  versionSelect: {
    appearance: 'none',
    WebkitAppearance: 'none',
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: '#F2542D',
    border: 'none',
    borderRadius: 999,
    padding: '4px 26px 4px 11px',
    cursor: 'pointer',
    maxWidth: 180,
    textOverflow: 'ellipsis',
  },
  versionChevron: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
    display: 'flex',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: 'none',
    background: '#EDE6DD',
    color: '#8089A0',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    boxSizing: 'border-box',
  },
  body: {
    padding: '16px 22px 32px',
  },
  photo: {
    position: 'relative',
    height: 168,
    borderRadius: 20,
    overflow: 'hidden',
    background: 'repeating-linear-gradient(45deg,#EFE9E1,#EFE9E1 13px,#E6DFD4 13px,#E6DFD4 26px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoEmoji: {
    fontSize: 60,
    opacity: 0.9,
  },
  photoTag: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 10.5,
    color: '#8A8172',
    background: 'rgba(255,255,255,.75)',
    borderRadius: 7,
    padding: '3px 8px',
  },
  sectionTitle: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 16,
    margin: '0 0 6px',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    color: '#1B2436',
  },
  sectionIcon: {
    color: '#F2542D',
  },
  sectionHint: {
    fontSize: 12.5,
    color: '#9AA3B5',
    marginBottom: 12,
  },
  card: {
    background: '#fff',
    borderRadius: 18,
    padding: '6px 18px',
    boxShadow: '0 4px 16px rgba(27,52,92,.06)',
    marginBottom: 26,
  },
  ingredientRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '13px 0',
    borderBottom: '1px solid #F3F5F8',
  },
  ingredientName: {
    fontSize: 14.5,
    color: '#3B4658',
  },
  ingredientQty: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: '#1B2436',
    whiteSpace: 'nowrap',
  },
  stepsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 26,
    marginTop: 8,
  },
  stepRow: {
    display: 'flex',
    gap: 13,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: '#F2542D',
    color: '#fff',
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 800,
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
  },
  stepText: {
    fontSize: 14.5,
    color: '#3B4658',
    lineHeight: 1.5,
    paddingTop: 3,
  },
  utensilsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 26,
    marginTop: 8,
  },
  utensilChip: {
    background: '#fff',
    border: '1px solid #EAE3D9',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13.5,
    color: '#3B4658',
    boxShadow: '0 2px 8px rgba(27,52,92,.05)',
  },
  tipsCard: {
    background: '#FFF9F2',
    border: '1px solid #F3E3CE',
    borderRadius: 18,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 26,
    marginTop: 8,
  },
  tipRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  tipBullet: {
    color: '#E8912F',
    fontSize: 12,
    lineHeight: 1.6,
    flex: 'none',
  },
  tipText: {
    fontSize: 13.5,
    color: '#5A5044',
    lineHeight: 1.5,
  },
  reportButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 10,
    background: '#FFF0EC',
    border: '1.5px solid #F5C0AE',
    color: '#D8431F',
    borderRadius: 14,
    padding: 14,
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  stateText: {
    textAlign: 'center',
    padding: '24px 0',
    fontSize: 14,
    color: '#8089A0',
  },
};

export default CatalogRecipeSheet;
