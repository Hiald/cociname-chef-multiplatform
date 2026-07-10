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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setStep(2);
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

  const renderBrand = () => (
    <div style={styles.brandRow}>
      <img src={logoImg} alt="Cociname" style={styles.logo} />
    </div>
  );

  const renderLeftSection = () => (
    <div style={styles.leftSection}>
      <div style={styles.leftGlow} />
      <div style={styles.leftContent}>
        <img src={logoImg} alt="Cociname" style={styles.leftLogo} />
        <p style={styles.leftEyebrow}>App para cocineras</p>
        <h1 style={styles.leftTitle}>Tu talento transforma hogares</h1>
        <p style={styles.leftSubtitle}>
          Gestiona tus servicios y organiza tu semana de cocina con la nueva experiencia de Cociname.
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

  const renderShell = (children) => (
    <div style={styles.container}>
      {!isMobile && renderLeftSection()}
      <div style={styles.rightSection}>
        <div style={isMobile ? { ...styles.rightSectionContent, ...styles.rightSectionContentMobile } : styles.rightSectionContent}>
          <div style={styles.card}>{children}</div>
        </div>
      </div>
    </div>
  );

  if (step === 1) {
    return renderShell(
      <>
        {renderBrand()}
        <h1 style={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p style={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
        </p>

        <div style={styles.formContainer}>
          {successMessage ? (
            <div style={styles.successBox}>
              <p style={styles.successText}>{successMessage}</p>
            </div>
          ) : (
            <>
              <label style={styles.inputLabel}>Correo electrónico</label>
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
      </>
    );
  }

  if (step === 2) {
    return renderShell(
      <>
        {renderBrand()}
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
      </>
    );
  }

  if (step === 4) {
    return renderShell(
      <>
        {renderBrand()}
        <div style={styles.successBadge}>Listo</div>
        <h1 style={styles.title}>¡Contraseña actualizada!</h1>
        <p style={styles.subtitle}>
          Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión.
        </p>
        <div style={styles.formContainer}>
          <button style={styles.primaryButton} onClick={() => navigate('/login')}>
            <span style={styles.primaryButtonText}>Ir al inicio de sesión</span>
          </button>
        </div>
      </>
    );
  }

  return renderShell(
    <>
      {renderBrand()}
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
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#EAE4DD',
    minHeight: '100vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#1B2436',
  },
  leftSection: {
    flex: 1,
    background: 'linear-gradient(160deg, #F2542D 0%, #E23E17 55%, #C2492A 100%)',
    padding: '72px 56px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  leftGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    top: -80,
    right: -60,
  },
  leftContent: {
    maxWidth: 520,
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  leftLogo: {
    height: 42,
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
    marginBottom: 28,
    filter: 'brightness(0) invert(1)',
  },
  leftEyebrow: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.4px',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    margin: '0 0 12px 0',
  },
  leftTitle: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 44,
    fontWeight: 800,
    color: '#FFFFFF',
    lineHeight: 1.15,
    letterSpacing: '-0.6px',
    margin: '0 0 16px 0',
  },
  leftSubtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 1.55,
    margin: '0 0 40px 0',
  },
  featuresContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  featureItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: '16px 18px',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureTextContainer: { flex: 1 },
  featureTitle: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 4px 0',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 1.45,
    margin: 0,
  },
  rightSection: {
    flex: 1,
    backgroundColor: '#EAE4DD',
    overflowY: 'auto',
  },
  rightSectionContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '72px 48px',
    minHeight: '100vh',
  },
  rightSectionContentMobile: {
    padding: '28px 16px',
    minHeight: '100vh',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: '36px 32px',
    boxShadow: '0 16px 40px rgba(27,52,92,0.10)',
  },
  brandRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logo: {
    height: 40,
    width: 'auto',
    maxWidth: 180,
    objectFit: 'contain',
    display: 'block',
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    background: '#E4F6EC',
    color: '#0B855C',
    borderRadius: 999,
    padding: '5px 12px',
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 14,
  },
  title: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 28,
    fontWeight: 800,
    color: '#1B2436',
    textAlign: 'center',
    letterSpacing: '-0.5px',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: 15,
    color: '#9AA3B5',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: '0 0 28px 0',
  },
  formContainer: { width: '100%' },
  inputLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1B2436',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#F3F5F8',
    borderRadius: 14,
    border: '1px solid transparent',
    outline: 'none',
    padding: '0 16px',
    fontSize: 15,
    color: '#1B2436',
    marginBottom: 18,
    boxSizing: 'border-box',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    margin: '0 0 16px 0',
  },
  successBox: {
    background: '#E4F6EC',
    borderRadius: 16,
    padding: '16px 18px',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#0B7A54',
    textAlign: 'center',
    lineHeight: 1.5,
    margin: 0,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    background: 'linear-gradient(135deg, #F2542D 0%, #E23E17 100%)',
    borderRadius: 14,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(242,84,45,0.25)',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  primaryButtonText: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  saveButton: {
    width: '100%',
    height: 52,
    background: 'linear-gradient(135deg, #0E9F6E 0%, #0B855C 100%)',
    borderRadius: 14,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(14,159,110,0.22)',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  saveButtonText: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#FFFFFF',
  },
  backButton: {
    width: '100%',
    height: 44,
    backgroundColor: 'transparent',
    borderRadius: 12,
    border: 'none',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#9AA3B5',
  },
  spinnerContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '36px 0',
  },
  spinner: {
    width: 44,
    height: 44,
    border: '4px solid #F3F5F8',
    borderTop: '4px solid #F2542D',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  helpText: {
    fontSize: 13,
    color: '#9AA3B5',
    textAlign: 'center',
    lineHeight: 1.45,
    margin: '28px 0 0 0',
  },
  helpLink: {
    color: '#1763C9',
    textDecoration: 'none',
    fontWeight: 600,
  },
};

export default PublicPasswordResetScreen;
