import React, { useEffect, useState } from 'react';
import { appScreenTheme as theme } from '../../styles';
import { apiService } from '../../services/api.service';

const REASONS = [
  { value: 1, label: 'Ingrediente incorrecto' },
  { value: 2, label: 'Cantidad equivocada' },
  { value: 3, label: 'Paso confuso' },
  { value: 4, label: 'Agregar consejo' },
  { value: 5, label: 'Otro' },
];

/**
 * Popup para reportar una corrección sobre una receta concreta (MasterRecipe).
 * Tras enviar muestra el ticket devuelto por el API.
 */
const RecipeReport = ({ visible, onClose, masterRecipeId, menuId, recipeName }) => {
  const [reason, setReason] = useState(1);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketCode, setTicketCode] = useState('');

  useEffect(() => {
    if (visible) {
      setReason(1);
      setComment('');
      setErrorMessage('');
      setTicketCode('');
      setSending(false);
    }
  }, [visible, masterRecipeId]);

  if (!visible) return null;

  const handleSend = async () => {
    if (sending) return;

    if (!comment.trim()) {
      setErrorMessage('Cuéntanos qué debería corregirse.');
      return;
    }

    setSending(true);
    setErrorMessage('');

    try {
      const response = await apiService.sendRecipeFeedback({
        masterRecipeId,
        menuId,
        reasonType: reason,
        comment: comment.trim(),
      });

      if (!response.success) {
        throw new Error(response.errorMessage || 'No se pudo enviar tu observación.');
      }

      setTicketCode(response.data?.ticketCode || '');
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudo enviar tu observación.');
    } finally {
      setSending(false);
    }
  };

  const sent = Boolean(ticketCode);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.overlayInner}>
        <div style={styles.dialog} onClick={(event) => event.stopPropagation()}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={styles.successIcon}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div style={styles.successTitle}>¡Gracias por tu apoyo!</div>
              <div style={styles.successText}>
                Gracias por ayudarnos a mejorar las recetas. El equipo de cocina revisará tu observación.
              </div>
              <div style={styles.ticketBox}>
                <span style={styles.ticketStar}>✦</span>
                <span style={styles.ticketText}>
                  Tu código de seguimiento es <b>{ticketCode}</b>. Si aprobamos el cambio, la receta se
                  actualiza para todas las cocineras.
                </span>
              </div>
              <button type="button" style={styles.darkButton} onClick={onClose}>
                Entendido
              </button>
            </div>
          ) : (
            <>
              <div style={styles.header}>
                <div style={styles.title}>Cuéntanos más</div>
                <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Cerrar">
                  ✕
                </button>
              </div>
              <div style={styles.subtitle}>
                {recipeName
                  ? `Ayúdanos a mejorar "${recipeName}". El equipo de Cociname revisará tu observación.`
                  : 'Ayúdanos a mejorar esta receta. El equipo de Cociname revisará tu observación.'}
              </div>

              <div style={styles.sectionLabel}>¿Qué encontraste?</div>
              <div style={styles.chips}>
                {REASONS.map((item) => {
                  const active = reason === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReason(item.value)}
                      style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1000}
                placeholder="Cuéntanos qué debería corregirse (ingrediente, cantidad, paso…)"
                style={styles.textarea}
              />

              {errorMessage && <div style={styles.error}>{errorMessage}</div>}

              <button
                type="button"
                style={{ ...styles.primaryButton, ...(sending ? styles.primaryButtonDisabled : {}) }}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'Enviar observación'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    // Por encima del sheet de receta (z-index 95): antes quedaba detrás y no se
    // podía escribir sin cerrar la receta primero.
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
  },
  overlayInner: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    background: 'rgba(20,30,50,.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  },
  dialog: {
    width: '100%',
    maxHeight: '90%',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 24px 60px rgba(0,0,0,.3)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  title: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 19,
    letterSpacing: -0.3,
    color: theme.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: 'none',
    background: '#F4F0EC',
    color: theme.textCaption,
    fontSize: 15,
    cursor: 'pointer',
    flex: 'none',
    // Mismo motivo que en document-sheet: centrar el glifo dentro del círculo.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    boxSizing: 'border-box',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textCaption,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: theme.textCaption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },
  chip: {
    background: '#fff',
    border: '1.5px solid #E3DED7',
    color: '#5B6577',
    borderRadius: 999,
    padding: '9px 15px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: theme.fontBody,
    cursor: 'pointer',
  },
  chipActive: {
    background: theme.accentSoft,
    border: `1.5px solid ${theme.accent}`,
    color: '#C2492A',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 96,
    resize: 'vertical',
    border: '1.5px solid #E3DED7',
    borderRadius: 14,
    padding: '13px 15px',
    fontFamily: theme.fontBody,
    fontSize: 14.5,
    // Fondo claro explícito: con prefers-color-scheme: dark el navegador
    // pinta el textarea oscuro y el texto (#1B2436) queda ilegible.
    backgroundColor: '#FFFFFF',
    color: theme.textPrimary,
    caretColor: theme.textPrimary,
    colorScheme: 'light',
    outline: 'none',
    lineHeight: 1.5,
  },
  error: {
    marginTop: 12,
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 13,
    fontWeight: 600,
    color: '#C2492A',
    background: '#FDECE7',
  },
  primaryButton: {
    width: '100%',
    marginTop: 16,
    background: theme.accent,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: 15,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14.5,
    cursor: 'pointer',
    boxShadow: theme.primaryShadow,
    boxSizing: 'border-box',
  },
  primaryButtonDisabled: {
    background: '#E3DED7',
    color: '#9AA3B5',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    background: '#E4F6EC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  successTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 8,
    color: theme.textPrimary,
  },
  successText: {
    fontSize: 14.5,
    color: '#5B6577',
    lineHeight: 1.55,
    marginBottom: 18,
  },
  ticketBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#FFF6E9',
    border: '1.5px solid #F5DCA6',
    borderRadius: 14,
    padding: '13px 15px',
    textAlign: 'left',
    marginBottom: 20,
  },
  ticketStar: {
    color: '#C7891A',
    fontSize: 15,
    flex: 'none',
    lineHeight: 1.4,
  },
  ticketText: {
    fontSize: 13.5,
    color: '#6B5836',
    lineHeight: 1.5,
  },
  darkButton: {
    width: '100%',
    background: theme.textPrimary,
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: 15,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
};

export default RecipeReport;
