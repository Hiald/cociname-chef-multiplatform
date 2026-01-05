import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { spacing } from '../styles';
import { images } from '../assets/images';
import { CalendarCheck, Restaurant, Verified } from '../assets/svgs';
import { useAuth } from '../hooks/useAuth';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  // Solo usar navigation si no estamos en web
  const navigation = !isWeb ? useNavigation<LoginScreenNavigationProp>() : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        // Redirigir a MainTabs después de login exitoso (solo en mobile)
        if (navigation) {
          navigation.replace('MainTabs' as any);
        }
        // En web, el AuthProvider se encargará de mostrar el Home
      } else {
        setError('Credenciales incorrectas. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intenta más tarde.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLeftSection = () => {
    if (!isWeb || isMobile) return null;

    return (
      <View style={styles.leftSection}>
        <View style={styles.leftContent}>
          <Text style={styles.leftTitle}>Tu talento{'\n'}transforma hogares</Text>
          <Text style={styles.leftSubtitle}>
            Gestiona tus servicios y organiza tu semana de cocina.
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.iconCircle}>
                <CalendarCheck />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Tú decides tu horario</Text>
                <Text style={styles.featureDescription}>
                  Organiza tus servicios según tu disponibilidad semanal.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.iconCircle}>
                <Restaurant />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Comparte tu sazón</Text>
                <Text style={styles.featureDescription}>
                  Cocina recetas caseras que llenan de bienestar a otros.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.iconCircle}>
                <Verified />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Respaldo y seguridad</Text>
                <Text style={styles.featureDescription}>
                  Tu seguridad es nuestra prioridad en cada visita.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRightSection = () => (
    <ScrollView 
      style={styles.rightSection} 
      contentContainerStyle={styles.rightSectionContent}
    >
      <View style={styles.loginContainer}>
        <Image 
          source={images.logo}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.welcomeTitle}>¡Bienvenida!</Text>
        <Text style={styles.welcomeSubtitle}>
          Ingresa a tu cuenta para gestionar tus reservas.
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@email.com"
            placeholderTextColor="#B8BFC4"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Text style={styles.inputLabel}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="········"
            placeholderTextColor="#B8BFC4"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.rememberMeText}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderLeftSection()}
      {renderRightSection()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: isWeb && !isMobile ? 'row' : 'column',
    backgroundColor: '#FFFFFF',
    minHeight: isWeb ? '100vh' : '100%',
  },
  
  // Left Section (Web only)
  leftSection: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: spacing.huge,
    justifyContent: 'center',
  },
  leftContent: {
    maxWidth: 500,
  },
  leftTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1A1F24',
    marginBottom: spacing.medium,
    lineHeight: 48,
  },
  leftSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: spacing.huge * 1.5,
    lineHeight: 24,
  },
  featuresContainer: {
    // gap: spacing.large * 1.5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.large,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: spacing.medium,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: spacing.tiny,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Right Section
  rightSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rightSectionContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.huge,
    minHeight: isWeb ? '100vh' : '100%',
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
  },
  logo: {
    width: 150,
    height: 40,
    alignSelf: 'center',
    marginBottom: spacing.huge,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.huge,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: spacing.small,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: spacing.medium,
    fontSize: 14,
    color: '#1A1F24',
    marginBottom: spacing.medium,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF5136',
    borderColor: '#FF5136',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: spacing.small,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  loginButtonDisabled: {
    backgroundColor: '#FFB5A6',
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 14,
    color: '#dd3333',
    marginBottom: spacing.medium,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FF5136',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.small,
  }
});

export default LoginScreen;
