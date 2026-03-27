import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Restaurant, Verified } from '../assets/svgs';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/images/logo.png';

const RegisterScreen = () => {
  const GOOGLE_CLIENT_ID_FALLBACK = '164367639878-13699crmkeg3jt0ksc7hs1ff5np0sm6c.apps.googleusercontent.com';
  const navigate = useNavigate();
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Verification code step
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonContainerRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;
  const { loginWithGoogleToken } = useAuth();

  useEffect(() => {
    if (!googleClientId || !googleButtonContainerRef.current || showVerification) {
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleButtonContainerRef.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        context: 'use',
        ux_mode: 'popup',
        auto_select: false,
        callback: async (response) => {
          if (!response?.credential) {
            setError('No se pudo obtener credencial de Google');
            return;
          }

          setError('');
          setIsGoogleLoading(true);
          try {
            const success = await loginWithGoogleToken(response.credential);
            if (success) {
              navigate('/');
            } else {
              setError('No se pudo registrarte/iniciar sesión con Google');
            }
          } catch (err) {
            console.error('Google register/login error:', err);
            setError('Error al continuar con Google');
          } finally {
            setIsGoogleLoading(false);
          }
        },
      });

      googleButtonContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonContainerRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        width: 380,
        text: 'signup_with',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setError('No se pudo cargar Google Sign-In');
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [googleClientId, loginWithGoogleToken, navigate, showVerification]);

  const handleRegister = async () => {
    setError('');
    
    // Validaciones
    if (!firstName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    
    if (!lastName.trim()) {
      setError('Por favor ingresa tu apellido');
      return;
    }
    
    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    
    if (!documentNumber.trim()) {
      setError('Por favor ingresa tu número de documento');
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
    
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
      setError('La contraseña debe contener al menos un número');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (!phoneNumber.trim()) {
      setError('Por favor ingresa tu número de teléfono');
      return;
    }

    setIsLoading(true);
    
    try {
      const requestBody = {
        firstName,
        lastName,
        email,
        documentNumber,
        bornDate: "25-02-2026",
        documentType: 1,
        age: 1,
        password,
        confirmPassword,
        phoneNumber: `+51${phoneNumber}`,
        address: "-",
        reference: "-",
        gmapsLink: "-",
        latitude: "-",
        longitude: "-",
        allergies: "-",
        district: 15,
        gender: 1,
        foodPreferences: "-"
      };

      console.log('Registrando chef:', { ...requestBody, password: '***', confirmPassword: '***' });
      
      const response = await apiService.registerChef(requestBody);
      
      if (response.success) {
        console.log('Registro exitoso, mostrando pantalla de verificación');
        setShowVerification(true);
      } else {
        setError(response.errorMessage || 'Error al registrar. Por favor, intenta de nuevo.');
      }
      
    } catch (err) {
      setError('Error al registrar. Por favor, intenta más tarde.');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    
    if (!verificationCode.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Verificando código:', verificationCode);
      
      const response = await apiService.completeOnboardingChefApp(email, verificationCode);
      
      if (response.success) {
        console.log('Cuenta activada exitosamente');
        // Redirigir al login
        navigate('/login');
      } else {
        setError(response.errorMessage || 'Código incorrecto. Por favor, intenta de nuevo.');
      }
      
    } catch (err) {
      setError('Error al verificar el código. Por favor, intenta más tarde.');
      console.error('Verification error:', err);
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

  const renderRightSection = () => {
    // Vista de verificación de código
    if (showVerification) {
      return (
        <div style={{...styles.rightSection, overflowY: 'auto'}}>
          <div style={styles.rightSectionContent}>
            <div style={styles.formCard}>
              <img 
                src={logoImg}
                alt="Logo"
                style={styles.logo}
              />

              <h2 style={styles.welcomeTitle}>Verifica tu cuenta</h2>
              <p style={styles.welcomeSubtitle}>
                Hemos enviado un código de 6 dígitos a <strong>{email}</strong>
              </p>

              <div style={styles.formContainer}>
                <label style={styles.inputLabel}>Código de verificación</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={(e) => handleKeyPress(e, handleVerifyCode)}
                  disabled={isLoading}
                  autoFocus
                />

                {error ? (
                  <p style={styles.errorText}>{error}</p>
                ) : null}

                <button 
                  style={isLoading ? {...styles.activateButton, ...styles.activateButtonDisabled} : styles.activateButton}
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                >
                  <span style={styles.activateButtonText}>
                    {isLoading ? 'Activando cuenta...' : 'Activar cuenta'}
                  </span>
                </button>

                <button 
                  style={styles.backButton}
                  onClick={() => setShowVerification(false)}
                  disabled={isLoading}
                >
                  <span style={styles.backButtonText}>Volver al registro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Vista de registro
    return (
      <div style={{...styles.rightSection, overflowY: 'auto'}}>
        <div style={styles.rightSectionContent}>
          <div style={styles.formCard}>
            <img 
              src={logoImg}
              alt="Logo"
              style={styles.logo}
            />

            <h2 style={styles.welcomeTitle}>Crea tu cuenta</h2>
            <p style={styles.welcomeSubtitle}>
              Únete a nuestra comunidad de chefs profesionales
            </p>

            <div style={styles.formContainer}>
              <div style={styles.rowInputs}>
                <div style={styles.halfInput}>
                  <label style={styles.inputLabel}>Nombre</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="María"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div style={styles.halfInput}>
                  <label style={styles.inputLabel}>Apellido</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="García"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <label style={styles.inputLabel}>Correo electrónico</label>
              <input
                style={styles.input}
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />

              <label style={styles.inputLabel}>Número de documento</label>
              <input
                style={styles.input}
                type="text"
                placeholder="12345678"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                disabled={isLoading}
              />

              <label style={styles.inputLabel}>Teléfono</label>
              <div style={styles.phoneInputContainer}>
                <span style={styles.phonePrefix}>+51</span>
                <input
                  style={styles.phoneInput}
                  type="tel"
                  placeholder="987 654 321"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>

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
                onKeyPress={(e) => handleKeyPress(e, handleRegister)}
                disabled={isLoading}
              />

              {error ? (
                <p style={styles.errorText}>{error}</p>
              ) : null}

              <button 
                style={isLoading ? {...styles.registerButton, ...styles.registerButtonDisabled} : styles.registerButton}
                onClick={handleRegister}
                disabled={isLoading}
              >
                <span style={styles.registerButtonText}>
                  {isLoading ? 'Registrando...' : 'Registrarse'}
                </span>
              </button>

              <div style={styles.googleSeparator}>
                <span style={styles.googleSeparatorText}>o continúa con</span>
              </div>

              <div style={styles.googleButtonWrapper}>
                <div ref={googleButtonContainerRef} style={styles.googleButtonContainer} />
                {isGoogleLoading ? <p style={styles.googleLoadingText}>Validando con Google...</p> : null}
              </div>

              <p style={styles.loginText}>
                ¿Ya tienes cuenta? <button 
                  style={styles.loginLink}
                  onClick={() => navigate('/login')}
                  disabled={isLoading}
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {renderLeftSection()}
      {renderRightSection()}
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
  },
  featuresContainer: {},
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
  },
  rightSectionContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 60px',
    minHeight: '100vh',
  },
  formCard: {
    width: '100%',
    maxWidth: 500,
  },
  logo: {
    width: 180,
    height: 48,
    display: 'block',
    margin: '0 auto 64px auto',
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: 12,
    margin: '0 0 12px 0',
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    margin: '0 0 40px 0',
  },
  formContainer: {
    width: '100%',
  },
  rowInputs: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    marginBottom: 0,
  },
  halfInput: {
    flex: 1,
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
  },
  errorText: {
    fontSize: 15,
    color: '#dd3333',
    marginBottom: 20,
    textAlign: 'center',
    margin: '0 0 20px 0',
  },
  registerButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF5136',
    borderRadius: 10,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  },
  registerButtonDisabled: {
    backgroundColor: '#FFB5A6',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  googleSeparator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  googleSeparatorText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  googleButtonWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 52,
  },
  googleButtonContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  googleLoadingText: {
    marginTop: 8,
    marginBottom: 0,
    fontSize: 13,
    color: '#6B7280',
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
  loginText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
    margin: '24px 0 0 0',
  },
  loginLink: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  phoneInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    marginBottom: 24,
    paddingLeft: 20,
    paddingRight: 20,
    boxSizing: 'border-box',
  },
  phonePrefix: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 16,
    color: '#1A1F24',
  },
};

export default RegisterScreen;
