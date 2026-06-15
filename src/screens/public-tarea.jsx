import React, { useEffect, useState } from 'react';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { StatusReservation } from '../types';
import { PUBLIC_LINK_TYPES, resolvePublicLinkToken } from '../utils/linkToken';
import {
  formatCurrency,
  formatPublicDate,
  formatPublicHour,
  getChefDisplay,
  getCustomerFullName,
} from '../utils/formatters';

/**
 * Vista pública de tarea de servicio - accesible sin login mediante token
 * URL: /tarea/:token
 */

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
          const existingComments = response.data.commentsClient || response.data.CommentsClient || '';
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
      <div style={styles.page}>
        <div style={styles.loadingBox}>Cargando detalle...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <p style={styles.errorTitle}>No se pudo cargar el detalle</p>
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
  const totalPrice = record.totalPrice ?? record.TotalPrice ?? 0;
  const activities = getTareaActivities(record);
  const hours = Number(record.estimatedHours ?? record.EstimatedHours ?? record.iaSuggestedHours ?? record.IaSuggestedHours ?? 0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>Aderezos, salsas y bases</h1>
        <p style={styles.subtitle}>Servicio #{recordId}</p>

        <div style={styles.grid}>
          <div style={styles.leftColumn}>
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>Información general</h2>
              <div style={styles.infoGrid}>
                <InfoItem label="Nombre" value={customerName || '-'} />
                <InfoItem label="Teléfono" value={phone} />
                <InfoItem label="Ubicación" value={`${direction}${reference ? `, ${reference}` : ''}`} />
                <InfoItem
                  label="Personas"
                  value={`${record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount ?? '-'} personas`}
                />
                <InfoItem label="Servicio" value={getServiceModalityLabel(record.serviceModality ?? record.ServiceModality)} />
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
              <h2 style={styles.cardTitle}>Desglose de costos</h2>
              <div style={styles.costRow}>
                <span>Costo del servicio</span>
                <strong>{formatCurrency(totalPrice)}</strong>
              </div>
              <div style={styles.totalBox}>
                <span>Total</span>
                <strong style={styles.totalValue}>{formatCurrency(totalPrice)}</strong>
              </div>
            </section>

            {canAcceptAsChef && (
              <section style={styles.card}>
                <h2 style={styles.cardTitle}>Acciones de cocinera</h2>
                <div style={styles.actionRow}>
                  <button type="button" style={styles.acceptButton} onClick={handleAccept} disabled={submittingAssignment}>
                    {submittingAssignment ? 'Aceptando...' : 'Aceptar solicitud'}
                  </button>
                  <button type="button" style={styles.rejectButton} onClick={() => setRejectModalVisible(true)} disabled={submittingAssignment}>
                    Rechazar
                  </button>
                </div>
              </section>
            )}

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
          </div>

          <div style={styles.rightColumn}>
            <section style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Fecha y hora</h3>
              <SideItem label="Fecha" value={formatPublicDate(getDateValue(record))} />
              <SideItem label="Hora" value={formatPublicHour(getHourValue(record))} />
            </section>

            <section style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Cocinera asignada</h3>
              <div style={styles.chefRow}>
                <div style={styles.chefAvatar}>{chef.initials}</div>
                <div>
                  <p style={styles.chefName}>{chef.name}</p>
                  <p style={styles.chefLastName}>{chef.lastName}</p>
                </div>
              </div>
              <p style={styles.chefDescription}>
                {chef.assigned
                  ? 'Cocinera profesional asignada a tu servicio.'
                  : 'Tu cocinera será asignada pronto.'}
              </p>
            </section>

            <a
              href="https://wa.me/51963138202?text=Hola!%20Necesito%20ayuda%20con%20mi%20servicio%20de%20Aderezos"
              style={styles.helpLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button type="button" style={styles.helpButton}>Ayuda</button>
            </a>
          </div>
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
              style={styles.textarea}
              placeholder="Motivo de rechazo"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
            />
            <button type="button" style={styles.rejectButton} onClick={handleReject} disabled={submittingAssignment || !rejectionReason.trim()}>
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
  <div>
    <p style={styles.infoLabel}>{label}</p>
    <p style={styles.infoValue}>{value}</p>
  </div>
);

const SideItem = ({ label, value }) => (
  <div style={styles.sideItem}>
    <p style={styles.sideLabel}>{label}</p>
    <p style={styles.sideValue}>{value}</p>
  </div>
);

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#E7F6FD',
    padding: `${spacing.medium}px`,
  },
  container: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  mainTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: '#1a2332',
  },
  subtitle: {
    margin: '8px 0 20px',
    color: '#6b7a90',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 300px',
    gap: 20,
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    border: '1px solid #e8eef5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #e8eef5',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    margin: '0 0 16px',
    fontSize: 16,
    fontWeight: 700,
    color: '#1a2332',
  },
  sideTitle: {
    margin: '0 0 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#6b7a90',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16,
  },
  infoLabel: {
    margin: '0 0 6px',
    fontSize: 12,
    color: '#6b7a90',
  },
  infoValue: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#1a2332',
  },
  costRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f0f4f8',
    color: '#6b7a90',
  },
  totalBox: {
    marginTop: 12,
    backgroundColor: '#f8f9fb',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 24,
    color: '#FF5136',
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    padding: 16,
    border: '2px solid #e8eef5',
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 12,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  primaryButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FF5136',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    marginTop: 8,
    padding: 12,
    backgroundColor: 'transparent',
    color: '#6b7a90',
    border: 'none',
    cursor: 'pointer',
  },
  helpLink: {
    textDecoration: 'none',
  },
  helpButton: {
    width: '100%',
    padding: 14,
    backgroundColor: '#FF51361A',
    color: '#FF5136',
    border: 'none',
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  sideItem: {
    marginBottom: 16,
  },
  sideLabel: {
    margin: '0 0 4px',
    fontSize: 12,
    color: '#6b7a90',
  },
  sideValue: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: '#1a2332',
  },
  chefRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  chefAvatar: {
    width: 70,
    height: 70,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF5136 0%, #ff8e53 100%)',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
  },
  chefName: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1a2332',
  },
  chefLastName: {
    margin: '4px 0 0',
    fontSize: 14,
    color: '#6b7a90',
  },
  chefDescription: {
    margin: 0,
    fontSize: 13,
    color: '#6b7a90',
    lineHeight: 1.6,
  },
  needsText: {
    margin: 0,
    fontSize: 14,
    color: '#1a2332',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  quoteBox: {
    backgroundColor: '#f4f8fd',
    border: '1px solid #e0ebf6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quoteLabel: {
    margin: '0 0 4px',
    fontSize: 12,
    color: '#6b7a90',
  },
  quoteValue: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1a2332',
  },
  activityItem: {
    padding: '12px 0',
    borderBottom: '1px solid #eef2f6',
  },
  activityTitle: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: '#1a2332',
  },
  activityMeta: {
    margin: '4px 0 0',
    fontSize: 12,
    color: '#6b7a90',
  },
  actionRow: {
    display: 'flex',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#2EBE60',
    color: '#FFFFFF',
    fontWeight: 600,
    cursor: 'pointer',
  },
  rejectButton: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    border: 'none',
    backgroundColor: '#FF51361A',
    color: '#FF5136',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingBox: {
    textAlign: 'center',
    padding: 40,
    color: '#6b7a90',
  },
  errorBox: {
    maxWidth: 480,
    margin: '40px auto',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    textAlign: 'center',
  },
  errorTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1a2332',
  },
  errorText: {
    margin: '8px 0 0',
    color: '#6b7a90',
  },
  emptyText: {
    margin: 0,
    textAlign: 'center',
    color: '#6b7a90',
    padding: '12px 0',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
    zIndex: 1000,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.large,
  },
  modalTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 700,
    color: '#1a2332',
    textAlign: 'center',
  },
  modalDescription: {
    margin: '0 0 16px',
    textAlign: 'center',
    color: '#6b7a90',
  },
};

export default PublicTareaScreen;
