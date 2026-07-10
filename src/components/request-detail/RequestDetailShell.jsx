import React from 'react';
import { appScreenTheme as theme } from '../../styles';

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1763C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1763C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);

const IconChef = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1763C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 19h12M7 19v-3a5 5 0 01-1-9 4 4 0 017-2 4 4 0 016 3 4 4 0 01-2 8v3" />
  </svg>
);

const IconList = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1763C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 3v4h6V3" /><path d="M9 12l2 2 4-4" />
  </svg>
);

const rowIcons = {
  calendar: <IconCalendar />,
  clock: <IconClock />,
  chef: <IconChef />,
  list: <IconList />,
};

/**
 * Layout unificado de detalle de solicitud (mockup Cociname).
 * Sin recibo por honorarios.
 */
export const RequestDetailShell = ({
  onBack,
  serviceTitle,
  clientName,
  statusLabel = 'Pendiente',
  statusColor = '#1763C9',
  statusBg = '#E1EBFA',
  isEvent = false,
  scheduleRows = [],
  allergies = [],
  district = '',
  reference = '',
  dishes = [],
  dishesSectionTitle = 'Platos solicitados',
  serviceAmount = '',
  clientComment = '',
  showActions = true,
  onAccept,
  onReject,
  submitting = false,
  extraSection = null,
}) => (
  <div className="coci-page-wrap coci-page-wrap--requests" style={styles.page}>
    <button type="button" style={styles.backButton} onClick={onBack}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Volver a solicitudes
    </button>

    <div style={styles.banner}>
      <div style={styles.bannerIcon}>!</div>
      <div>
        <div style={styles.bannerTitle}>Aún no es una reserva</div>
        <div style={styles.bannerText}>Es una solicitud pendiente. Revísala y decide si la aceptas.</div>
      </div>
    </div>

    <div style={styles.chipsRow}>
      <span style={{ ...styles.statusChip, color: statusColor, background: statusBg }}>{statusLabel}</span>
      {isEvent && <span style={styles.eventChip}>🎉 EVENTO</span>}
    </div>

    <h1 style={styles.serviceTitle}>{serviceTitle}</h1>
    <p style={styles.clientLine}>Solicita: {clientName}</p>

    {scheduleRows.length > 0 && (
      <div style={styles.infoCard}>
        {scheduleRows.map((row, index) => (
          <div
            key={`${row.label}-${index}`}
            style={{
              ...styles.infoRow,
              ...(index < scheduleRows.length - 1 ? styles.infoRowBorder : {}),
            }}
          >
            {rowIcons[row.icon] || rowIcons.calendar}
            <span>{row.label}</span>
          </div>
        ))}
      </div>
    )}

    {allergies.length > 0 && (
      <div style={styles.allergyCard}>
        <div style={styles.allergyTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7891A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" />
          </svg>
          Alergias y restricciones
        </div>
        <div style={styles.allergyTags}>
          {allergies.map((item) => (
            <span key={item} style={styles.allergyTag}>{item}</span>
          ))}
        </div>
      </div>
    )}

    <div style={styles.sectionHeading}><span style={styles.sectionDot}>◉</span> Zona y referencia</div>
    <div style={styles.locationCard}>
      {district ? (
        <>
          <div style={styles.locationLabel}>Distrito</div>
          <div style={styles.locationDistrict}>{district}</div>
        </>
      ) : null}
      {reference ? <p style={styles.locationRef}>{reference}</p> : null}
      <div style={styles.locationNote}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B0B8C6" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
        Dirección exacta y mapa disponibles al aceptar el servicio.
      </div>
    </div>

    {dishes.length > 0 && (
      <>
        <div style={styles.sectionHeading}><span style={styles.sectionEmoji}>🍳</span> {dishesSectionTitle}</div>
        <div style={styles.infoCard}>
          {dishes.map((dish, index) => (
            <div
              key={`${dish.title}-${index}`}
              style={{
                ...styles.dishRow,
                ...(index < dishes.length - 1 ? styles.dishRowBorder : {}),
              }}
            >
              <div style={styles.dishText}>
                <div style={styles.dishTitle}>{dish.title}</div>
                {dish.portionsText ? <div style={styles.dishSub}>{dish.portionsText}</div> : null}
              </div>
              {dish.onRecipe ? (
                <button type="button" style={styles.recipeButton} onClick={dish.onRecipe}>
                  Ver receta
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </>
    )}

    {clientComment ? (
      <>
        <div style={styles.sectionHeading}>Comentarios del cliente</div>
        <div style={styles.commentCard}>
          <p style={styles.commentText}>{clientComment}</p>
        </div>
      </>
    ) : null}

    {extraSection}

    {serviceAmount && (
      <>
        <div style={styles.sectionHeading}><span style={styles.sectionEmoji}>$</span> Detalle del servicio</div>
        <div style={styles.infoCard}>
          <div style={{ ...styles.amountRow, ...styles.infoRowBorder }}>
            <span style={styles.amountLabel}>Cocina</span>
            <span style={styles.amountValue}>{serviceAmount}</span>
          </div>
          <div style={styles.amountRow}>
            <span style={styles.amountTotalLabel}>Total por visita</span>
            <span style={styles.amountTotalValue}>{serviceAmount}</span>
          </div>
        </div>
      </>
    )}

    {showActions && (
      <div style={styles.actions}>
        <button type="button" style={styles.rejectBtn} onClick={onReject} disabled={submitting}>
          Rechazar
        </button>
        <button type="button" style={styles.acceptBtn} onClick={onAccept} disabled={submitting}>
          {submitting ? 'Aceptando...' : 'Aceptar servicio'}
        </button>
      </div>
    )}
  </div>
);

const styles = {
  page: {
    fontFamily: theme.fontBody,
    color: theme.textPrimary,
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    background: 'none',
    border: 'none',
    color: '#8089A0',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    marginBottom: 16,
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#1B2436',
    padding: '13px 20px',
    margin: '0 0 18px',
    borderRadius: 16,
    boxShadow: '0 8px 22px rgba(27,36,54,0.22)',
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.14)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 800,
    flexShrink: 0,
  },
  bannerTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 14,
    color: '#fff',
  },
  bannerText: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 1,
    lineHeight: 1.35,
  },
  chipsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statusChip: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderRadius: 999,
    padding: '5px 12px',
  },
  eventChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: theme.fontHeading,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: '#fff',
    background: '#7A4FD0',
    borderRadius: 999,
    padding: '5px 13px',
    boxShadow: '0 4px 10px rgba(122,79,208,0.3)',
  },
  serviceTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 26,
    letterSpacing: -0.5,
    lineHeight: 1.15,
    margin: '10px 0 0',
  },
  clientLine: {
    fontSize: 14,
    color: theme.textMuted,
    margin: '5px 0 20px',
  },
  infoCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '8px 22px',
    boxShadow: theme.cardShadow,
    marginBottom: 26,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 13,
    padding: '16px 0',
    fontSize: 15.5,
    fontWeight: 600,
  },
  infoRowBorder: {
    borderBottom: `1px solid ${theme.divider}`,
  },
  allergyCard: {
    background: '#FFF6E9',
    border: '1.5px solid #F5DCA6',
    borderRadius: 20,
    padding: '18px 22px',
    marginBottom: 26,
  },
  allergyTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
    color: '#8A6314',
    marginBottom: 13,
  },
  allergyTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 9,
  },
  allergyTag: {
    background: '#fff',
    border: '1px solid #F0D9A6',
    color: '#8A6314',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 999,
    padding: '7px 14px',
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 18,
    marginBottom: 12,
  },
  sectionDot: { color: theme.accent },
  sectionEmoji: { color: theme.accent },
  locationCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '20px 22px',
    boxShadow: theme.cardShadow,
    marginBottom: 26,
  },
  locationLabel: {
    color: theme.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationDistrict: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 16,
  },
  locationRef: {
    color: '#5B6577',
    fontSize: 14.5,
    marginTop: 12,
    lineHeight: 1.5,
  },
  locationNote: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    marginTop: 16,
    paddingTop: 14,
    borderTop: `1px solid ${theme.divider}`,
    fontSize: 13,
    color: '#8089A0',
  },
  dishRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '18px 0',
  },
  dishRowBorder: {
    borderBottom: `1px solid ${theme.divider}`,
  },
  dishText: { minWidth: 0, flex: 1 },
  dishTitle: {
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 16,
  },
  dishSub: {
    fontSize: 13.5,
    color: theme.textMuted,
    marginTop: 3,
  },
  recipeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: theme.link,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  commentCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '18px 22px',
    boxShadow: theme.cardShadow,
    marginBottom: 26,
  },
  commentText: {
    margin: 0,
    fontSize: 14.5,
    lineHeight: 1.55,
    color: '#4B5568',
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px 0',
    fontSize: 15.5,
  },
  amountLabel: { color: '#8089A0' },
  amountValue: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    color: theme.textPrimary,
  },
  amountTotalLabel: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
  },
  amountTotalValue: {
    fontFamily: theme.fontHeading,
    fontWeight: 800,
    fontSize: 16,
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginBottom: 20,
  },
  rejectBtn: {
    flex: 1,
    background: '#fff',
    border: '1.5px solid #C3CCDA',
    color: '#5B6577',
    borderRadius: 16,
    padding: 16,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
  },
  acceptBtn: {
    flex: 1,
    background: '#0E9F6E',
    color: '#fff',
    border: 'none',
    borderRadius: 16,
    padding: 16,
    fontFamily: theme.fontHeading,
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(14,159,110,0.26)',
  },
};

export default RequestDetailShell;
