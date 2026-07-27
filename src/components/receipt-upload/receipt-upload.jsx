import React, { useEffect, useRef, useState } from 'react';
import { appScreenTheme as theme } from '../../styles';
import { apiService } from '../../services/api.service';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

const formatAmount = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

/**
 * Sheet para subir el recibo por honorarios de un servicio.
 * La cocinera ya emitió el RxH en SUNAT; aquí solo lo entrega.
 */
const ReceiptUpload = ({ visible, onClose, service, onUploaded }) => {
  const fileInputRef = useRef(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setReceiptNumber('');
    setSelectedFile(null);
    setErrorMessage('');
    setDone(false);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [visible, service?.serviceType, service?.serviceId]);

  if (!visible || !service) return null;

  const handlePickFile = (event) => {
    const file = event.target.files?.[0] || null;
    setErrorMessage('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setErrorMessage('Formato no permitido. Sube un PDF o una imagen (JPG/PNG).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setErrorMessage('El archivo supera el tamaño máximo permitido (10 MB).');
      return;
    }

    setSelectedFile(file);
  };

  const handleSend = async () => {
    if (uploading) return;

    if (!receiptNumber.trim()) {
      setErrorMessage('Ingresa el número de tu recibo por honorarios.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Adjunta el archivo del recibo.');
      return;
    }

    setUploading(true);
    setErrorMessage('');

    try {
      const response = await apiService.uploadReceipt({
        file: selectedFile,
        serviceType: service.serviceType,
        serviceId: service.serviceId,
        receiptNumber: receiptNumber.trim(),
      });

      if (!response.success) {
        throw new Error(response.errorMessage || 'No se pudo enviar el recibo.');
      }

      setDone(true);
      if (typeof onUploaded === 'function') await onUploaded();
    } catch (error) {
      setErrorMessage(error?.message || 'No se pudo enviar el recibo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.overlayInner}>
        <div style={styles.sheet} onClick={(event) => event.stopPropagation()}>

          <div style={styles.header}>
            <div style={styles.handle} />
            <div style={styles.headerRow}>
              <div style={styles.headerText}>
                <div style={styles.headerTitle}>Recibo por honorarios</div>
                <div style={styles.headerSub}>{service.customerName || service.reference || 'Servicio'}</div>
              </div>
              <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
          </div>

          <div style={styles.body}>
            {done ? (
              <div style={{ textAlign: 'center' }}>
                <div style={styles.successIcon}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div style={styles.successTitle}>¡Recibo enviado!</div>
                <div style={styles.successText}>
                  El equipo de Cociname lo revisará. Te avisaremos cuando sea aprobado.
                </div>
                <button type="button" style={styles.darkButton} onClick={onClose}>Entendido</button>
              </div>
            ) : (
              <>
                <div style={styles.dataCard}>
                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>DNI del cliente</span>
                    <span style={{ ...styles.dataValue, letterSpacing: 1 }}>
                      {service.customerDocument || '—'}
                    </span>
                  </div>

                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Nombre del cliente</span>
                    <span style={styles.dataValue}>{service.customerName || '—'}</span>
                  </div>

                  <div style={styles.dataRow}>
                    <span style={styles.dataLabel}>Concepto</span>
                    <span style={styles.dataValue}>{service.reference || 'Servicio de cocina'}</span>
                  </div>

                  <div style={{ ...styles.dataRow, borderBottom: 'none' }}>
                    <span style={styles.dataLabel}>Monto</span>
                    <span style={styles.dataAmount}>{formatAmount(service.expectedAmount)}</span>
                  </div>

                  {service.concepts?.length > 1 && (
                    <div style={styles.conceptBreakdown}>
                      {service.concepts.map((concept, index) => (
                        <span key={index}>
                          {index > 0 ? ' · ' : ''}
                          {concept.conceptName} {formatAmount(concept.amount)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={styles.noticeBox}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
                    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 01-3.4 0" />
                  </svg>
                  <span style={styles.noticeText}>
                    Al emitirlo, el recibo se sube y queda <b>conectado a esta reserva</b> automáticamente.
                  </span>
                </div>

                <label style={styles.label}>Número de recibo</label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(event) => setReceiptNumber(event.target.value)}
                  placeholder="Ej. E001-123"
                  maxLength={50}
                  style={styles.input}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handlePickFile}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  style={styles.pickButton}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4M7 9l5-5 5 5" />
                    <path d="M4 20h16" />
                  </svg>
                  {selectedFile ? 'Cambiar archivo' : 'Adjuntar recibo'}
                </button>

                {selectedFile && <div style={styles.fileName}>{selectedFile.name}</div>}

                {errorMessage && <div style={styles.error}>{errorMessage}</div>}

                <button
                  type="button"
                  style={{
                    ...styles.sendButton,
                    ...(uploading ? styles.sendButtonDisabled : {}),
                  }}
                  onClick={handleSend}
                  disabled={uploading}
                >
                  {uploading ? 'Enviando...' : 'Emitir y conectar a la reserva'}
                </button>

                <div style={styles.uploadHint}>PDF o imagen (JPG/PNG), máximo 10 MB.</div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 98,
    display: 'flex',
    justifyContent: 'center',
  },
  overlayInner: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    background: 'rgba(20,30,50,.55)',
    display: 'flex',
    alignItems: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: '92%',
    overflowY: 'auto',
    background: '#F8F4EF',
    borderRadius: '26px 26px 0 0',
    boxShadow: '0 -12px 40px rgba(0,0,0,.28)',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    background: '#F8F4EF',
    padding: '14px 22px 12px',
    borderBottom: '1px solid #EDE6DD',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    background: '#D8D0C6',
    margin: '0 auto 14px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: -0.3,
    color: theme.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: 'none',
    background: '#EDE6DD',
    color: theme.textCaption,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    boxSizing: 'border-box',
  },
  body: { padding: '18px 22px 32px' },
  dataCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '6px 20px',
    boxShadow: '0 4px 16px rgba(27,52,92,.06)',
    marginBottom: 18,
  },
  dataRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    padding: '16px 0',
    borderBottom: '1px solid #F3F5F8',
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: theme.textCaption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dataValue: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15,
    textAlign: 'right',
    color: theme.textPrimary,
  },
  dataAmount: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 20,
    color: '#0E9F6E',
    textAlign: 'right',
  },
  conceptBreakdown: {
    paddingBottom: 14,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'right',
    lineHeight: 1.5,
  },
  noticeBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 11,
    background: '#E9F6EF',
    border: '1.5px solid #C3E6D3',
    borderRadius: 16,
    padding: '13px 15px',
    marginBottom: 18,
  },
  noticeText: {
    fontSize: 12.5,
    color: '#0B6B4B',
    lineHeight: 1.45,
  },
  label: {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 700,
    color: theme.textCaption,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px 14px',
    borderRadius: 14,
    border: '1.5px solid #E3DED7',
    fontFamily: theme.fontBody,
    fontSize: 14.5,
    color: theme.textPrimary,
    outline: 'none',
    marginBottom: 14,
  },
  pickButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    background: '#fff',
    border: '1.5px dashed #BEE3D0',
    color: '#0B855C',
    borderRadius: 14,
    padding: 14,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  fileName: {
    marginTop: 10,
    fontSize: 12.5,
    color: theme.textSecondary,
    textAlign: 'center',
    wordBreak: 'break-all',
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
  sendButton: {
    width: '100%',
    marginTop: 14,
    background: '#0E9F6E',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: 15,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14.5,
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(14,159,110,.22)',
    boxSizing: 'border-box',
  },
  sendButtonDisabled: {
    background: '#E3DED7',
    color: '#9AA3B5',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  uploadHint: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    color: theme.textMuted,
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
    marginBottom: 8,
    color: theme.textPrimary,
  },
  successText: {
    fontSize: 14.5,
    color: '#5B6577',
    lineHeight: 1.55,
    marginBottom: 20,
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

export default ReceiptUpload;
