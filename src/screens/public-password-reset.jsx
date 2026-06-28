import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api.service';
import { CalendarCheck, Restaurant, Verified } from '../assets/svgs';
import logoImg from '../assets/images/logo.png';

/**
 * Vista pública de recuperación de contraseña para cocineras.
 * Entrada A: /recuperar          → paso 1 (ingresa email)
 * Entrada B: /recuperar/:token   → token del link del correo → paso 2 (verificando) → paso 3 (nueva clave)
 */
const PublicPasswordResetScreen = ({ token: propToken }) => {
  const { token: paramToken } = useParams();
  const navigate = useNavigate();
  const token = propToken || paramToken;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // Paso 1 — email
  const [email, setEmail] = useState('');

  // Paso 3 — nueva contraseña
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1 = solicitar email | 2 = verificando token | 3 = nueva contraseña | 4 = éxito
  const [step, setStep] = useState(token ? 2 : 1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLinkError, setIsLinkError] = useState(false);
  const verifyTimeoutRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cuando hay token en la URL: verificar automáticamente
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setStep(2); // garantiza el spinner aunque el step previo fuera 1
      setIsLoading(true);
      setError('');
      try {
        const response = await apiService.verifyResetLink(token);
        if (response.success) {
          verifyTimeoutRef.current = setTimeout(() => {
            setIsLoading(false);
            setStep(3);
          }, 1200);
        } else {
          setIsLoading(false);
          setError(response.errorMessage || 'El enlace de recuperación es inválido o ha expirado.');
        }
      } catch {
        setIsLoading(false);
        setError('No se pudo verificar el enlace. Por favor, intenta de nuevo.');
      }
    };

    void verify();
    return () => clearTimeout(verifyTimeoutRef.current);
  }, [token]);

  const handleKeyPress = (e, handler) => {
    if (e.key === 'Enter' && !isLoading) handler();
  };

  const handleSendEmail = async () => {
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.forgotPasswordChefLink(trimmed);
      if (response.success) {
        setSuccessMessage(
          `Si tu correo está registrado, recibirás un enlace de recuperación en ${trimmed}. Revisa también tu carpeta de spam.`
        );
      } else {
        setError(response.errorMessage || 'Ocurrió un error. Por favor intenta de nuevo.');
      }
    } catch {
      setError('No se pudo enviar el correo. Por favor intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    setIsLinkError(false);

    if (!password.trim()) {
      setError('Por favor ingresa una contraseña.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!/\d/.test(password)) {
      setError('La contraseña debe contener al menos un número.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!token) {
      setError('El enlace es inválido. Por favor solicita uno nuevo.');
      setIsLinkError(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.completePasswordResetLink(token, password);
      if (response.success) {
        setStep(4);
      } else {
        setIsLinkError(true);
        setError(response.errorMessage || 'No se pudo actualizar la contraseña. El enlace puede haber expirado.');
      }
    } catch {
      setIsLinkError(true);
      setError('Ocurrió un error. Por favor intenta de nuevo.');
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
            <div style={styles.iconCircle}><CalendarCheck /></div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Tú decides tu horario</h3>
              <p style={styles.featureDescription}>Organiza tus servicios según tu disponibilidad semanal.</p>
            </div>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.iconCircle}><Restaurant /></div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Comparte tu sazón</h3>
              <p style={styles.featureDescription}>Cocina recetas caseras que llenan de bienestar a otros.</p>
            </div>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.iconCircle}><Verified /></div>
            <div style={styles.featureTextContainer}>
              <h3 style={styles.featureTitle}>Respaldo y seguridad</h3>
              <p style={styles.featureDescription}>Tu seguridad es nuestra prioridad en cada visita.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Paso 1: solicitar email ───────────────────────────────────
  if (step === 1) {
    return (
      <div style={styles.container}>
        {!isMobile && renderLeftSection()}
        <div style={styles.rightSection}>
          <div style={isMobile ? { ...styles.rightSectionContent, ...styles.rightSectionContentMobile } : styles.rightSectionContent}>
            <div style={styles.card}>
              <img src={logoImg} alt="Cociname Logo" style={styles.logo} />
              <h1 style={styles.title}>¿Olvidaste tu contraseña?</h1>
              <p style={styles.subtitle}>
                Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
              </p>

              <div style={styles.formContainer}>
                {successMessage ? (
                  <p style={styles.successText}>{successMessage}</p>
                ) : (
                  <>
                    <input
                      style={styles.input}
                      type="email"
                      placeholder="micorreo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, handleSendEmail)}
                      disabled={isLoading}
                      autoFocus
                    />

                    {error ? <p style={styles.errorText}>{error}</p> : null}

                    <button
                      style={isLoading ? { ...styles.primaryButton, ...styles.primaryButtonDisabled } : styles.primaryButton}
                      onClick={handleSendEmail}
                      disabled={isLoading}
                    >
                      <span style={styles.primaryButtonText}>
                        {isLoading ? 'Enviando enlace...' : 'Enviar enlace'}
                      </span>
                    </button>
                  </>
                )}

                <button style={styles.backButton} onClick={() => navigate('/login')} disabled={isLoading}>
                  <span style={styles.backButtonText}>Volver al inicio de sesión</span>
                </button>
              </div>

              <p style={styles.helpText}>
                ¿Necesitas ayuda? Contáctanos en{' '}
                <a href="mailto:soporte@cociname.com" style={styles.helpLink}>soporte@cociname.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 2: verificando token del link ────────────────────────
  if (step === 2) {
    return (
      <div style={styles.container}>
        {!isMobile && renderLeftSection()}
        <div style={styles.rightSection}>
          <div style={isMobile ? { ...styles.rightSectionContent, ...styles.rightSectionContentMobile } : styles.rightSectionContent}>
            <div style={styles.card}>
              <img src={logoImg} alt="Cociname Logo" style={styles.logo} />
              <h1 style={styles.title}>Verificando enlace...</h1>
              <p style={styles.subtitle}>Por favor espera un momento.</p>

              {error ? (
                <div style={styles.formContainer}>
                  <p style={styles.errorText}>{error}</p>
                  <button style={styles.primaryButton} onClick={() => navigate('/recuperar')}>
                    <span style={styles.primaryButtonText}>Solicitar nuevo enlace</span>
                  </button>
                </div>
              ) : (
                <div style={styles.spinnerContainer}>
                  <div style={styles.spinner} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 4: éxito ─────────────────────────────────────────────
  if (step === 4) {
    return (
      <div style={styles.container}>
        {!isMobile && renderLeftSection()}
        <div style={styles.rightSection}>
          <div style={isMobile ? { ...styles.rightSectionContent, ...styles.rightSectionContentMobile } : styles.rightSectionContent}>
            <div style={styles.card}>
              <img src={logoImg} alt="Cociname Logo" style={styles.logo} />
              <h1 style={styles.title}>¡Contraseña actualizada!</h1>
              <p style={styles.subtitle}>Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.</p>
              <div style={styles.formContainer}>
                <button style={styles.primaryButton} onClick={() => navigate('/login')}>
                  <span style={styles.primaryButtonText}>Ir al inicio de sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 3: nueva contraseña ──────────────────────────────────
  return (
    <div style={styles.container}>
      {!isMobile && renderLeftSection()}
      <div style={styles.rightSection}>
        <div style={isMobile ? { ...styles.rightSectionContent, ...styles.rightSectionContentMobile } : styles.rightSectionContent}>
          <div style={styles.card}>
            <img src={logoImg} alt="Cociname Logo" style={styles.logo} />
            <h1 style={styles.title}>Nueva contraseña</h1>
            <p style={styles.subtitle}>Elige una contraseña segura para tu cuenta.</p>

            <div style={styles.formContainer}>
              <label style={styles.inputLabel}>Nueva contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="········"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleChangePassword)}
                disabled={isLoading}
                autoFocus
              />

              <label style={styles.inputLabel}>Confirmar contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="········"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleChangePassword)}
                disabled={isLoading}
              />

              {error ? <p style={styles.errorText}>{error}</p> : null}

              <button
                style={isLoading ? { ...styles.saveButton, ...styles.saveButtonDisabled } : styles.saveButton}
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                <span style={styles.saveButtonText}>
                  {isLoading ? 'Guardando...' : 'Guardar contraseña'}
                </span>
              </button>

              {isLinkError ? (
                <button style={styles.backButton} onClick={() => navigate('/recuperar')} disabled={isLoading}>
                  <span style={styles.backButtonText}>Solicitar nuevo enlace</span>
                </button>
              ) : null}
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
  leftContent: { maxWidth: 600 },
  leftTitle: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#1A1F24',
    lineHeight: '64px',
    margin: '0 0 24px 0',
  },
  leftSubtitle: {
    fontSize: 20,
    color: '#6B7280',
    lineHeight: '32px',
    margin: '0 0 72px 0',
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
  featureTextContainer: { flex: 1, marginLeft: 20 },
  featureTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1F24',
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
  card: {
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
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: '24px',
    margin: '0 0 60px 0',
  },
  formContainer: { width: '100%' },
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
    textAlign: 'center',
    margin: '0 0 20px 0',
  },
  successText: {
    fontSize: 15,
    color: '#10B981',
    textAlign: 'center',
    lineHeight: '22px',
    margin: '0 0 24px 0',
  },
  primaryButton: {
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
  primaryButtonDisabled: {
    backgroundColor: '#FFB5A6',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: '#86EFAC',
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  saveButtonText: {
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
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #F3F4F6',
    borderTop: '4px solid #FF5136',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: '20px',
    margin: '32px 0 0 0',
  },
  helpLink: {
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default PublicPasswordResetScreen;
