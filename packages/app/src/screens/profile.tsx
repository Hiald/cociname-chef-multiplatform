import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { ChefData, RootStackParamList } from '../types';
import { Profile, Clock, Restaurant, List, Verified, TyC, Logout, WhatsApp, Calendar, ArrowRight } from '../assets/svgs';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const [chefData, setChefData] = useState<ChefData | null>(null);
  const [loading, setLoading] = useState(true);
  const chefId = 30; // TODO: Obtener del contexto de autenticación
  const isWeb = Platform.OS === 'web';
  const navigation = !isWeb ? useNavigation<ProfileScreenNavigationProp>() : null;
  const { logout } = useAuth();

  useEffect(() => {
    loadChefData();
  }, []);

  const loadChefData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getChef(chefId);
      if (response.success && response.data) {
        setChefData(response.data);
      }
    } catch (error) {
      console.error('Error loading chef data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleWhatsAppContact = () => {
    const url = 'https://wa.me/51963138202?text=Hola!%20Necesito%20ayuda%20con%20mi%20Reserva%20de%20Cocina%20a%20Domicilio';
    Linking.openURL(url);
  };

  const handleWhatsAppHelp = () => {
    const url = 'https://wa.me/51963138202?text=Hola!%20Necesito%20ayuda%20con%20mi%20Reserva%20de%20Cocina%20a%20Domicilio';
    Linking.openURL(url);
  };

  const handleLogout = async () => {
    // Usar el método logout del contexto de autenticación
    await logout();
    
    // En mobile, navegar al login
    if (navigation) {
      navigation.replace('Login');
    }
    // En web, el Navigator detectará isAuthenticated=false y mostrará LoginScreen automáticamente
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header con foto de perfil */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Text style={styles.profileInitials}>
            {chefData ? getInitials(chefData.firstName, chefData.lastName) : 'CH'}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {chefData ? `${chefData.firstName} ${chefData.lastName}` : 'Chef'}
          </Text>
          <Text style={styles.role}>Cocinera experta</Text>
        </View>
      </View>

      {/* Botones principales */}
      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Ver mis reservas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Completar disponibilidad</Text>
        </TouchableOpacity>
      </View>

      {/* Menú principal */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Mi perfil</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Mi disponibilidad</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Mi cobertura</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Historial de pagos</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Beneficios</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>
      </View>

      {/* Sección de información */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Información</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <List />
            </View>
            <Text style={styles.menuText}>Manuales</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <TyC />
            </View>
            <Text style={styles.menuText}>Términos y Condiciones</Text>
          </View>
          <View style={styles.menuArrowContainer}>
            <ArrowRight />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Logout />
            </View>
            <Text style={styles.menuText}>Cerrar sesión</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Sección de ayuda */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>¿Necesitas ayuda?</Text>
        <Text style={styles.helpSubtitle}>Comunícate con una asesora</Text>
        <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppContact}>
          <View style={styles.whatsappIconContainer}>
            <WhatsApp />
          </View>
          <Text style={styles.whatsappButtonText}>Comunícate con nosotros</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    padding: spacing.medium,
    paddingBottom: 100, // Espacio para bottom tabs
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.large,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5D8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  profileInfo: {
    flex: 1,
  },
  profileInitials: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonSection: {
    marginBottom: spacing.large,
  },
  primaryButton: {
    backgroundColor: '#FF5136',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFE8E5',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5136',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.small,
    marginBottom: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.small,
    marginBottom: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    marginRight: spacing.medium,
  },
  menuText: {
    fontSize: 15,
    color: '#1A1F24',
  },
  menuArrowContainer: {
    // Container for ArrowRight SVG
  },
  helpSection: {
    alignItems: 'center',
    paddingVertical: spacing.large,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: spacing.medium,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  whatsappIconContainer: {
    marginRight: spacing.small,
  },
  whatsappButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
