import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/images/logo.png';
import loginHeroImg from '../assets/images/login/home.png';
import featureOneIcon from '../assets/images/login/Container.png';
import featureTwoIcon from '../assets/images/login/Container-1.png';
import featureThreeIcon from '../assets/images/login/Container-2.png';
import badgeTopImg from '../assets/images/login/slogan_label_1.png';
import badgeBottomImg from '../assets/images/login/slogan_label_4.png';

const LoginScreen = () => {
  const GOOGLE_CLIENT_ID_FALLBACK = '164367639878-13699crmkeg3jt0ksc7hs1ff5np0sm6c.apps.googleusercontent.com';
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const googleButtonContainerRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID_FALLBACK;
  
  const { login, loginWithGoogleToken } = useAuth();

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
    if (!googleClientId || !googleButtonContainerRef.current) {
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
              setError('No se pudo iniciar sesión con Google');
            }
          } catch (err) {
            console.error('Google auth error:', err);
            setError('Error al iniciar sesión con Google');
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
        text: 'signin_with',
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
  }, [googleClientId, loginWithGoogleToken, navigate]);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        navigate('/');
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

  const renderRightSection = () => (
    <div style={styles.rightSection}>
      <div style={isMobile ? {...styles.rightSectionContent, ...styles.rightSectionContentMobile} : styles.rightSectionContent}>
        <div style={isMobile ? {...styles.loginCard, ...styles.loginCardMobile} : styles.loginCard}>
          <img 
            src={logoImg}
            alt="Logo"
            style={styles.logo}
          />

          <h2 style={styles.welcomeTitle}>¡Bienvenida!</h2>
          <p style={styles.welcomeSubtitle}>
            Ingresa a tu cuenta para gestionar tus reservas.
          </p>

          <div style={styles.formContainer}>
            <label style={styles.inputLabel}>Correo electrónico</label>
            <input
              style={styles.input}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
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

            {error ? (
              <p style={styles.errorText}>{error}</p>
            ) : null}

            <div style={styles.optionsRow}>
              <div 
                style={styles.rememberMeContainer}
                onClick={() => !isLoading && setRememberMe(!rememberMe)}
              >
                <div style={rememberMe ? {...styles.checkbox, ...styles.checkboxChecked} : styles.checkbox}>
                  {rememberMe && <div style={styles.checkboxInner} />}
                </div>
                <span style={styles.rememberMeText}>Recordarme</span>
              </div>

              <button style={{background: 'none', border: 'none', cursor: 'pointer', padding: 0}} disabled={isLoading}>
                <span style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</span>
              </button>
            </div>

            <button 
              style={isLoading ? {...styles.loginButton, ...styles.loginButtonDisabled} : styles.loginButton}
              onClick={handleLogin}
              disabled={isLoading}
            >
              <span style={styles.loginButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </span>
            </button>

            <div style={styles.googleSeparator}>
              <span style={styles.googleSeparatorText}>o continúa con</span>
            </div>

            <div style={styles.googleButtonWrapper}>
              <div ref={googleButtonContainerRef} style={styles.googleButtonContainer} />
              {isGoogleLoading ? <p style={styles.googleLoadingText}>Validando con Google...</p> : null}
            </div>

            <p style={styles.registerText}>
              ¿No tienes cuenta? <button 
                style={styles.registerLink}
                onClick={() => navigate('/register')}
                disabled={isLoading}
              >
                Regístrate
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

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
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    boxShadow: '0px 5px 18px 0px rgba(39, 159, 223, 0.15)',
    padding: '48px',
    width: '100%',
    maxWidth: 480,
  },
  loginCardMobile: {
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
  optionsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  rememberMeContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    border: '2px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF5136',
    borderColor: '#FF5136',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  rememberMeText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
  },
  forgotPasswordText: {
    fontSize: 15,
    color: '#3B82F6',
    textDecoration: 'underline',
  },
  loginButtonDisabled: {
    backgroundColor: '#FFB5A6',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 15,
    color: '#dd3333',
    marginBottom: 20,
    textAlign: 'center',
    margin: '0 0 20px 0',
  },
  loginButton: {
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
  registerText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    margin: '20px 0 0 0',
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
  registerLink: {
    background: 'none',
    border: 'none',
    color: '#1391E2',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    padding: 0,
  },
};

export default LoginScreen;
