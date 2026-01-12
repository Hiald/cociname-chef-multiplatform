/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api.service';
import { getCategoryName, formatSize } from '../../utils/formatters';
import { BuyingDetail, RedhatDetail } from '../../assets/svgs';
import { spacing } from '../../styles';

const RecipeModal = ({
  visible,
  onClose,
  recipeName,
  masterRecipeId,
  portions,
  recipeSteps,
}) => {
  const [ingredients, setIngredients] = useState([]);
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isClosing, setIsClosing] = useState(false);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (visible) {
      loadRecipeData();
      setIsClosing(false);
    }
  }, [visible]);

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      
      // Cargar receta e ingredientes en paralelo
      const [recipeResponse, ingredientsResponse] = await Promise.all([
        apiService.getMasterRecipeById(masterRecipeId),
        apiService.getIngredientsByRecipeId(masterRecipeId)
      ]);
      
      if (recipeResponse.success && recipeResponse.data) {
        setRecipeData(recipeResponse.data);
      }
      
      if (ingredientsResponse.success && ingredientsResponse.data) {
        setIngredients(ingredientsResponse.data);
      }
    } catch (error) {
      console.error('Error loading recipe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isMobile) {
      setIsClosing(true);
      setTimeout(() => onClose(), 250);
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  // Desktop web: modal centrado
  if (!isMobile) {
    return (
      <div style={styles.webModalOverlay}>
        <div style={styles.webModalBackdrop} onClick={handleClose} />
        <div style={styles.webModalContent}>
            {/* Recipe Title and Image */}
            <div style={styles.titleSection}>
              <div style={styles.titleContent}>
                <h2 style={styles.recipeTitle}>
                  {recipeData ? `${recipeData.menuTitle} - ${recipeData.title}` : recipeName}
                </h2>
                <p style={styles.portions}>{portions} porciones</p>
              </div>
              <div style={styles.recipePlaceholder}>
                {recipeData?.menuImg ? (
                  <img
                    src={recipeData.menuImg}
                    alt="recipe"
                    style={styles.recipeImage}
                  />
                ) : (
                  <span style={styles.placeholderEmoji}>🍲</span>
                )}
              </div>
            </div>

            <div style={{...styles.scrollContent, overflowY: 'auto'}}>
              {/* Ingredientes */}
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionIconWrapper}>
                    <BuyingDetail />
                  </div>
                  <h3 style={styles.sectionTitle}>Ingredientes</h3>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#FF5136' }}>Cargando...</div>
                ) : ingredients.length > 0 ? (
                  <div style={styles.ingredientsList}>
                    {ingredients.map((ingredient, index) => (
                      <div key={index} style={styles.ingredientItem}>
                        <div style={styles.ingredientNameContainer}>
                          <p style={styles.ingredientName}>{ingredient.name}</p>
                          <p style={styles.ingredientCategory}>{getCategoryName(ingredient.category)}</p>
                        </div>
                        <p style={styles.ingredientQuantity}>
                          {formatSize(ingredient.uM_value, ingredient.unit)}
                        </p>
                      </div>
                    ))}
                    
                    {/* Opcionales - Si existen */}
                    <div style={styles.optionalsSection}>
                      <p style={styles.optionalsTitle}>Opcionales</p>
                      <div style={styles.ingredientItem}>
                        <p style={styles.ingredientName}>Maicena</p>
                        <p style={styles.ingredientQuantity}>2 cdtas.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={styles.emptyText}>No hay ingredientes registrados</p>
                )}
              </div>

              {/* Receta */}
              {(recipeData?.description || recipeSteps) && (
                <div style={styles.section}>
                  <div style={styles.sectionHeader}>
                    <div style={styles.sectionIconWrapper}>
                      <RedhatDetail />
                    </div>
                    <h3 style={styles.sectionTitle}>Receta</h3>
                  </div>

                  <div style={styles.recipeSteps}>
                    {(recipeData?.description || recipeSteps || '').split('\n').map((step, index) => {
                      const trimmedStep = step.trim();
                      if (!trimmedStep) return null;
                      return (
                        <div key={index} style={styles.stepItem}>
                          <p style={styles.stepText}>{trimmedStep}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
    );
  }

  // Mobile y web responsive: bottom sheet
  return (
    <div style={styles.mobileModalOverlay}>
      <div style={styles.mobileBackdrop} onClick={handleClose} />
      <div style={{
        ...styles.mobileBottomSheet,
        transform: isClosing ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.dragIndicator} />
        </div>

        {/* Recipe Title and Image */}
        <div style={styles.titleSection}>
          <div style={styles.titleContent}>
            <h2 style={styles.recipeTitle}>
              {recipeData ? `${recipeData.menuTitle} - ${recipeData.title}` : recipeName}
            </h2>
            <p style={styles.portions}>{portions} porciones</p>
          </div>
          <div style={styles.recipePlaceholder}>
            {recipeData?.menuImg ? (
              <img
                src={recipeData.menuImg}
                alt="recipe"
                style={styles.recipeImage}
              />
            ) : (
              <span style={styles.placeholderEmoji}>🍲</span>
            )}
          </div>
        </div>

        <div style={{...styles.scrollContent, overflowY: 'auto'}}>
          {/* Ingredientes */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionIconWrapper}>
                <BuyingDetail />
              </div>
              <h3 style={styles.sectionTitle}>Ingredientes</h3>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#FF5136' }}>Cargando...</div>
            ) : ingredients.length > 0 ? (
              <div style={styles.ingredientsList}>
                {ingredients.map((ingredient, index) => (
                  <div key={index} style={styles.ingredientItem}>
                    <div style={styles.ingredientNameContainer}>
                      <p style={styles.ingredientName}>{ingredient.name}</p>
                      <p style={styles.ingredientCategory}>{getCategoryName(ingredient.category)}</p>
                    </div>
                    <p style={styles.ingredientQuantity}>
                      {formatSize(ingredient.uM_value, ingredient.unit)}
                    </p>
                  </div>
                ))}
                
                {/* Opcionales - Si existen */}
                <div style={styles.optionalsSection}>
                  <p style={styles.optionalsTitle}>Opcionales</p>
                  <div style={styles.ingredientItem}>
                    <p style={styles.ingredientName}>Maicena</p>
                    <p style={styles.ingredientQuantity}>2 cdtas.</p>
                  </div>
                </div>
              </div>
            ) : (
              <p style={styles.emptyText}>No hay ingredientes registrados</p>
            )}
          </div>

          {/* Receta */}
          {(recipeData?.description || recipeSteps) && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <div style={styles.sectionIconWrapper}>
                  <RedhatDetail />
                </div>
                <h3 style={styles.sectionTitle}>Receta</h3>
              </div>

              <div style={styles.recipeSteps}>
                {(recipeData?.description || recipeSteps || '').split('\n').map((step, index) => {
                  const trimmedStep = step.trim();
                  if (!trimmedStep) return null;
                  return (
                    <div key={index} style={styles.stepItem}>
                      <p style={styles.stepText}>{trimmedStep}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  // Web Modal Styles
  webModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  webModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  },

  // Mobile Bottom Sheet Styles
  mobileModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  mobileBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mobileBottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '85vh',
    boxShadow: '0 -4px 8px rgba(0, 0, 0, 0.1)',
  },

  // Header
  header: {
    paddingTop: spacing.medium,
    paddingHorizontal: spacing.medium,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: spacing.small,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.medium,
    right: spacing.medium,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Title Section
  titleSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
    alignItems: 'center',
  },
  titleContent: {
    flex: 1,
    marginRight: spacing.medium,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF5136',
    marginBottom: 4,
  },
  portions: {
    fontSize: 14,
    color: '#6B7280',
  },
  recipePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recipeImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  placeholderEmoji: {
    fontSize: 40,
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.medium,
  },

  // Section
  section: {
    marginBottom: spacing.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionIconWrapper: {
    marginRight: spacing.small,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: spacing.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
  },

  // Ingredients
  ingredientsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: spacing.medium,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  ingredientNameContainer: {
    flex: 1,
    marginRight: spacing.small,
  },
  ingredientName: {
    fontSize: 14,
    color: '#1A1F24',
    fontWeight: '600',
    marginBottom: 2,
  },
  ingredientCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  ingredientQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5136',
  },

  // Optionals
  optionalsSection: {
    marginTop: spacing.medium,
  },
  optionalsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: spacing.small,
  },

  // Recipe Steps
  recipeSteps: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: spacing.medium,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: spacing.medium,
  },
  stepCheckbox: {
    marginRight: spacing.small,
    marginTop: 2,
  },
  stepCheckboxIcon: {
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1F24',
    lineHeight: 20,
  },

  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingTop: spacing.large,
    paddingBottom: spacing.large,
    margin: 0,
  },
};

export default RecipeModal;
