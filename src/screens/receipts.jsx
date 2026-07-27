import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appScreenTheme as theme, mockup } from '../styles';
import { apiService } from '../services/api.service';
import { ReceiptUpload } from '../components/receipt-upload';
import { ReceiptStatus } from '../types';

const SERVICE_TYPE_LABELS = {
  1: 'Servicio a domicilio',
  2: 'Suscripción',
  3: 'Evento',
  4: 'Plan dietético',
  5: 'Tarea de cocina',
};

const formatAmount = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

/** "2026-07-28" → "28 jul". Las fechas de servicio ya vienen en hora local. */
const formatShortDate = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;

  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]}`;
};

const getStatusBadge = (status) => {
  switch (Number(status)) {
    case ReceiptStatus.Aprobado: return { label: 'Aprobado', color: '#0B855C', bg: '#E4F6EC' };
    case ReceiptStatus.Rechazado: return { label: 'Rechazado', color: '#C2492A', bg: '#FDECE7' };
    case ReceiptStatus.Observado: return { label: 'Observado', color: '#C7891A', bg: '#FCF0D8' };
    default: return { label: 'En revisión', color: '#C7891A', bg: '#FCF0D8' };
  }
};

const ReceiptsScreen = () => {
  const navigate = useNavigate();

  const [pending, setPending] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeService, setActiveService] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [pendingResponse, sentResponse] = await Promise.all([
        apiService.getPendingReceipts(),
        apiService.getMyReceipts(1, 50),
      ]);

      if (!pendingResponse.success) {
        throw new Error(pendingResponse.errorMessage || 'No se pudieron cargar tus recibos pendientes.');
      }

      setPending(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);
      setSent(sentResponse.success && Array.isArray(sentResponse.data) ? sentResponse.data : []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      setPending([]);
      setSent([]);
      setErrorMessage(error?.message || 'No se pudieron cargar tus recibos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Un rechazado u observado se puede volver a enviar; se muestra aparte
  // para que la cocinera sepa que debe corregirlo.
  const needsAction = sent.filter((item) => (
    item.receiptStatus === ReceiptStatus.Rechazado
    || item.receiptStatus === ReceiptStatus.Observado
  ));

  return (
    <div className="coci-page-wrap">
      <button type="button" style={styles.backButton} onClick={() => navigate('/profile')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver a mi perfil
      </button>

      <h1 style={{ ...mockup.screenTitle, marginBottom: 4 }}>Recibos pendientes</h1>
      <p style={{ ...mockup.screenSubtitle, marginBottom: 20 }}>
        Emite tu recibo por honorarios de los servicios ya finalizados.
      </p>

      {loading ? (
        <div style={styles.stateCard}>Cargando tus recibos...</div>
      ) : errorMessage ? (
        <div style={styles.stateCard}>
          <div style={{ marginBottom: 12 }}>{errorMessage}</div>
          <button type="button" style={styles.retryButton} onClick={() => void loadData()}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {needsAction.length > 0 && (
            <div style={styles.alertBox}>
              <b>Tienes {needsAction.length === 1 ? 'un recibo' : `${needsAction.length} recibos`} por corregir.</b>
              {' '}Revísalos abajo y vuelve a enviarlos.
            </div>
          )}

          {pending.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyEmoji}>✅</div>
              <div style={styles.emptyTitle}>Todo emitido</div>
              <div style={styles.emptyText}>No tienes recibos pendientes por emitir.</div>
            </div>
          ) : (
            <div style={styles.list}>
              {pending.map((item) => (
                <div key={`${item.serviceType}-${item.serviceId}`} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <div style={styles.cardIcon}>🧾</div>

                    <div style={styles.cardText}>
                      <div style={styles.cardTitle}>
                        {item.customerName || SERVICE_TYPE_LABELS[item.serviceType] || 'Servicio'}
                      </div>
                      <div style={styles.cardSub}>
                        {SERVICE_TYPE_LABELS[item.serviceType]} · {formatShortDate(item.serviceDate)}
                      </div>
                    </div>

                    <div style={styles.cardAmountWrap}>
                      <div style={styles.cardAmountLabel}>Monto</div>
                      <div style={styles.cardAmount}>{formatAmount(item.expectedAmount)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={styles.emitButton}
                    onClick={() => setActiveService(item)}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6M9 13h6M9 17h4" />
                    </svg>
                    Emitir recibo por honorarios
                  </button>
                </div>
              ))}
            </div>
          )}

          {sent.length > 0 && (
            <>
              <div style={styles.sectionTitle}>Recibos enviados</div>
              <div style={styles.list}>
                {sent.map((item) => {
                  const badge = getStatusBadge(item.receiptStatus);
                  return (
                    <div key={item.id} style={styles.sentCard}>
                      <div style={styles.sentRow}>
                        <div style={styles.cardText}>
                          <div style={styles.sentNumber}>{item.receiptNumber}</div>
                          <div style={styles.cardSub}>
                            {item.customerName || SERVICE_TYPE_LABELS[item.serviceType]}
                            {item.serviceDate ? ` · ${formatShortDate(item.serviceDate)}` : ''}
                          </div>
                        </div>
                        <span style={{ ...styles.statusBadge, color: badge.color, background: badge.bg }}>
                          {badge.label}
                        </span>
                      </div>

                      <div style={styles.sentAmount}>{formatAmount(item.amount)}</div>

                      {item.adminNotes && (
                        <div style={styles.adminNote}>{item.adminNotes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <ReceiptUpload
        visible={Boolean(activeService)}
        onClose={() => setActiveService(null)}
        service={activeService}
        onUploaded={loadData}
      />
    </div>
  );
};

const styles = {
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    color: theme.textCaption,
    fontFamily: theme.fontBody,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
  },
  alertBox: {
    background: '#FCF0D8',
    border: '1.5px solid #F0DCA8',
    borderRadius: 14,
    padding: '13px 15px',
    fontSize: 13.5,
    color: '#8A6A16',
    lineHeight: 1.5,
    marginBottom: 16,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 22,
    padding: 20,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    marginBottom: 16,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: 'linear-gradient(135deg,#E4F6EC,#BFE9CF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flex: 'none',
  },
  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
    color: theme.textPrimary,
    lineHeight: 1.25,
  },
  cardSub: {
    fontSize: 12.5,
    color: theme.textMuted,
    marginTop: 2,
  },
  cardAmountWrap: {
    textAlign: 'right',
    flex: 'none',
  },
  cardAmountLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: 700,
  },
  cardAmount: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 17,
    color: theme.textPrimary,
  },
  emitButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    background: '#0E9F6E',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: 14,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    boxShadow: '0 8px 16px rgba(14,159,110,.22)',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
    color: theme.textPrimary,
    margin: '26px 0 12px',
  },
  sentCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadowSoft,
    borderRadius: 18,
    padding: 16,
  },
  sentRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  sentNumber: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14.5,
    color: theme.textPrimary,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 800,
    fontFamily: theme.fontHeading,
    borderRadius: 999,
    padding: '5px 11px',
    flex: 'none',
    whiteSpace: 'nowrap',
  },
  sentAmount: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
    color: theme.textPrimary,
    marginTop: 8,
  },
  adminNote: {
    marginTop: 10,
    background: '#FBF8F4',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 1.5,
  },
  emptyCard: {
    background: theme.cardBg,
    borderRadius: 22,
    padding: '50px 24px',
    textAlign: 'center',
    boxShadow: theme.cardShadowSoft,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 16,
    color: theme.textPrimary,
  },
  emptyText: {
    fontSize: 13.5,
    color: theme.textMuted,
    marginTop: 6,
  },
  stateCard: {
    background: theme.cardBg,
    boxShadow: theme.cardShadow,
    borderRadius: 20,
    padding: '28px 20px',
    textAlign: 'center',
    fontSize: 14,
    color: theme.textSecondary,
  },
  retryButton: {
    padding: '10px 22px',
    borderRadius: 12,
    border: 'none',
    background: theme.primaryGradient,
    color: '#fff',
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 13.5,
    cursor: 'pointer',
    boxShadow: theme.primaryShadow,
  },
};

export default ReceiptsScreen;
