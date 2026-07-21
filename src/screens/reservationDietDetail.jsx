import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail, HelpDetail } from '../assets/svgs';
import { useAuth } from '../hooks/useAuth';
import {
  formatCurrency,
  formatPublicDate,
  formatPublicHour,
  getChefDisplay,
  getCustomerFullName,
  getClientComment,
} from '../utils/formatters';
import { RequestDetailShell } from '../components/request-detail/RequestDetailShell';
import {
  buildDietScheduleRows,
  getDistrictLabel,
  getReferenceLabel,
  getRequestAllergies,
  getRequestClientComment,
  getRequestCustomerName,
  getRequestServiceAmount,
  getRequestServiceTitle,
  mapDietMenusToDishes,
} from '../utils/requestDetail';

/**
 * Detalle de reserva de plan nutricional para cocinera
 * Route: /reservation-diet/:id
 */

function getDietModalityLabel(value) {
  return Number(value) === 2 ? 'Tengo un plan nutricional' : 'Quiero comida dietética';
}

function getServicePreferenceLabel(value) {
  return Number(value) === 1 ? 'Cocinera a domicilio' : 'Comida ya preparada';
}

function getDietMenus(data) {
  const menus = data.dietMenus ?? data.DietMenus;
  return Array.isArray(menus) ? menus : [];
}

const ReservationDietDetailScreen = () => {
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
        const response = await apiService.getReservationDietById(parseInt(id, 10));
        const recordData = response.success && response.data
          ? response.data
          : recordFromState;

        if (isMounted && recordData) {
          setRecord(recordData);
        }
      } catch (error) {
        console.error('Error loading diet detail:', error);
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

  const getDateValue = (data) => data.startDate || data.StartDate || data.dateReservationDiet || data.dateReservation;
  const getHourValue = (data) => data.deliveryHour || data.DeliveryHour || data.hourReservationDiet || data.hourReservation;

  const handleAcceptReservation = async () => {
    const recordId = record?.id ?? record?.Id;
    if (!chefData?.chefId || !recordId) {
      alert('Error: Datos incompletos');
      return;
    }

    try {
      setSubmitting(true);
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
        alert(`Error al aceptar: ${response.errorMessage || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error accepting diet:', error);
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
      const response = await apiService.updateReservationDietAssignment(chefData.chefId, {
        reservationDietId: recordId,
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
      console.error('Error rejecting diet:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!record) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={handleGoBack} type="button">
            <ArrowLeftDetail />
          </button>
        </div>
        <div style={styles.content}>
          <p style={styles.errorText}>No se pudo cargar el detalle</p>
        </div>
      </div>
    );
  }

  const recordId = record.id ?? record.Id;
  const customerName = getCustomerFullName(record);
  const chef = getChefDisplay(record);
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const totalPrice = record.totalPrice ?? record.TotalPrice ?? 0;
  const modality = Number(record.dietModality ?? record.DietModality ?? 1);
  const planUrl = record.nutritionalPlanUrl || record.NutritionalPlanUrl || '';
  const planName = record.nutritionalPlanFileName || record.NutritionalPlanFileName || 'Plan nutricional';
  const menus = getDietMenus(record);
  const clientComment = getClientComment(record);

  if (isRequest) {
    return (
      <>
        <RequestDetailShell
          onBack={() => navigate('/reservation?tab=requests')}
          serviceTitle={getRequestServiceTitle('dieta')}
          clientName={getRequestCustomerName(record)}
          scheduleRows={buildDietScheduleRows(record, getDateValue, getHourValue)}
          allergies={getRequestAllergies(record)}
          district={getDistrictLabel(record) || direction}
          reference={reference || direction}
          dishes={mapDietMenusToDishes(menus, record)}
          serviceAmount={getRequestServiceAmount({ ...record, tipo: 'dieta' })}
          clientComment={getRequestClientComment(record)}
          onAccept={handleAcceptReservation}
          onReject={() => setRejectModalVisible(true)}
          submitting={submitting}
        />

        {acceptModalVisible && (
          <div style={styles.modalOverlay} onClick={() => !submitting && handleCloseAcceptModal()}>
            <div style={styles.modalContent} onClick={(event) => event.stopPropagation()}>
              <h3 style={styles.modalTitle}>¿Plan nutricional aceptado?</h3>
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
              <h3 style={styles.modalTitle}>Plan nutricional rechazado</h3>
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleGoBack} type="button">
          <ArrowLeftDetail />
        </button>
        <h1 style={styles.title}>Detalle del Plan Nutricional</h1>
      </div>

      <div style={styles.content}>
        <p style={styles.subtitle}>#{recordId}</p>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Información general</h2>
          <div style={styles.infoGrid}>
            <InfoItem label="Cliente" value={customerName || 'No especificado'} />
            <InfoItem label="Ubicación" value={`${direction}${reference ? `, ${reference}` : ''}`} />
            <InfoItem
              label="Personas"
              value={`${record.diner ?? record.Diner ?? record.personCount ?? record.PersonCount ?? '-'} personas`}
            />
            <InfoItem label="Modalidad" value={getDietModalityLabel(record.dietModality ?? record.DietModality)} />
            <InfoItem label="Servicio" value={getServicePreferenceLabel(record.servicePreference ?? record.ServicePreference)} />
            <InfoItem label="Compras" value={record.puchaseIngredients ? 'Con compras' : 'Sin compras'} />
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Tu plan</h2>
          {modality === 2 && planUrl ? (
            <a href={planUrl} target="_blank" rel="noopener noreferrer" style={styles.planLink}>{planName}</a>
          ) : menus.length > 0 ? (
            menus.map((item, index) => {
              const name = item.menuName || item.MenuName || item.menuNombre || item.MenuNombre || `Plato ${item.menuId || item.MenuId || index + 1}`;
              const portions = item.portions ?? item.Portions ?? record.diner ?? record.Diner ?? 1;
              return (
                <div key={`${name}-${index}`} style={styles.menuItem}>
                  <span style={styles.menuName}>{name}</span>
                  <span style={styles.menuPortions}>{portions}</span>
                </div>
              );
            })
          ) : (
            <p style={styles.emptyText}>Plan en revisión por nuestro equipo.</p>
          )}
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Fecha y hora</h2>
          <InfoItem label="Fecha" value={formatPublicDate(getDateValue(record))} />
          <InfoItem label="Hora" value={formatPublicHour(getHourValue(record))} />
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

        {clientComment ? (
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>Comentarios del cliente</h2>
            <p style={styles.commentText}>{clientComment}</p>
          </section>
        ) : null}

        {isRequest && (
          <div style={styles.actionButtonsContainer}>
            <button type="button" style={styles.acceptButton} onClick={handleAcceptReservation} disabled={submitting}>
              <span style={styles.acceptButtonText}>{submitting ? 'Aceptando...' : 'Aceptar'}</span>
            </button>
            <button type="button" style={styles.rejectButton} onClick={() => setRejectModalVisible(true)} disabled={submitting}>
              <span style={styles.rejectButtonText}>Rechazar</span>
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <a href="https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta" style={styles.helpLink}>
            <button type="button" style={styles.helpButton}>
              <HelpDetail />
              <span style={styles.helpButtonText}>Necesito Ayuda</span>
            </button>
          </a>
        </div>
      </div>

      {acceptModalVisible && (
        <div style={styles.modalOverlay} onClick={() => !submitting && handleCloseAcceptModal()}>
          <div style={styles.modalContent} onClick={(event) => event.stopPropagation()}>
            <h3 style={styles.modalTitle}>¿Plan nutricional aceptado?</h3>
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
            <h3 style={styles.modalTitle}>Plan nutricional rechazado</h3>
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
              {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
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

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column' },
  header: {
    display: 'flex', alignItems: 'center', gap: 12, paddingTop: spacing.medium,
    paddingLeft: spacing.medium, paddingRight: spacing.medium, paddingBottom: spacing.small,
    backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB',
  },
  backButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' },
  title: { margin: 0, fontSize: 20, fontWeight: 800, color: '#1B2736', flex: 1 },
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
  planLink: { color: '#1391E2', fontWeight: 600, textDecoration: 'none' },
  menuItem: {
    display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px solid #eef2f6',
  },
  menuName: { fontSize: 15, fontWeight: 700, color: '#1a2332' },
  menuPortions: {
    border: '1px solid #e8eef5', borderRadius: 999, padding: '4px 12px', fontWeight: 700, color: '#1C2837',
  },
  emptyText: { margin: 0, textAlign: 'center', color: '#6b7a90', padding: '12px 0' },
  costRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f4f8', color: '#6b7a90' },
  totalBox: { marginTop: 12, backgroundColor: '#f8f9fb', borderRadius: 8, padding: 16, display: 'flex', justifyContent: 'space-between' },
  totalValue: { fontSize: 22, color: '#FF5136' },
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
  actionButtonsContainer: { display: 'flex', gap: spacing.small, marginBottom: spacing.medium },
  acceptButton: { flex: 1, backgroundColor: '#2EBE60', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer' },
  acceptButtonText: { fontSize: 16, fontWeight: 600, color: '#FFFFFF' },
  rejectButton: { flex: 1, backgroundColor: '#FF51361A', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer' },
  rejectButtonText: { fontSize: 16, fontWeight: 600, color: '#FF5136' },
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
  modalButtonPrimary: {
    width: '100%', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer',
    backgroundColor: '#FF5136', color: '#FFFFFF', fontWeight: 600,
  },
  modalButtonDanger: {
    width: '100%', padding: 16, borderRadius: 30, border: 'none', cursor: 'pointer',
    backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600,
  },
};

export default ReservationDietDetailScreen;
