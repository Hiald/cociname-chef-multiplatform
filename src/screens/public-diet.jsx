import React, { useEffect, useState } from 'react';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { StatusReservation } from '../types';
import { PUBLIC_LINK_TYPES, resolvePublicLinkToken } from '../utils/linkToken';
import {
  formatPublicDate,
  formatPublicHour,
  getCustomerFullName,
  getClientComment,
} from '../utils/formatters';
import {
  DetalleContainer,
  DetalleContent,
  DetalleHeader,
  StatusBadge,
  CustomerHeader,
  InfoCard,
  Seccion,
  UbicacionContenido,
  ComentariosCliente,
  HelpSection,
  LoadingScreen,
  ErrorScreen,
  CARD_SHADOW,
} from '../components/detalle-reserva/DetalleReservaKit';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import listIcon from '../assets/images/detalle/lista.png';
import menuIcon from '../assets/images/detalle/menu.png';
import chefIcon from '../assets/images/detalle/chef.png';
import mapIcon from '../assets/images/detalle/map.png';

/**
 * Vista pública de dieta nutricional - accesible sin login mediante token
 * URL: /dieta/:token
 * Mismo diseño que el detalle asignado (reservationDietDetail.jsx) vía DetalleReservaKit.
 */

const pendingStatuses = new Set([
  StatusReservation.Creada,
  StatusReservation.Reprogramada,
  StatusReservation.ReasignacionCocinera,
]);

function getDietModalityShortLabel(value) {
  return Number(value) === 2 ? 'Plan nutricional' : 'Comida dietética';
}

function getServicePreferenceLabel(value) {
  return Number(value) === 1 ? 'Cocinera a domicilio' : 'Comida ya preparada';
}

function getDietMenus(data) {
  const menus = data.dietMenus ?? data.DietMenus;
  return Array.isArray(menus) ? menus : [];
}

export const PublicDietScreen = ({ token }) => {
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
        const { reservationId } = await resolvePublicLinkToken(token, PUBLIC_LINK_TYPES.DIET);
        const response = await apiService.publicGetReservationDietByLink(reservationId);

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
  const statusValue = record?.statusReservationDiet ?? record?.statusReservation ?? record?.StatusReservation;
  const canAcceptAsChef = isAuthenticated
    && chefData?.chefId
    && (record?.chefId === null || record?.ChefId === null)
    && pendingStatuses.has(Number(statusValue));

  const getDateValue = (data) => data.startDate || data.StartDate || data.dateReservationDiet || data.dateReservation;
  const getHourValue = (data) => data.deliveryHour || data.DeliveryHour || data.hourReservationDiet || data.hourReservation;

  const handleSendComments = async () => {
    if (!recordId || !comments.trim()) {
      alert('El comentario no puede estar vacío');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await apiService.updateReservationDietClientCommentary(recordId, comments.trim());
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
      const response = await apiService.updateReservationDietAssignment(chefData.chefId, {
        reservationDietId: recordId,
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
      console.error('Error accepting diet:', acceptError);
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
      const response = await apiService.updateReservationDietAssignment(chefData.chefId, {
        reservationDietId: recordId,
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
      console.error('Error rejecting diet:', rejectError);
      alert('Error al rechazar la solicitud');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !record) {
    return <ErrorScreen mensaje={error || 'Enlace inválido o expirado'} />;
  }

  const customerName = getCustomerFullName(record);
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const modality = Number(record.dietModality ?? record.DietModality ?? 1);
  const planUrl = record.nutritionalPlanUrl || record.NutritionalPlanUrl || '';
  const planName = record.nutritionalPlanFileName || record.NutritionalPlanFileName || 'Plan nutricional';
  const menus = getDietMenus(record);
  const clientComment = getClientComment(record);
  const peopleCount = record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount;
  const peopleLabel = peopleCount != null
    ? `${peopleCount} ${Number(peopleCount) === 1 ? 'persona' : 'personas'}`
    : null;
  const purchasesLabel = record.puchaseIngredients ? 'Con compras' : 'Sin compras';

  return (
    <DetalleContainer>
      <DetalleHeader>
        <span style={styles.headerTitle}>Detalle de dieta nutricional</span>
        <StatusBadge text="VISTA PÚBLICA" bgColor="#FFF0E6" color="#FF5136" />
      </DetalleHeader>

      <DetalleContent>
        <CustomerHeader nombre={customerName || 'Cliente'} subtitulo={`Dieta #${recordId}`} />

        <InfoCard
          rows={[
            { icon: dayIcon, label: formatPublicDate(getDateValue(record)) },
            { icon: hourIcon, label: formatPublicHour(getHourValue(record)) },
            { icon: listIcon, label: purchasesLabel },
            peopleLabel ? { icon: menuIcon, label: peopleLabel } : null,
            { icon: listIcon, label: `Modalidad: ${getDietModalityShortLabel(record.dietModality ?? record.DietModality)}` },
            { icon: chefIcon, label: `Servicio: ${getServicePreferenceLabel(record.servicePreference ?? record.ServicePreference)}` },
          ].filter(Boolean)}
        />

        <ComentariosCliente texto={isAuthenticated ? clientComment : null} />

        <Seccion icon={mapIcon} titulo="Ubicación">
          <UbicacionContenido direccion={direction} referencia={reference} />
        </Seccion>

        <Seccion icon={chefIcon} titulo="Tu plan">
          {modality === 2 && planUrl ? (
            <a href={planUrl} target="_blank" rel="noopener noreferrer" style={styles.planLink}>{planName}</a>
          ) : menus.length > 0 ? (
            menus.map((item, index) => {
              const name = item.menuName || item.MenuName || item.menuNombre || item.MenuNombre
                || `Plato ${item.menuId || item.MenuId || index + 1}`;
              const portions = item.portions ?? item.Portions ?? peopleCount ?? 1;
              return (
                <div key={`${name}-${index}`} style={styles.dishCard}>
                  <p style={styles.dishName}>{name}</p>
                  <div style={styles.dishFooter}>
                    <span style={styles.portionsText}>{portions} porciones</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={styles.emptyText}>Plan en revisión por nuestro equipo.</p>
          )}
        </Seccion>

        {canAcceptAsChef && (
          <Seccion icon={chefIcon} titulo="Acciones de cocinera">
            <div style={styles.actionRow}>
              <button type="button" style={styles.acceptButton} onClick={handleAccept} disabled={submittingAssignment}>
                {submittingAssignment ? 'Aceptando...' : 'Aceptar solicitud'}
              </button>
              <button type="button" style={styles.rejectButton} onClick={() => setRejectModalVisible(true)} disabled={submittingAssignment}>
                Rechazar
              </button>
            </div>
          </Seccion>
        )}

        {!isAuthenticated && (
          <Seccion icon={listIcon} titulo="¿Tienes algún comentario?">
            <textarea
              style={styles.textarea}
              placeholder="Escríbelo aquí..."
              value={comments}
              onChange={(event) => setComments(event.target.value)}
            />
            <button type="button" style={styles.primaryButton} onClick={handleSendComments} disabled={submittingComment}>
              {submittingComment ? 'Enviando...' : 'Enviar comentarios'}
            </button>
          </Seccion>
        )}

        <HelpSection />
      </DetalleContent>

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
    </DetalleContainer>
  );
};

// Solo estilos propios de esta pantalla — la estructura visual viene del kit.
const styles = {
  headerTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1A1F24',
  },
  dishCard: {
    backgroundColor: '#EAF4FB',
    borderRadius: '18px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
    marginBottom: `${spacing.medium}px`,
  },
  dishName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  dishFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionsText: {
    fontSize: '13px',
    color: '#6B7280',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: `${spacing.medium}px 0`,
  },
  planLink: {
    fontSize: '14px',
    color: '#3B82F6',
    fontWeight: 600,
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  actionRow: {
    display: 'flex',
    gap: `${spacing.small}px`,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2EBE60',
    padding: '16px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF51361A',
    padding: '16px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    color: '#FF5136',
  },
  textarea: {
    width: '100%',
    minHeight: '110px',
    padding: `${spacing.small}px`,
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: `${spacing.small}px`,
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  primaryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF5136',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '30px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: `${spacing.medium}px`,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.large}px`,
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: `${spacing.small}px`,
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: `${spacing.medium}px`,
    lineHeight: '20px',
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
