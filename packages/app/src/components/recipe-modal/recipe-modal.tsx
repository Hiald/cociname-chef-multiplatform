import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { spacing } from '../../styles';
import { apiService } from '../../services/api.service';
import { IngredientData, MasterRecipeData } from '../../types';
import { getCategoryName, formatSize } from '../../utils/formatters';
import { BuyingDetail, RedhatDetail } from '../../assets/svgs';

// Declaración global para window en web
declare const window: any;

interface RecipeModalProps {
  visible: boolean;
  onClose: () => void;
  recipeName: string;
  recipeImage?: string;
  masterRecipeId: number;
  portions: number;
  recipeSteps?: string;
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const RecipeModal: React.FC<RecipeModalProps> = ({
  visible,
  onClose,
  recipeName,
  masterRecipeId,
  portions,
  recipeSteps,
}) => {
  const [ingredients, setIngredients] = useState<IngredientData[]>([]);
  const [recipeData, setRecipeData] = useState<MasterRecipeData | null>(null);
  const [loading, setLoading] = useState(false);
  const slideAnimRef = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' ? (typeof window !== 'undefined' ? window.innerWidth : SCREEN_WIDTH) : SCREEN_WIDTH
  );

  // Detectar si es mobile (incluye web responsive)
  const isMobile = Platform.OS !== 'web' || windowWidth <= 768;

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    console.log('RecipeModal visible changed:', visible, 'isMobile:', isMobile);
    if (visible) {
      loadRecipeData();
      // Animar entrada para mobile (incluye web responsive)
      if (isMobile) {
        slideAnimRef.setValue(SCREEN_HEIGHT);
        Animated.spring(slideAnimRef, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }
    } else {
      // Animar salida para mobile (incluye web responsive)
      if (isMobile) {
        Animated.timing(slideAnimRef, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, isMobile]);

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
      Animated.timing(slideAnimRef, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  // Desktop web: modal centrado
  if (!isMobile) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.webModalOverlay}>
          <TouchableOpacity style={styles.webModalBackdrop} activeOpacity={1} onPress={handleClose} />
          <View style={styles.webModalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Title and Image */}
            <View style={styles.titleSection}>
              <View style={styles.titleContent}>
                <Text style={styles.recipeTitle}>
                  {recipeData ? `${recipeData.menuTitle} - ${recipeData.title}` : recipeName}
                </Text>
                <Text style={styles.portions}>{portions} porciones</Text>
              </View>
              <View style={styles.recipePlaceholder}>
                {recipeData?.menuImg ? (
                  <Image
                    source={{ uri: recipeData.menuImg }}
                    style={styles.recipeImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.placeholderEmoji}>🍲</Text>
                )}
              </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Ingredientes */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <BuyingDetail />
                  </View>
                  <Text style={styles.sectionTitle}>Ingredientes</Text>
                </View>

                {loading ? (
                  <ActivityIndicator size="small" color="#FF5136" style={{ marginVertical: 20 }} />
                ) : ingredients.length > 0 ? (
                  <View style={styles.ingredientsList}>
                    {ingredients.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <View style={styles.ingredientNameContainer}>
                          <Text style={styles.ingredientName}>{ingredient.name}</Text>
                          <Text style={styles.ingredientCategory}>{getCategoryName(ingredient.category)}</Text>
                        </View>
                        <Text style={styles.ingredientQuantity}>
                          {formatSize(ingredient.uM_value, ingredient.unit)}
                        </Text>
                      </View>
                    ))}
                    
                    {/* Opcionales - Si existen */}
                    <View style={styles.optionalsSection}>
                      <Text style={styles.optionalsTitle}>Opcionales</Text>
                      <View style={styles.ingredientItem}>
                        <Text style={styles.ingredientName}>Maicena</Text>
                        <Text style={styles.ingredientQuantity}>2 cdtas.</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No hay ingredientes registrados</Text>
                )}
              </View>

              {/* Receta */}
              {(recipeData?.description || recipeSteps) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionIconWrapper}>
                      <RedhatDetail />
                    </View>
                    <Text style={styles.sectionTitle}>Receta</Text>
                  </View>

                  <View style={styles.recipeSteps}>
                    {(recipeData?.description || recipeSteps || '').split('\n').map((step, index) => {
                      const trimmedStep = step.trim();
                      if (!trimmedStep) return null;
                      return (
                        <View key={index} style={styles.stepItem}>
                          <Text style={styles.stepText}>{trimmedStep}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  // Mobile y web responsive: bottom sheet
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.mobileModalOverlay}>
        <TouchableOpacity style={styles.mobileBackdrop} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.mobileBottomSheet,
            {
              transform: [{ translateY: slideAnimRef }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Recipe Title and Image */}
          <View style={styles.titleSection}>
            <View style={styles.titleContent}>
              <Text style={styles.recipeTitle}>
                {recipeData ? `${recipeData.menuTitle} - ${recipeData.title}` : recipeName}
              </Text>
              <Text style={styles.portions}>{portions} porciones</Text>
            </View>
            <View style={styles.recipePlaceholder}>
              {recipeData?.menuImg ? (
                <Image
                  source={{ uri: recipeData.menuImg }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.placeholderEmoji}>🍲</Text>
              )}
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Ingredientes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrapper}>
                  <BuyingDetail />
                </View>
                <Text style={styles.sectionTitle}>Ingredientes</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color="#FF5136" style={{ marginVertical: 20 }} />
              ) : ingredients.length > 0 ? (
                <View style={styles.ingredientsList}>
                  {ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <View style={styles.ingredientNameContainer}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientCategory}>{getCategoryName(ingredient.category)}</Text>
                      </View>
                      <Text style={styles.ingredientQuantity}>
                        {formatSize(ingredient.uM_value, ingredient.unit)}
                      </Text>
                    </View>
                  ))}
                  
                  {/* Opcionales - Si existen */}
                  <View style={styles.optionalsSection}>
                    <Text style={styles.optionalsTitle}>Opcionales</Text>
                    <View style={styles.ingredientItem}>
                      <Text style={styles.ingredientName}>Maicena</Text>
                      <Text style={styles.ingredientQuantity}>2 cdtas.</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay ingredientes registrados</Text>
              )}
            </View>

            {/* Receta */}
            {(recipeData?.description || recipeSteps) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconWrapper}>
                    <RedhatDetail />
                  </View>
                  <Text style={styles.sectionTitle}>Receta</Text>
                </View>

                <View style={styles.recipeSteps}>
                  {(recipeData?.description || recipeSteps || '').split('\n').map((step, index) => {
                    const trimmedStep = step.trim();
                    if (!trimmedStep) return null;
                    return (
                      <View key={index} style={styles.stepItem}>
                        <Text style={styles.stepText}>{trimmedStep}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
    }),
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
    height: SCREEN_HEIGHT * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
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
    paddingVertical: spacing.large,
  },
});

export default RecipeModal;
