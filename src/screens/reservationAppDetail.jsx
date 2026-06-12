import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail, HelpDetail } from '../assets/svgs';
import { formatearFechaConDia } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';
import mapIcon from '../assets/images/detalle/map.png';
import profileIcon from '../assets/images/detalle/perfil.png';
import dayIcon from '../assets/images/detalle/dia.png';
import listIcon from '../assets/images/reservas/list.png';

const normalizeRecord = (record, type) => {
  if (!record) return null;

  if (type === 'dieta') {
    return {
      ...record,
      dateReservation: record.dateReservationDiet ?? record.dateReservation,
      hourReservation: record.hourReservationDiet ?? record.hourReservation,
    };
  }

  return {
    ...record,
    dateReservation: record.dateReservationServiceTask ?? record.dateReservation,
    hourReservation: record.hourReservationServiceTask ?? record.hourReservation,
  };
};

const AppAssignmentDetailScreen = ({
  type,
  title,
  acceptedTitle,
  acceptedDescription,
  rejectedTitle,
  idField,
  loadById,
  updateAssignment,
}) => {
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
        const response = await loadById(parseInt(id, 10));
        const recordData = response.success && response.data
          ? normalizeRecord(response.data, type)
          : normalizeRecord(recordFromState, type);

        if (isMounted && recordData) {
          setRecord(recordData);
        }
      } catch (error) {
        console.error(`Error loading ${type} detail:`, error);
        if (isMounted && recordFromState) {
          setRecord(normalizeRecord(recordFromState, type));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [id, loadById, recordFromState, type]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const buildAssignmentPayload = (assignmentStatus, rejectionReasonValue = '') => ({
    [idField]: record.id,
    chefId: chefData?.chefId,
    assignmentStatus,
    rejectionReason: rejectionReasonValue,
    status: assignmentStatus === 1,
  });

  const handleAcceptReservation = async () => {
    if (!chefData?.chefId || !record?.id) {
      alert('Error: Datos incompletos');
      return;
    }

    try {
      setSubmitting(true);
      const response = await updateAssignment(
        chefData.chefId,
        buildAssignmentPayload(1)
      );

      if (response.success) {
        setAcceptModalVisible(true);
      } else {
        alert(`Error al aceptar: ${response.errorMessage || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error(`Error accepting ${type}:`, error);
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
    if (!chefData?.chefId || !record?.id || !rejectionReason.trim()) {
      alert('Por favor ingresa un motivo de rechazo');
      return;
    }

    try {
      setSubmitting(true);
      const response = await updateAssignment(
        chefData.chefId,
        buildAssignmentPayload(2, rejectionReason.trim())
      );

      if (response.success) {
        setRejectionReason('');
        setRejectModalVisible(false);
        navigate('/reservation', { state: { defaultTab: 'requests' } });
      } else {
        alert(`Error al rechazar: ${response.errorMessage || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error(`Error rejecting ${type}:`, error);
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

  const customerName = [record.customerName, record.customerLastName].filter(Boolean).join(' ').trim();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleGoBack} type="button">
          <ArrowLeftDetail />
        </button>
        <h1 style={styles.title}>{title}</h1>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={profileIcon} alt="Cliente" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Cliente</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>{customerName || 'No especificado'}</span>
            <span style={styles.infoRowValue}>{record.contactPhone || record.numberClient || 'Sin teléfono'}</span>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={dayIcon} alt="Fecha" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Fecha y Hora</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>
              {record.dateReservation ? formatearFechaConDia(record.dateReservation) : 'No especificada'}
            </span>
            <span style={styles.infoRowValue}>{record.hourReservation || 'No especificada'}</span>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={mapIcon} alt="Ubicación" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Ubicación</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowLabel}>{record.direction || 'No especificada'}</span>
            <span style={styles.infoRowValue}>{record.ubication || record.reference || ''}</span>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>
            <img src={listIcon} alt="Compras" style={styles.sectionIcon} />
            <span style={styles.sectionTitle}>Compras</span>
          </div>
          <div style={styles.infoCard}>
            <span style={styles.infoRowValue}>
              {record.puchaseIngredients ? 'Con compras' : 'Sin compras'}
            </span>
          </div>
        </div>

        {record.commentsClient && (
          <div style={styles.section}>
            <div style={styles.sectionLabel}>
              <span style={styles.sectionTitle}>Comentarios del Cliente</span>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoRowValue}>{record.commentsClient}</span>
            </div>
          </div>
        )}

        {isRequest && (
          <div style={styles.actionButtonsContainer}>
            <button
              style={styles.acceptButton}
              onClick={handleAcceptReservation}
              disabled={submitting}
              type="button"
            >
              <span style={styles.acceptButtonText}>
                {submitting ? 'Aceptando...' : 'Aceptar'}
              </span>
            </button>
            <button
              style={styles.rejectButton}
              onClick={() => setRejectModalVisible(true)}
              disabled={submitting}
              type="button"
            >
              <span style={styles.rejectButtonText}>Rechazar</span>
            </button>
          </div>
        )}

        <div style={styles.footer}>
          <a
            href="https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta"
            style={styles.helpLink}
          >
            <button style={styles.helpButton} type="button">
              <HelpDetail />
              <span style={styles.helpButtonText}>Necesito Ayuda</span>
            </button>
          </a>
        </div>
      </div>

      {acceptModalVisible && (
        <div style={styles.modalOverlay} onClick={() => !submitting && handleCloseAcceptModal()}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIconContainer}>
              <div style={styles.checkIconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h3 style={styles.modalTitle}>{acceptedTitle}</h3>
            <p style={styles.modalDescription}>{acceptedDescription}</p>
            <button
              style={{ ...styles.modalButton, ...styles.modalButtonPrimary }}
              onClick={handleCloseAcceptModal}
              type="button"
            >
              <span style={styles.modalButtonText}>Ver reservas</span>
            </button>
          </div>
        </div>
      )}

      {rejectModalVisible && (
        <div style={styles.modalOverlay} onClick={() => !submitting && setRejectModalVisible(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIconContainer}>
              <div style={styles.closeIconCircle}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h3 style={styles.modalTitle}>{rejectedTitle}</h3>
            <p style={styles.modalDescription}>Gracias por contestar.</p>
            <textarea
              style={styles.modalTextarea}
              placeholder="Motivo de rechazo"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={submitting}
              rows={4}
            />
            <button
              style={{ ...styles.modalButton, ...styles.modalButtonDanger }}
              onClick={handleRejectReservation}
              disabled={submitting || !rejectionReason.trim()}
              type="button"
            >
              <span style={styles.modalButtonText}>
                {submitting ? 'Rechazando...' : 'Confirmar rechazo'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ReservationDietDetailScreen = () => (
  <AppAssignmentDetailScreen
    type="dieta"
    title="Detalle del Plan Nutricional"
    acceptedTitle="¿Plan nutricional aceptado?"
    acceptedDescription="Lo verás en tus reservas confirmadas."
    rejectedTitle="Plan nutricional rechazado"
    idField="reservationDietId"
    loadById={(id) => apiService.getReservationDietById(id)}
    updateAssignment={(chefId, request) => apiService.updateReservationDietAssignment(chefId, request)}
  />
);

export const ReservationServiceTaskDetailScreen = () => (
  <AppAssignmentDetailScreen
    type="tarea"
    title="Detalle de Actividad de Cocina"
    acceptedTitle="¿Actividad aceptada?"
    acceptedDescription="Lo verás en tus reservas confirmadas."
    rejectedTitle="Actividad rechazada"
    idField="reservationServiceTaskId"
    loadById={(id) => apiService.getReservationServiceTaskById(id)}
    updateAssignment={(chefId, request) => apiService.updateReservationServiceTaskAssignment(chefId, request)}
  />
);

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    paddingTop: spacing.medium,
    paddingLeft: spacing.medium,
    paddingRight: spacing.medium,
    paddingBottom: spacing.small,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: '#1B2736',
    flex: 1,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: `${spacing.medium}px`,
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #DDE6EE',
    borderTop: '4px solid #FF4336',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  section: {
    marginBottom: spacing.large,
  },
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.small,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    objectFit: 'contain',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1B2736',
    margin: 0,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.medium,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
  },
  infoRowLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoRowValue: {
    display: 'block',
    fontSize: 15,
    fontWeight: 500,
    color: '#1B2736',
    lineHeight: '22px',
    wordBreak: 'break-word',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
  helpLink: {
    textDecoration: 'none',
  },
  helpButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingLeft: spacing.medium,
    paddingRight: spacing.medium,
    paddingTop: spacing.small,
    paddingBottom: spacing.small,
    borderRadius: 20,
    backgroundColor: '#FCE9E8',
    border: 'none',
    cursor: 'pointer',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FF4336',
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 16,
  },
  actionButtonsContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: spacing.small,
    marginBottom: spacing.medium,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2EBE60',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  acceptButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF51361A',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  rejectButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FF5136',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.medium,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: spacing.large,
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  modalIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: spacing.medium,
  },
  checkIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#D1FAE5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1F24',
    textAlign: 'center',
    marginBottom: spacing.small,
  },
  modalDescription: {
    fontSize: '14px',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: spacing.medium,
    lineHeight: '20px',
  },
  modalTextarea: {
    width: '100%',
    padding: spacing.small,
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    fontSize: '14px',
    color: '#1A1F24',
    marginBottom: spacing.medium,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalButton: {
    width: '100%',
    padding: '16px',
    borderRadius: '30px',
    border: 'none',
    cursor: 'pointer',
  },
  modalButtonPrimary: {
    backgroundColor: '#FF5136',
  },
  modalButtonDanger: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default ReservationDietDetailScreen;
