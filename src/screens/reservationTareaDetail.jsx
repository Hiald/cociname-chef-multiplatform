import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail } from '../assets/svgs';
import { useAuth } from '../hooks/useAuth';
import {
  formatPublicDate,
  formatPublicHour,
  getChefDisplay,
  getChefPaymentBreakdown,
  getCustomerFullName,
  getClientComment,
  getDistrictName,
} from '../utils/formatters';
import { RequestDetailShell } from '../components/request-detail/RequestDetailShell';
import {
  buildTareaScheduleRows,
  getDistrictLabel,
  getRequestAllergies,
  getRequestCustomerName,
  getRequestServiceAmount,
  getRequestServiceTitle,
  mapActivitiesToDishes,
} from '../utils/requestDetail';
import {
  CARD_SHADOW,
  DetalleContainer,
  DetalleContent,
  DetalleHeader,
  StatusBadge,
  CustomerHeader,
  InfoCard,
  Seccion,
  UbicacionContenido,
  BloqueMonto,
  ComentariosCliente,
  HelpSection,
  LoadingScreen,
} from '../components/detalle-reserva/DetalleReservaKit';
import mapIcon from '../assets/images/detalle/map.png';
import menuIcon from '../assets/images/detalle/menu.png';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import listIcon from '../assets/images/detalle/lista.png';
import chefIcon from '../assets/images/detalle/chef.png';
import gainIcon from '../assets/images/detalle/ganancia.png';

/**
 * Detalle de reserva de tarea de servicio para cocinera
 * Route: /reservation-tarea/:id
 *
 * Usa DetalleReservaKit, igual que la reserva independiente y la ficha pública
 * de tarea. Antes tenía su propio maquetado de tarjetas: se veía distinto, no
 * ofrecía "Cómo llegar" y no mostraba la ganancia de la cocinera.
 */

function getServiceModalityLabel(value) {
  return Number(value) === 1 ? 'Cocinera a domicilio' : 'Comida ya preparada';
}

function getTareaActivities(data) {
  const activities = data.activities ?? data.Activities;
  return Array.isArray(activities) ? activities : [];
}

// Badge de estado. StatusReservation de la tarea sigue la misma escala que el
// resto: 3 Activo, 4 Completado, 5 Cancelado.
function getTareaStatusInfo(status) {
  switch (Number(status)) {
    case 3:
      return { text: 'EN CURSO', color: '#2EBE60', bgColor: '#2EBE601A' };
    case 4:
      return { text: 'COMPLETADO', color: '#6B7280', bgColor: '#E5E7EB' };
    case 5:
      return { text: 'CANCELADO', color: '#FF5136', bgColor: '#FF51361A' };
    default:
      return { text: 'PROXIMA', color: '#1763C9', bgColor: '#EAF4FB' };
  }
}

const ReservationTareaDetailScreen = () => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chefData } = useAuth();
  const recordFromState = location.state?.reservationData || null;
  const isRequest = location.state?.isRequest || false;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getReservationServiceTaskById(parseInt(id, 10));
        const recordData = response.success && response.data
          ? response.data
          : recordFromState;

        if (isMounted && recordData) {
          setRecord(recordData);
        }
      } catch (error) {
        console.error('Error loading tarea detail:', error);
        if (isMounted && recordFromState) {
          setRecord(recordFromState);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [id, recordFromState]);

  const handleGoBack = () => navigate(-1);

  const getDateValue = (data) => data.dateService || data.DateService || data.dateReservationServiceTask || data.dateReservation;
  const getHourValue = (data) => data.hourService || data.HourService || data.hourReservationServiceTask || data.hourReservation;

  const handleAcceptReservation = async () => {
    const recordId = record?.id ?? record?.Id;
    if (!chefData?.chefId || !recordId) {
      alert('Error: Datos incompletos');
      return;
    }

    try {
      setSubmitting(true);
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
        alert(`Error al aceptar: ${response.errorMessage || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error accepting tarea:', error);
      alert('Error al aceptar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAcceptModal = () => {
    setAcceptModalVisible(false);
    navigate('/reservation', { state: { defaultTab: 'confirmed' } });
  };

  const handleRejectReservation = async () => {
    const recordId = record?.id ?? record?.Id;
    if (!chefData?.chefId || !recordId || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.updateReservationServiceTaskAssignment(chefData.chefId, {
        reservationServiceTaskId: recordId,
        chefId: chefData.chefId,
        assignmentStatus: 2,
        rejectionReason: rejectionReason.trim(),
        status: false,
      });

      if (response.success) {
        setRejectionReason('');
        setRejectModalVisible(false);
        navigate('/reservation', { state: { defaultTab: 'requests' } });
      } else {
        alert(`Error al rechazar: ${response.errorMessage || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error rejecting tarea:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!record) {
    return (
      <DetalleContainer>
        <DetalleHeader>
          <button style={styles.backButton} onClick={handleGoBack} type="button">
            <ArrowLeftDetail />
          </button>
        </DetalleHeader>
        <DetalleContent>
          <p style={styles.errorText}>No se pudo cargar el detalle</p>
        </DetalleContent>
      </DetalleContainer>
    );
  }

  const customerName = getCustomerFullName(record);
  const chef = getChefDisplay(record);
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const activities = getTareaActivities(record);
  const hours = Number(record.estimatedHours ?? record.EstimatedHours ?? record.iaSuggestedHours ?? record.IaSuggestedHours ?? 0);
  const clientComment = getClientComment(record);
  const needsDescription = record.needsDescription || record.NeedsDescription || '';
  const tareaComment = [needsDescription, clientComment].filter(Boolean).join('\n\n');

  if (isRequest) {
    return (
      <>
        <RequestDetailShell
          onBack={() => navigate('/reservation?tab=requests')}
          serviceTitle={getRequestServiceTitle('tarea')}
          clientName={getRequestCustomerName(record)}
          scheduleRows={buildTareaScheduleRows(record, getDateValue, getHourValue, hours)}
          allergies={getRequestAllergies(record)}
          district={getDistrictLabel(record) || direction}
          reference={reference || direction}
          dishes={mapActivitiesToDishes(activities)}
          dishesSectionTitle="Actividades solicitadas"
          serviceAmount={getRequestServiceAmount({ ...record, tipo: 'tarea' })}
          clientComment={tareaComment}
          onAccept={handleAcceptReservation}
          onReject={() => setRejectModalVisible(true)}
          submitting={submitting}
        />

        {acceptModalVisible && (
          <div style={styles.modalOverlay} onClick={() => !submitting && handleCloseAcceptModal()}>
            <div style={styles.modalContent} onClick={(event) => event.stopPropagation()}>
              <h3 style={styles.modalTitle}>¿Actividad aceptada?</h3>
              <p style={styles.modalDescription}>Lo verás en tus reservas confirmadas.</p>
              <button type="button" style={styles.modalButtonPrimary} onClick={handleCloseAcceptModal}>
                Ver reservas
              </button>
            </div>
          </div>
        )}

        {rejectModalVisible && (
          <div style={styles.modalOverlay} onClick={() => !submitting && setRejectModalVisible(false)}>
            <div style={styles.modalContent} onClick={(event) => event.stopPropagation()}>
              <h3 style={styles.modalTitle}>Actividad rechazada</h3>
              <textarea
                style={styles.modalTextarea}
                placeholder="Motivo de rechazo"
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                disabled={submitting}
                rows={4}
              />
              <button
                type="button"
                style={styles.modalButtonDanger}
                onClick={handleRejectReservation}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? 'Procesando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const statusInfo = getTareaStatusInfo(record.statusReservation ?? record.StatusReservation);
  const personas = record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount ?? '-';

  // OJO: en ReservationServiceTask el campo está bien escrito (PurchaseIngredients),
  // a diferencia de Reservation y Evento que arrastran el typo PuchaseIngredients.
  const conCompras = Boolean(record.purchaseIngredients ?? record.PurchaseIngredients);

  const latitude = record.latitude ?? record.Latitude;
  const longitude = record.longitude ?? record.Longitude;
  const tieneCoordenadas = Boolean(latitude && longitude && latitude !== '-' && longitude !== '-' && Number(latitude) !== 0);

  const handleOpenMaps = () => {
    if (tieneCoordenadas) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');
    }
  };

  // El total es la SUMA de los conceptos, no el campo suelto de comisión.
  // Ver getChefPaymentBreakdown en utils/formatters.
  const { conceptos, totalTexto } = getChefPaymentBreakdown(record);

  return (
    <DetalleContainer>
      <DetalleHeader>
        <button style={styles.backButton} onClick={handleGoBack} type="button">
          <ArrowLeftDetail />
        </button>
        <StatusBadge text={statusInfo.text} color={statusInfo.color} bgColor={statusInfo.bgColor} />
      </DetalleHeader>

      <DetalleContent>
        <CustomerHeader nombre={customerName || 'Cliente'} />

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
          <div style={styles.card}>
            <p style={styles.textoLibre}>{needsDescription || '-'}</p>
          </div>
        </Seccion>

        {/* Las actividades hacen aquí el papel que en una reserva hacen los platos. */}
        <Seccion icon={hourIcon} titulo="Actividades y tiempo estimado">
          <div style={styles.card}>
            <div style={styles.horasBox}>
              <span style={styles.horasLabel}>Horas estimadas</span>
              <span style={styles.horasValor}>{hours > 0 ? `${hours} h` : 'Por confirmar'}</span>
            </div>

            {activities.length > 0 ? activities.map((item, index) => {
              const description = item.activityDescription || item.ActivityDescription || item.description || item.Description || 'Actividad';
              const minutes = Number(item.estimatedMinutes ?? item.EstimatedMinutes ?? 0);
              return (
                <div key={`${description}-${index}`} style={styles.actividad}>
                  <p style={styles.actividadTitulo}>{description}</p>
                  <p style={styles.actividadMeta}>{minutes > 0 ? `${minutes} min estimados` : 'Tiempo por confirmar'}</p>
                </div>
              );
            }) : (
              <p style={styles.vacio}>Sin actividades detalladas.</p>
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
          <div style={styles.card}>
            <div style={styles.chefRow}>
              <div style={styles.chefAvatar}>{chef.initials}</div>
              <div>
                <p style={styles.chefNombre}>{chef.name}</p>
                <p style={styles.chefApellido}>{chef.lastName}</p>
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion icon={gainIcon} titulo="Detalle del servicio">
          <BloqueMonto conceptos={conceptos} totalValor={totalTexto} />
        </Seccion>

        <HelpSection />
      </DetalleContent>
    </DetalleContainer>
  );
};

// Solo quedan los estilos que el kit no cubre: botón "Volver", texto de error,
// las tarjetas propias de tarea (actividades, cocinera) y los modales de la
// vista de solicitud.
const styles = {
  backButton: {
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  errorText: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    margin: 0,
  },
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
  modalTitle: { margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1A1F24' },
  modalDescription: { margin: '0 0 16px', fontSize: '14px', color: '#6B7280' },
  modalTextarea: {
    width: '100%', minHeight: '96px', padding: '12px', borderRadius: '12px',
    border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit',
    resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px',
  },
  modalButtonPrimary: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    backgroundColor: '#1763C9', color: '#FFFFFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
  modalButtonDanger: {
    width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
    backgroundColor: '#FF5136', color: '#FFFFFF', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
  },
};

export default ReservationTareaDetailScreen;
