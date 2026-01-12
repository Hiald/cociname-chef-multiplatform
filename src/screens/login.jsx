import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Restaurant, Verified } from '../assets/svgs';
import { useAuth } from '../hooks/useAuth';
import logoImg from '../assets/images/logo.png';

const LoginScreen = () => {
  const navigate = useNavigate();
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

  const renderRightSection = () => (
    <div style={{...styles.rightSection, overflowY: 'auto'}}>
      <div style={styles.rightSectionContent}>
        <div style={styles.loginContainer}>
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
          </div>
        </div>
      </div>
    </div>
  );

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
  featuresContainer: {
    // gap: spacing.large * 1.5,
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
  iconText: {
    fontSize: 28,
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
  loginContainer: {
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
    marginBottom: 60,
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
    height: 56,
    backgroundColor: '#FF5136',
    borderRadius: 10,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  }
};

export default LoginScreen;
