import React, { useEffect, useRef, useState } from 'react';
import { appScreenTheme as theme } from '../../styles';
import { apiService } from '../../services/api.service';
import { ChefDocumentStatus } from '../../types';
import {
  EXPIRATION_WARNING_DAYS,
  formatLongDate,
  getDaysUntilExpiration,
  resolveDocumentBadge,
} from '../../utils/chefDocuments';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Detalle de un documento de la cocinera (bottom sheet).
 * `catalogItem` es la definición del tipo; `document` puede ser null cuando
 * todavía no se ha cargado ninguno.
 */
const DocumentSheet = ({ visible, onClose, catalogItem, document, onUploaded }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Al cambiar de documento (o cerrar) se limpia lo que hubiera quedado del anterior.
  useEffect(() => {
    setSelectedFile(null);
    setFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [catalogItem?.type, visible]);

  if (!visible || !catalogItem) return null;

  const badge = resolveDocumentBadge(document);
  const daysLeft = document ? getDaysUntilExpiration(document.dateEnd) : null;
  const emission = document ? formatLongDate(document.dateStart) : null;
  const expiration = document ? formatLongDate(document.dateEnd) : null;

  const isExpired = daysLeft !== null && daysLeft < 0;
  const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRATION_WARNING_DAYS;
  const showBanner = Boolean(document) && (isExpired || isExpiring);

  const bannerTitle = isExpired ? 'Tu documento venció' : 'Tu documento está por vencer';
  const bannerText = isExpired
    ? 'Comunícate con el equipo de Cociname para renovarlo y seguir recibiendo reservas.'
    : `Vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}. Te avisaremos cuando puedas renovarlo.`;
  const bannerColor = isExpired ? '#C2492A' : '#C7891A';
  const bannerBg = isExpired ? '#FDECE7' : '#FCF0D8';
  const bannerBorder = isExpired ? '#F5C7B8' : '#F0DCA8';

  // Puede subir si aún no tiene el documento, o si el último fue rechazado/observado
  // y necesita corregirlo. Con Pendiente o Aprobado, la renovación la habilita el staff.
  const status = Number(document?.documentStatus || 0);
  const canUpload = !document
    || status === ChefDocumentStatus.Rechazado
    || status === ChefDocumentStatus.Observado;

  const handlePickFile = (event) => {
    const file = event.target.files?.[0] || null;
    setFeedback(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setFeedback({ type: 'error', text: 'Formato no permitido. Sube un PDF o una imagen (JPG/PNG).' });
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setFeedback({ type: 'error', text: 'El archivo supera el tamaño máximo permitido (10 MB).' });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setFeedback(null);

    try {
      const response = await apiService.uploadChefDocument({
        file: selectedFile,
        documentType: catalogItem.type,
      });

      if (!response.success) {
        throw new Error(response.errorMessage || 'No se pudo subir el documento.');
      }

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFeedback({ type: 'success', text: 'Documento enviado. El equipo de Cociname lo revisará.' });

      if (typeof onUploaded === 'function') await onUploaded();
    } catch (error) {
      setFeedback({ type: 'error', text: error?.message || 'No se pudo subir el documento.' });
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
                <div style={styles.headerTitle}>{catalogItem.title}</div>
                <div style={styles.headerSub}>{catalogItem.sub}</div>
              </div>
              <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Cerrar">
                ✕
              </button>
            </div>
          </div>

          <div style={styles.body}>
            {showBanner && (
              <div style={{ ...styles.banner, background: bannerBg, borderColor: bannerBorder }}>
                <span style={styles.bannerIcon}>🔔</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...styles.bannerTitle, color: bannerColor }}>{bannerTitle}</div>
                  <div style={{ ...styles.bannerText, color: bannerColor }}>{bannerText}</div>
                </div>
              </div>
            )}

            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <div style={{ ...styles.cardIcon, background: catalogItem.tileBg }}>
                    {catalogItem.emoji}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.cardTitle}>{catalogItem.title}</div>
                    <div style={styles.cardSub}>{catalogItem.sub}</div>
                  </div>
                </div>
                <span style={{ ...styles.cardBadge, color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
              </div>

              {document ? (
                <div style={styles.grid}>
                  <div style={styles.gridCell}>
                    <div style={styles.gridLabel}>Emisión</div>
                    <div style={styles.gridValue}>{emission || 'No registrada'}</div>
                  </div>
                  <div style={styles.gridCell}>
                    <div style={styles.gridLabel}>Vencimiento</div>
                    <div
                      style={{
                        ...styles.gridValue,
                        color: isExpired || isExpiring ? badge.color : theme.textPrimary,
                      }}
                    >
                      {expiration || 'Sin vencimiento'}
                    </div>
                  </div>
                  {document.commentsChef && document.commentsChef !== '-' && (
                    <div style={{ ...styles.gridCell, gridColumn: '1 / -1' }}>
                      <div style={styles.gridLabel}>Comentarios</div>
                      <div style={styles.gridValue}>{document.commentsChef}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.emptyBox}>
                  Todavía no tienes este documento cargado. El equipo de Cociname lo registra
                  cuando lo recibe.
                </div>
              )}
            </div>

            {document?.document && (
              <a
                href={document.document}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.downloadButton}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v12M7 11l5 5 5-5" />
                  <path d="M4 20h16" />
                </svg>
                Ver documento
              </a>
            )}

            {canUpload ? (
              <div style={styles.uploadBox}>
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
                  {selectedFile ? 'Cambiar archivo' : 'Elegir archivo'}
                </button>

                {selectedFile && (
                  <div style={styles.fileName}>{selectedFile.name}</div>
                )}

                <button
                  type="button"
                  style={{
                    ...styles.primaryButton,
                    ...(!selectedFile || uploading ? styles.primaryButtonDisabled : {}),
                  }}
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? 'Enviando...' : 'Enviar documento'}
                </button>

                <div style={styles.uploadHint}>
                  PDF o imagen (JPG/PNG), máximo 10 MB.
                </div>
              </div>
            ) : (
              <div style={styles.renewNote}>
                Te avisaremos cuando puedas renovar este documento.
              </div>
            )}

            {feedback && (
              <div
                style={{
                  ...styles.feedback,
                  color: feedback.type === 'error' ? '#C2492A' : '#0B855C',
                  background: feedback.type === 'error' ? '#FDECE7' : '#E4F6EC',
                }}
              >
                {feedback.text}
              </div>
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
  headerText: {
    flex: 1,
    minWidth: 0,
  },
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
    // Sin flex-centering el glifo "✕" queda descuadrado dentro del círculo:
    // el navegador aplica su propio padding y line-height al <button>.
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
    boxSizing: 'border-box',
  },
  body: {
    padding: '18px 22px 32px',
  },
  banner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    border: '1.5px solid',
    borderRadius: 18,
    padding: '14px 16px',
    marginBottom: 18,
  },
  bannerIcon: {
    fontSize: 19,
    lineHeight: 1,
    flex: 'none',
  },
  bannerTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 14,
  },
  bannerText: {
    fontSize: 13,
    opacity: 0.85,
    marginTop: 2,
    lineHeight: 1.45,
  },
  card: {
    background: '#fff',
    borderRadius: 22,
    padding: 22,
    boxShadow: '0 6px 22px rgba(27,52,92,.09)',
    border: '1px solid #F0E9E1',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    flex: 'none',
  },
  cardTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 15,
    color: theme.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 1,
  },
  cardBadge: {
    fontSize: 11.5,
    fontWeight: 800,
    fontFamily: theme.fontHeading,
    borderRadius: 999,
    padding: '6px 13px',
    flex: 'none',
    whiteSpace: 'nowrap',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: '#F0E9E1',
    borderRadius: 14,
    overflow: 'hidden',
  },
  gridCell: {
    background: '#FBF8F4',
    padding: '14px 16px',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
  },
  gridValue: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    marginTop: 4,
    color: theme.textPrimary,
    wordBreak: 'break-word',
  },
  emptyBox: {
    background: '#FBF8F4',
    borderRadius: 14,
    padding: '16px',
    fontSize: 13.5,
    color: theme.textSecondary,
    lineHeight: 1.5,
  },
  downloadButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 18,
    background: '#fff',
    border: '1.5px solid #E3DED7',
    color: '#5B6577',
    borderRadius: 14,
    padding: 14,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'none',
    boxSizing: 'border-box',
  },
  renewNote: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12.5,
    color: theme.textMuted,
    lineHeight: 1.5,
  },
  uploadBox: {
    marginTop: 18,
  },
  pickButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    background: '#fff',
    border: '1.5px dashed #D8CFC5',
    color: '#5B6577',
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
  primaryButton: {
    width: '100%',
    marginTop: 10,
    background: theme.primaryGradient,
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
  uploadHint: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 12,
    color: theme.textMuted,
  },
  feedback: {
    marginTop: 12,
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.45,
    textAlign: 'center',
  },
};

export default DocumentSheet;
