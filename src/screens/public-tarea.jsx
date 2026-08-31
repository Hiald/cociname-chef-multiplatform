import React, { useEffect, useState } from 'react';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { StatusReservation } from '../types';
import { PUBLIC_LINK_TYPES, resolvePublicLinkToken } from '../utils/linkToken';
import { getDistrictName, getChefPaymentBreakdown } from '../utils';
import {
  DetalleContainer,
  DetalleContent,
  CustomerHeader,
  InfoCard,
  Seccion,
  UbicacionContenido,
  BloqueMonto,
  ComentariosCliente,
  HelpSection,
  LoadingScreen,
  ErrorScreen,
  CARD_SHADOW,
} from '../components/detalle-reserva/DetalleReservaKit';
import {
  formatPublicDate,
  formatPublicHour,
  getChefDisplay,
  getCustomerFullName,
  getClientComment,
} from '../utils/formatters';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import listIcon from '../assets/images/detalle/lista.png';
import chefIcon from '../assets/images/detalle/chef.png';
import menuIcon from '../assets/images/detalle/menu.png';
import mapIcon from '../assets/images/detalle/map.png';
import gainIcon from '../assets/images/detalle/ganancia.png';

/**
 * Vista pública de tarea de servicio - accesible sin login mediante token.
 * URL: /tarea/:token
 *
 * Usa DetalleReservaKit para verse igual que la reserva independiente, con su
 * blindaje mobile-first (maxWidth, overflowX, boxSizing) que antes faltaba.
 *
 * Diferencias propias del tipo, no del diseño:
 *  · No hay "Platos elegidos": una tarea tiene ACTIVIDADES con minutos, no platos.
 *  · No hay "Lista de compra": esa lista la arma el cliente desde la webapp a
 *    partir de las recetas, y una tarea no tiene recetas. El flag de compras
 *    solo afecta al costo.
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
    return <LoadingScreen />;
  }

  if (error || !record) {
    return <ErrorScreen mensaje={error || 'Enlace inválido o expirado'} />;
  }

  const chef = getChefDisplay(record);
  const customerName = getCustomerFullName(record);
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const activities = getTareaActivities(record);
  const hours = Number(record.estimatedHours ?? record.EstimatedHours ?? record.iaSuggestedHours ?? record.IaSuggestedHours ?? 0);
  const clientComment = getClientComment(record);
  const personas = record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount ?? '-';

  // OJO: en ReservationServiceTask el campo está bien escrito (PurchaseIngredients),
  // a diferencia de Reservation y Evento que arrastran el typo PuchaseIngredients.
  // Leerlo con el typo devolvía undefined y siempre decía "Sin compras".
  const conCompras = Boolean(record.purchaseIngredients ?? record.PurchaseIngredients);

  const latitude = record.latitude ?? record.Latitude;
  const longitude = record.longitude ?? record.Longitude;
  const tieneCoordenadas = Boolean(latitude && longitude && latitude !== '-' && longitude !== '-' && Number(latitude) !== 0);

  const handleOpenMaps = () => {
    if (tieneCoordenadas) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    }
  };

  // El total es la SUMA de los conceptos, no el campo de comisión suelto: la
  // clave cambia de grafía según el DTO y leía undefined -> S/ 0.00.
  // Ver getChefPaymentBreakdown en utils/formatters.
  const { conceptos, totalTexto } = getChefPaymentBreakdown(record);

  return (
    <DetalleContainer>
      <DetalleContent>
        <CustomerHeader
          nombre={customerName || 'Cliente'}
          subtitulo="Vista pública"
        />

        <InfoCard
          rows={[
            { icon: dayIcon, label: formatPublicDate(getDateValue(record)) },
            { icon: hourIcon, label: formatPublicHour(getHourValue(record)) },
            { icon: listIcon, label: conCompras ? 'Con compras' : 'Sin compras' },
            { icon: chefIcon, label: `${personas} personas · ${getServiceModalityLabel(record.serviceModality ?? record.ServiceModality)}` },
          ]}
        />

        <ComentariosCliente texto={clientComment} />

        <Seccion icon={menuIcon} titulo="Qué necesitas">
          <div style={estilos.card}>
            <p style={estilos.textoLibre}>{record.needsDescription || record.NeedsDescription || '-'}</p>
          </div>
        </Seccion>

        {/* Las actividades hacen aquí el papel que en una reserva hacen los platos. */}
        <Seccion icon={hourIcon} titulo="Actividades y tiempo estimado">
          <div style={estilos.card}>
            <div style={estilos.horasBox}>
              <span style={estilos.horasLabel}>Horas estimadas</span>
              <span style={estilos.horasValor}>{hours > 0 ? `${hours} h` : 'Por confirmar'}</span>
            </div>

            {activities.length > 0 ? activities.map((item, index) => {
              const description = item.activityDescription || item.ActivityDescription || item.description || item.Description || 'Actividad';
              const minutes = Number(item.estimatedMinutes ?? item.EstimatedMinutes ?? 0);
              return (
                <div key={`${description}-${index}`} style={estilos.actividad}>
                  <p style={estilos.actividadTitulo}>{description}</p>
                  <p style={estilos.actividadMeta}>{minutes > 0 ? `${minutes} min estimados` : 'Tiempo por confirmar'}</p>
                </div>
              );
            }) : (
              <p style={estilos.vacio}>Sin actividades detalladas.</p>
            )}
          </div>
        </Seccion>

        <Seccion icon={mapIcon} titulo="Ubicación">
          <UbicacionContenido
            direccion={direction}
            distrito={getDistrictName(record.district ?? record.District)}
            referencia={reference}
            onAbrirMaps={tieneCoordenadas ? handleOpenMaps : null}
          />
        </Seccion>

        <Seccion icon={chefIcon} titulo="Cocinera asignada">
          <div style={estilos.card}>
            <div style={estilos.chefRow}>
              <div style={estilos.chefAvatar}>{chef.initials}</div>
              <div>
                <p style={estilos.chefNombre}>{chef.name}</p>
                <p style={estilos.chefApellido}>{chef.lastName}</p>
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion icon={gainIcon} titulo="Detalle del servicio">
          <BloqueMonto conceptos={conceptos} totalValor={totalTexto} />
        </Seccion>

        {canAcceptAsChef && (
          <Seccion icon={chefIcon} titulo="Acciones de cocinera">
            <div style={estilos.card}>
              <div style={estilos.acciones}>
                <button type="button" style={estilos.botonAceptar} onClick={handleAccept} disabled={submittingAssignment}>
                  {submittingAssignment ? 'Aceptando...' : 'Aceptar solicitud'}
                </button>
                <button type="button" style={estilos.botonRechazar} onClick={() => setRejectModalVisible(true)} disabled={submittingAssignment}>
                  Rechazar
                </button>
              </div>
            </div>
          </Seccion>
        )}

        {!isAuthenticated && (
          <Seccion icon={menuIcon} titulo="¿Tienes algún comentario?">
            <div style={estilos.card}>
              <textarea
                style={estilos.textarea}
                placeholder="Escríbelo aquí..."
                value={comments}
                onChange={(event) => setComments(event.target.value)}
              />
              <button type="button" style={estilos.botonPrimario} onClick={handleSendComments} disabled={submittingComment}>
                {submittingComment ? 'Enviando...' : 'Enviar comentarios'}
              </button>
            </div>
          </Seccion>
        )}

        <HelpSection />
      </DetalleContent>

      {acceptModalVisible && (
        <div style={estilos.modalOverlay}>
          <div style={estilos.modalContent}>
            <h3 style={estilos.modalTitulo}>Solicitud aceptada</h3>
            <p style={estilos.modalTexto}>La solicitud fue aceptada correctamente.</p>
            <button type="button" style={estilos.botonPrimario} onClick={() => setAcceptModalVisible(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {rejectModalVisible && (
        <div style={estilos.modalOverlay}>
          <div style={estilos.modalContent}>
            <h3 style={estilos.modalTitulo}>Rechazar solicitud</h3>
            <textarea
              style={estilos.textarea}
              placeholder="Motivo de rechazo"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={4}
            />
            <button type="button" style={estilos.botonRechazar} onClick={handleReject} disabled={submittingAssignment || !rejectionReason.trim()}>
              {submittingAssignment ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
            <button type="button" style={estilos.botonSecundario} onClick={() => setRejectModalVisible(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </DetalleContainer>
  );
};

// Solo lo que el kit no cubre: actividades, ficha de cocinera, acciones y
// modales. Todo lo demás (contenedor, secciones, ubicación, montos) sale del kit
// para que el diseño no se vuelva a separar.
const estilos = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  textoLibre: { margin: 0, fontSize: '15px', color: '#6B7280', lineHeight: 1.5, wordBreak: 'break-word' },
  horasBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid #E5E7EB',
  },
  horasLabel: { fontSize: '14px', color: '#6B7280' },
  horasValor: { fontSize: '16px', fontWeight: 700, color: '#1A1F24' },
  actividad: { padding: '10px 0', borderBottom: '1px solid #E5E7EB' },
  actividadTitulo: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1F24', wordBreak: 'break-word' },
  actividadMeta: { margin: '2px 0 0', fontSize: '12.5px', color: '#6B7280' },
  vacio: { margin: 0, fontSize: '14px', color: '#9CA3AF' },
  chefRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  chefAvatar: {
    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
    backgroundColor: '#EAF4FB', color: '#1763C9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', fontWeight: 700,
  },
  chefNombre: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#1A1F24' },
  chefApellido: { margin: 0, fontSize: '13px', color: '#6B7280' },
  acciones: { display: 'flex', flexDirection: 'column', gap: '10px' },
  botonPrimario: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    backgroundColor: '#FF5136', color: '#FFFFFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
  botonAceptar: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    backgroundColor: '#2EBE60', color: '#FFFFFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
  botonRechazar: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    backgroundColor: '#FF51361A', color: '#FF5136',
    fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
  botonSecundario: {
    width: '100%', padding: '13px', borderRadius: '12px',
    border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
    color: '#6B7280', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '8px',
  },
  textarea: {
    width: '100%', minHeight: '96px', padding: '12px', borderRadius: '12px',
    border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit',
    resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px',
  },
  modalOverlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(26,31,36,.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: `${spacing.medium}px`, zIndex: 1000,
  },
  modalContent: {
    width: '100%', maxWidth: '420px', boxSizing: 'border-box',
    backgroundColor: '#FFFFFF', borderRadius: '20px', padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  modalTitulo: { margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1A1F24' },
  modalTexto: { margin: '0 0 16px', fontSize: '14px', color: '#6B7280' },
};

// Animación del loader del kit.
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
