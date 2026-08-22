import React, { useEffect, useState } from 'react';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { StatusReservation } from '../types';
import { PUBLIC_LINK_TYPES, resolvePublicLinkToken } from '../utils/linkToken';
import { HelpDetail } from '../assets/svgs';
import {
  formatPublicDate,
  formatPublicHour,
  getChefDisplay,
  getCustomerFullName,
  getClientComment,
} from '../utils/formatters';

/**
 * Vista pública de tarea de servicio - accesible sin login mediante token
 * URL: /tarea/:token
 * Mismo diseño que el detalle asignado (reservationTareaDetail.jsx): una sola
 * columna con header blanco y tarjetas, sin las acciones privadas de la cocinera.
 */

const SUPPORT_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';

const pendingStatuses = new Set([
  StatusReservation.Creada,
  StatusReservation.Reprogramada,
  StatusReservation.ReasignacionCocinera,
]);

function getServiceModalityLabel(value) {
  return Number(value) === 1 ? 'Cocinera a domicilio' : 'Comida ya preparada';
}

function getTareaActivities(data) {
  const activities = data.activities ?? data.Activities;
  return Array.isArray(activities) ? activities : [];
}

export const PublicTareaScreen = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);
  const [comments, setComments] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { chefData, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!token) {
      setError('Enlace inválido');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { reservationId } = await resolvePublicLinkToken(token, PUBLIC_LINK_TYPES.TAREA);
        const response = await apiService.publicGetReservationServiceTaskByLink(reservationId);

        if (!isMounted) return;

        if (response.success && response.data) {
          setRecord(response.data);
          const existingComments = getClientComment(response.data);
          if (existingComments) setComments(existingComments);
        } else {
          setError(response.errorMessage || 'No se pudo cargar el detalle');
        }
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Enlace inválido o expirado');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const recordId = record?.id ?? record?.Id;
  const statusValue = record?.statusReservationServiceTask ?? record?.statusServiceTask ?? record?.statusReservation ?? record?.StatusReservation;
  const canAcceptAsChef = isAuthenticated
    && chefData?.chefId
    && (record?.chefId === null || record?.ChefId === null)
    && pendingStatuses.has(Number(statusValue));

  const getDateValue = (data) => data.dateService || data.DateService || data.dateReservationServiceTask || data.dateReservation;
  const getHourValue = (data) => data.hourService || data.HourService || data.hourReservationServiceTask || data.hourReservation;

  const handleSendComments = async () => {
    if (!recordId || !comments.trim()) {
      alert('El comentario no puede estar vacío');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await apiService.updateReservationServiceTaskClientCommentary(recordId, comments.trim());
      if (response.success) {
        alert('Comentario enviado');
      } else {
        alert(response.errorMessage || 'No se pudo enviar el comentario');
      }
    } catch (commentError) {
      console.error('Error sending comment:', commentError);
      alert('No se pudo enviar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAccept = async () => {
    if (!chefData?.chefId || !recordId) return;

    try {
      setSubmittingAssignment(true);
      const response = await apiService.updateReservationServiceTaskAssignment(chefData.chefId, {
        reservationServiceTaskId: recordId,
        chefId: chefData.chefId,
        assignmentStatus: 1,
        rejectionReason: '',
        status: true,
      });
      if (response.success) {
        setAcceptModalVisible(true);
      } else {
        alert(response.errorMessage || 'Error al aceptar');
      }
    } catch (acceptError) {
      console.error('Error accepting tarea:', acceptError);
      alert('Error al aceptar la solicitud');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleReject = async () => {
    if (!chefData?.chefId || !recordId || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setSubmittingAssignment(true);
      const response = await apiService.updateReservationServiceTaskAssignment(chefData.chefId, {
        reservationServiceTaskId: recordId,
        chefId: chefData.chefId,
        assignmentStatus: 2,
        rejectionReason: rejectionReason.trim(),
        status: false,
      });
      if (response.success) {
        setRejectModalVisible(false);
        setRejectionReason('');
        alert('Solicitud rechazada');
      } else {
        alert(response.errorMessage || 'Error al rechazar');
      }
    } catch (rejectError) {
      console.error('Error rejecting tarea:', rejectError);
      alert('Error al rechazar la solicitud');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.errorText}>{error || 'Enlace inválido o expirado'}</p>
        </div>
      </div>
    );
  }

  const chef = getChefDisplay(record);
  const customerName = getCustomerFullName(record);
  const phone = record.contactPhone || record.ContactPhone || record.numberClient || record.NumberClient || '-';
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const activities = getTareaActivities(record);
  const hours = Number(record.estimatedHours ?? record.EstimatedHours ?? record.iaSuggestedHours ?? record.IaSuggestedHours ?? 0);
  const clientComment = getClientComment(record);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Detalle de Actividad de Cocina</h1>
        <span style={styles.publicBadge}>Vista pública</span>
      </div>

      <div style={styles.content}>
        <p style={styles.subtitle}>#{recordId}</p>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Información general</h2>
          <div style={styles.infoGrid}>
            <InfoItem label="Cliente" value={customerName || 'No especificado'} />
            <InfoItem label="Teléfono" value={phone} />
            <InfoItem label="Ubicación" value={`${direction}${reference ? `, ${reference}` : ''}`} />
            <InfoItem
              label="Personas"
              value={`${record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount ?? '-'} personas`}
            />
            <InfoItem label="Servicio" value={getServiceModalityLabel(record.serviceModality ?? record.ServiceModality)} />
            <InfoItem label="Compras" value={record.puchaseIngredients ? 'Con compras' : 'Sin compras'} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Qué necesitas</h2>
          <p style={styles.needsText}>{record.needsDescription || record.NeedsDescription || '-'}</p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Cotización estimada</h2>
          <div style={styles.quoteBox}>
            <p style={styles.quoteLabel}>Horas estimadas</p>
            <p style={styles.quoteValue}>{hours > 0 ? `${hours} h` : 'Por confirmar'}</p>
          </div>
          {activities.length > 0 ? activities.map((item, index) => {
            const description = item.activityDescription || item.ActivityDescription || item.description || item.Description || 'Actividad';
            const minutes = Number(item.estimatedMinutes ?? item.EstimatedMinutes ?? 0);
            return (
              <div key={`${description}-${index}`} style={styles.activityItem}>
                <p style={styles.activityTitle}>{description}</p>
                <p style={styles.activityMeta}>{minutes > 0 ? `${minutes} min estimados` : 'Tiempo por confirmar'}</p>
              </div>
            );
          }) : (
            <p style={styles.emptyText}>Sin actividades detalladas.</p>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Fecha y hora</h2>
          <InfoItem label="Fecha" value={formatPublicDate(getDateValue(record))} />
          <InfoItem label="Hora" value={formatPublicHour(getHourValue(record))} />
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Cocinera asignada</h2>
          <div style={styles.chefRow}>
            <div style={styles.chefAvatar}>{chef.initials}</div>
            <div>
              <p style={styles.chefName}>{chef.name}</p>
              <p style={styles.chefLastName}>{chef.lastName}</p>
            </div>
          </div>
        </section>

        {isAuthenticated && clientComment ? (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Comentarios del cliente</h2>
            <p style={styles.commentText}>{clientComment}</p>
          </section>
        ) : null}

        {canAcceptAsChef && (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Acciones de cocinera</h2>
            <div style={styles.actionButtonsContainer}>
              <button type="button" style={styles.acceptButton} onClick={handleAccept} disabled={submittingAssignment}>
                <span style={styles.acceptButtonText}>{submittingAssignment ? 'Aceptando...' : 'Aceptar solicitud'}</span>
              </button>
              <button type="button" style={styles.rejectButton} onClick={() => setRejectModalVisible(true)} disabled={submittingAssignment}>
                <span style={styles.rejectButtonText}>Rechazar</span>
              </button>
            </div>
          </section>
        )}

        {!isAuthenticated && (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>¿Tienes algún comentario?</h2>
            <textarea
              style={styles.textarea}
              placeholder="Escríbelo aquí..."
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
            <button type="button" style={styles.primaryButton} onClick={handleSendComments} disabled={submittingComment}>
              {submittingComment ? 'Enviando...' : 'Enviar comentarios'}
            </button>
          </section>
        )}

        <div style={styles.footer}>
          <a href={SUPPORT_CONTACT_URL} style={styles.helpLink} target="_blank" rel="noopener noreferrer">
            <button type="button" style={styles.helpButton}>
              <HelpDetail />
              <span style={styles.helpButtonText}>Necesito Ayuda</span>
            </button>
          </a>
        </div>
      </div>

      {acceptModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Solicitud aceptada</h3>
            <p style={styles.modalDescription}>La solicitud fue aceptada correctamente.</p>
            <button type="button" style={styles.primaryButton} onClick={() => setAcceptModalVisible(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {rejectModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Rechazar solicitud</h3>
            <textarea
              style={styles.modalTextarea}
              placeholder="Motivo de rechazo"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
            />
            <button type="button" style={styles.modalButtonDanger} onClick={handleReject} disabled={submittingAssignment || !rejectionReason.trim()}>
              {submittingAssignment ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
            <button type="button" style={styles.secondaryButton} onClick={() => setRejectModalVisible(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div style={styles.infoItem}>
    <p style={styles.infoLabel}>{label}</p>
    <p style={styles.infoValue}>{value}</p>
  </div>
);

// Estilos copiados 1:1 de reservationTareaDetail.jsx (diseño canónico de tarea).
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', gap: 12, paddingTop: spacing.medium,
    paddingLeft: spacing.medium, paddingRight: spacing.medium, paddingBottom: spacing.small,
    backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
  },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1B2736', flex: 1 },
  publicBadge: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  content: { flex: 1, overflow: 'auto', padding: spacing.medium },
  subtitle: { margin: '0 0 16px', color: '#6b7a90' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: spacing.medium, marginBottom: spacing.medium,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
  },
  cardTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1B2736' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  infoItem: { marginBottom: 8 },
  infoLabel: { margin: '0 0 4px', fontSize: 12, color: '#6B7280' },
  infoValue: { margin: 0, fontSize: 14, fontWeight: 600, color: '#1B2736' },
  needsText: { margin: 0, fontSize: 14, color: '#1a2332', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  quoteBox: {
    backgroundColor: '#f4f8fd', border: '1px solid #e0ebf6', borderRadius: 12, padding: 16, marginBottom: 12,
  },
  quoteLabel: { margin: '0 0 4px', fontSize: 12, color: '#6b7a90' },
  quoteValue: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a2332' },
  activityItem: { padding: '12px 0', borderBottom: '1px solid #eef2f6' },
  activityTitle: { margin: 0, fontSize: 14, fontWeight: 600, color: '#1a2332' },
  activityMeta: { margin: '4px 0 0', fontSize: 12, color: '#6b7a90' },
  emptyText: { margin: 0, textAlign: 'center', color: '#6b7a90', padding: '12px 0' },
  chefRow: { display: 'flex', alignItems: 'center', gap: 16 },
  chefAvatar: {
    width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #FF5136 0%, #ff8e53 100%)',
    color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
  },
  chefName: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1B2736' },
  chefLastName: { margin: '4px 0 0', fontSize: 13, color: '#6B7280' },
  commentText: { margin: 0, fontSize: 14, color: '#324154', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  loadingContainer: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  spinner: { width: 40, height: 40, border: '4px solid #DDE6EE', borderTop: '4px solid #FF4336', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  errorText: { textAlign: 'center', color: '#EF4444', fontSize: 16 },
  actionButtonsContainer: { display: 'flex', gap: spacing.small },
  acceptButton: { flex: 1, backgroundColor: '#2EBE60', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer' },
  acceptButtonText: { fontSize: 16, fontWeight: 600, color: '#FFFFFF' },
  rejectButton: { flex: 1, backgroundColor: '#FF51361A', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer' },
  rejectButtonText: { fontSize: 16, fontWeight: 600, color: '#FF5136' },
  textarea: {
    width: '100%', minHeight: 110, padding: spacing.small, borderRadius: 8, border: '1px solid #E5E7EB',
    fontSize: 14, marginBottom: spacing.small, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  primaryButton: {
    width: '100%', padding: 14, backgroundColor: '#FF5136', color: '#FFFFFF', border: 'none',
    borderRadius: 30, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%', padding: 12, background: 'transparent', border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 500, color: '#6B7280',
  },
  footer: { display: 'flex', justifyContent: 'center', marginTop: spacing.large, marginBottom: spacing.large },
  helpLink: { textDecoration: 'none' },
  helpButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: `${spacing.small}px ${spacing.medium}px`,
    borderRadius: 20, backgroundColor: '#FCE9E8', border: 'none', cursor: 'pointer',
  },
  helpButtonText: { fontSize: 14, fontWeight: 600, color: '#FF4336' },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: spacing.medium,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: spacing.large, maxWidth: 400, width: '100%' },
  modalTitle: { margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#1A1F24', textAlign: 'center' },
  modalDescription: { margin: '0 0 16px', textAlign: 'center', color: '#6B7280' },
  modalTextarea: {
    width: '100%', padding: spacing.small, borderRadius: 8, border: '1px solid #E5E7EB',
    fontSize: 14, marginBottom: spacing.medium, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  modalButtonDanger: {
    width: '100%', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer',
    backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: 16, fontWeight: 600, marginBottom: spacing.small,
  },
};

// Inyectar animación del loader
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
