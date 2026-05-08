import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { CalendarCheck, Restaurant, Verified } from '../assets/svgs';
import logoImg from '../assets/images/logo.png';

/**
 * Vista pública de onboarding - accesible sin login mediante token encriptado
 * URL: /onboarding/:token o /inicio/:token
 */
const PublicOnboardingScreen = ({ token: propToken }) => {
  const { token: paramToken } = useParams();
  const navigate = useNavigate();
  // Usa el token del prop o del URL param, con fallback al otro
  const token = propToken || paramToken;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  
  // Step 1: Email input
  const [step, setStep] = useState(1); // 1 = email, 2 = code + password
  const [email, setEmail] = useState('');
  
  // Step 2: Code and password
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSendCode = async () => {
    setError('');
    
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    if (!token) {
      setError('Token inválido');
      return;
    }

    setIsLoading(true);
    
    try {
      // Limpiar el token removiendo cualquier hash (#) que pueda tener al final
      const cleanToken = token.split('#')[0];
      
      console.log('Token original:', token);
      console.log('Token limpio:', cleanToken);
      console.log('Enviando código con email:', email);
      
      const response = await apiService.sendOnboardingChefCode(cleanToken, email);
      
      if (response.success) {
        console.log('Código enviado exitosamente');
        setStep(2); // Pasar al siguiente paso
      } else {
        setError(response.errorMessage || 'Error al enviar el código');
      }
      
    } catch (err) {
      setError('Error al enviar el código. Por favor, intenta más tarde.');
      console.error('Send code error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRegistration = async () => {
    setError('');
    
    if (!code.trim()) {
      setError('Por favor ingresa el código de 6 dígitos');
      return;
    }

    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresa una contraseña');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validar que la contraseña tenga al menos 1 número
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
      setError('La contraseña debe contener al menos un número');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    
    try {
      // Limpiar el token removiendo cualquier hash (#) que pueda tener al final
      const cleanToken = token.split('#')[0];
      
      console.log('Confirmando registro con código:', code);
      console.log('Email:', email);
      
      const response = await apiService.completeChefOnboarding(cleanToken, code, password);
      
      if (response.success) {
        console.log('Onboarding completado exitosamente');
        // Redirigir al login
        navigate('/login');
      } else {
        setError(response.errorMessage || 'Error al confirmar el registro');
      }
      
    } catch (err) {
      setError('Error al confirmar el registro. Por favor, intenta más tarde.');
      console.error('Confirm registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e, handler) => {
    if (e.key === 'Enter' && !isLoading) {
      handler();
    }
  };

  const renderLeftSection = () => (
    <div style={styles.leftSection}>
      <div style={styles.leftContent}>
        <h1 style={styles.leftTitle}>Tu talento<br />transforma hogares</h1>
        <p style={styles.leftSubtitle}>
          Gestiona tus servicios y organiza tu semana de cocina.
        </p>

        <div style={styles.featuresContainer}>
          <div style={styles.featureItem}>
            <div style={styles.iconCircle}>
              <CalendarCheck />
            </div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Tú decides tu horario</h3>
              <p style={styles.featureDescription}>
                Organiza tus servicios según tu disponibilidad semanal.
              </p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <div style={styles.iconCircle}>
              <Restaurant />
            </div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Comparte tu sazón</h3>
              <p style={styles.featureDescription}>
                Cocina recetas caseras que llenan de bienestar a otros.
              </p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <div style={styles.iconCircle}>
              <Verified />
            </div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Respaldo y seguridad</h3>
              <p style={styles.featureDescription}>
                Tu seguridad es nuestra prioridad en cada visita.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 1: Email input
  if (step === 1) {
    return (
      <div style={styles.container}>
        {renderLeftSection()}
        <div style={styles.rightSection}>
          <div style={styles.rightSectionContent}>
            <div style={styles.onboardingCard}>
              <img 
                src={logoImg}
                alt="Cociname Logo"
                style={styles.logo}
              />

              <h1 style={styles.title}>Bienvenido a Cociname</h1>
              <p style={styles.subtitle}>
                Ingresa tu correo electrónico para confirmar tu cuenta:
              </p>

              <div style={styles.formContainer}>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="micorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, handleSendCode)}
                  disabled={isLoading}
                  autoFocus
                />

                {error ? (
                  <p style={styles.errorText}>{error}</p>
                ) : null}

                <button 
                  style={isLoading ? {...styles.continueButton, ...styles.continueButtonDisabled} : styles.continueButton}
                  onClick={handleSendCode}
                  disabled={isLoading}
                >
                  <span style={styles.continueButtonText}>
                    {isLoading ? 'Enviando código...' : 'Continuar'}
                  </span>
                </button>
              </div>

              <p style={styles.helpText}>
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@cociname.com" style={styles.helpLink}>soporte@cociname.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Code + Password input
  return (
    <div style={styles.container}>
      {!isMobile && renderLeftSection()}
      <div style={styles.rightSection}>
        <div style={isMobile ? {...styles.rightSectionContent, ...styles.rightSectionContentMobile} : styles.rightSectionContent}>
          <div style={styles.onboardingCard}>
            <img 
              src={logoImg}
              alt="Cociname Logo"
              style={styles.logo}
            />

            <h1 style={styles.title}>Confirma tu cuenta</h1>
            <p style={styles.subtitle}>
              Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
            </p>

            <div style={styles.formContainer}>
              <label style={styles.inputLabel}>Código de 6 dígitos</label>
              <input
                style={styles.input}
                type="text"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
                autoFocus
              />

              <label style={styles.inputLabel}>Contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="········"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />

              <label style={styles.inputLabel}>Confirmar contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="········"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleConfirmRegistration)}
                disabled={isLoading}
              />

              {error ? (
                <p style={styles.errorText}>{error}</p>
              ) : null}

              <button 
                style={isLoading ? {...styles.activateButton, ...styles.activateButtonDisabled} : styles.activateButton}
                onClick={handleConfirmRegistration}
                disabled={isLoading}
              >
                <span style={styles.activateButtonText}>
                  {isLoading ? 'Activando cuenta...' : 'Activar cuenta'}
                </span>
              </button>

              <button 
                style={styles.backButton}
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                <span style={styles.backButtonText}>Cambiar correo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    minHeight: '100vh',
  },
  
  // Left Section
  leftSection: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: '80px 60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftContent: {
    maxWidth: 600,
  },
  leftTitle: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1A1F24',
    marginBottom: 24,
    lineHeight: '64px',
    margin: '0 0 24px 0',
  },
  leftSubtitle: {
    fontSize: 20,
    color: '#6B7280',
    marginBottom: 72,
    lineHeight: '32px',
    margin: '0 0 72px 0',
  },
  featuresContainer: {
  },
  featureItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E0F2FE',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 20,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: 8,
    margin: '0 0 8px 0',
  },
  featureDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: '26px',
    margin: 0,
  },

  // Right Section
  rightSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflowY: 'auto',
  },
  rightSectionContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 60px',
    minHeight: '100vh',
  },
  rightSectionContentMobile: {
    padding: '24px 16px',
    minHeight: '100vh',
  },
  onboardingCard: {
    width: '100%',
    maxWidth: 500,
  },
  logo: {
    width: 180,
    height: 48,
    display: 'block',
    margin: '0 auto 64px auto',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: 12,
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: '24px',
    margin: '0 0 60px 0',
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    display: 'block',
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    border: 'none',
    outline: 'none',
    padding: '0 20px',
    fontSize: 16,
    color: '#1A1F24',
    marginBottom: 24,
    boxSizing: 'border-box',
    transition: 'background-color 0.2s',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
    margin: '0 0 20px 0',
  },
  continueButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF5136',
    borderRadius: 10,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#FFB5A6',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activateButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#10B981',
    borderRadius: 10,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: 8,
  },
  activateButtonDisabled: {
    backgroundColor: '#86EFAC',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  activateButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    width: '100%',
    height: 48,
    backgroundColor: 'transparent',
    borderRadius: 10,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    marginTop: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: '20px',
    margin: '32px 0 0 0',
  },
  helpLink: {
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default PublicOnboardingScreen;
