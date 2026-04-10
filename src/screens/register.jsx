import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/images/logo.png';
import loginHeroImg from '../assets/images/login/home.png';
import featureOneIcon from '../assets/images/login/Container.png';
import featureTwoIcon from '../assets/images/login/Container-1.png';
import featureThreeIcon from '../assets/images/login/Container-2.png';
import badgeTopImg from '../assets/images/login/slogan_label_1.png';
import badgeBottomImg from '../assets/images/login/slogan_label_4.png';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const googleButtonContainerRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;
  const { loginWithGoogleToken } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
        <img src={badgeTopImg} alt="A tu medida" style={styles.topBadge} />
        <h1 style={styles.leftTitle}>Tu talento transforma hogares</h1>
        <p style={styles.leftSubtitle}>
          Gestiona tus servicios y organiza tu semana de cocina.
        </p>

        <div style={styles.featuresContainer}>
          <div style={styles.featureItem}>
            <img src={featureThreeIcon} alt="Horario" style={styles.featureIcon} />
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Tú decides tu horario</h3>
              <p style={styles.featureDescription}>
                Organiza tus servicios según tu disponibilidad semanal.
              </p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <img src={featureOneIcon} alt="Sazón" style={styles.featureIcon} />
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Comparte tu sazón</h3>
              <p style={styles.featureDescription}>
                Cocina recetas caseras que llenan de bienestar a otros.
              </p>
            </div>
          </div>

          <div style={styles.featureItem}>
            <img src={featureTwoIcon} alt="Seguridad" style={styles.featureIcon} />
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Respaldo y seguridad</h3>
              <p style={styles.featureDescription}>
                Tu seguridad es nuestra prioridad en cada visita.
              </p>
            </div>
          </div>
        </div>
        <img src={badgeBottomImg} alt="Rico y Casero" style={styles.bottomBadge} />
      </div>
    </div>
  );

  const renderRightSection = () => {
    // Vista de verificación de código
    if (showVerification) {
      return (
        <div style={styles.rightSection}>
          <div style={isMobile ? {...styles.rightSectionContent, ...styles.rightSectionContentMobile} : styles.rightSectionContent}>
            <div style={isMobile ? {...styles.formCard, ...styles.formCardMobile} : styles.formCard}>
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
      <div style={styles.rightSection}>
        <div style={isMobile ? {...styles.rightSectionContent, ...styles.rightSectionContentMobile} : styles.rightSectionContent}>
          <div style={isMobile ? {...styles.formCard, ...styles.formCardMobile} : styles.formCard}>
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
              <div style={isMobile ? {...styles.rowInputs, ...styles.rowInputsMobile} : styles.rowInputs}>
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
      {!isMobile && renderLeftSection()}
      {renderRightSection()}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    backgroundColor: '#FF4336',
    minHeight: '100vh',
  },
  leftSection: {
    flex: 1,
    backgroundImage: `url(${loginHeroImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '80px 60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftContent: {
    maxWidth: 560,
    width: '100%',
    position: 'relative',
    backgroundColor: 'rgba(48, 59, 64, 0.75)',
    borderRadius: 24,
    padding: '44px 36px',
  },
  topBadge: {
    width: 138,
    position: 'absolute',
    top: -62,
    left: -74,
  },
  bottomBadge: {
    width: 138,
    position: 'absolute',
    right: -62,
    bottom: -56,
  },
  leftTitle: {
    fontSize: 40,
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: '52px',
    margin: '0 0 24px 0',
  },
  leftSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 34,
    lineHeight: '24px',
  },
  featuresContainer: {},
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
  },
  featureIcon: {
    width: 50,
    height: 50,
    objectFit: 'contain',
    flexShrink: 0,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    margin: '0 0 4px 0',
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '19px',
    margin: 0,
  },
  rightSection: {
    flex: 1,
    backgroundColor: '#FF4336',
    overflowY: 'auto',
  },
  rightSectionContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    minHeight: '100vh',
  },
  rightSectionContentMobile: {
    padding: '24px 16px',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    boxShadow: '0px 5px 18px 0px rgba(39, 159, 223, 0.15)',
    padding: '48px',
    width: '100%',
    maxWidth: 480,
  },
  formCardMobile: {
    padding: '24px 20px',
    borderRadius: 20,
    maxWidth: 460,
  },
  logo: {
    width: 160,
    height: 'auto',
    display: 'block',
    margin: '0 auto 32px auto',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A1A1A',
    textAlign: 'center',
    margin: '0 0 6px 0',
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: '20px',
    textAlign: 'center',
    margin: '0 0 28px 0',
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
  rowInputsMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E0E0E0',
    outline: 'none',
    padding: '0 16px',
    fontSize: 14,
    color: '#1A1F24',
    marginBottom: 18,
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
    height: 52,
    background: 'linear-gradient(97.22deg, #FF6833 2.34%, #FF4336 100%)',
    borderRadius: 20,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    cursor: 'pointer',
    boxShadow: '0px 5px 18px 0px rgba(255, 67, 54, 0.3)',
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
    height: 52,
    background: 'linear-gradient(97.22deg, #FF6833 2.34%, #FF4336 100%)',
    borderRadius: 20,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: 4,
    boxShadow: '0px 5px 18px 0px rgba(255, 67, 54, 0.3)',
  },
  activateButtonDisabled: {
    background: '#FFB5A6',
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
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    margin: '20px 0 0 0',
  },
  loginLink: {
    background: 'none',
    border: 'none',
    color: '#1391E2',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },
  phoneInputContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1px solid #E0E0E0',
    marginBottom: 18,
    paddingLeft: 16,
    paddingRight: 16,
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
