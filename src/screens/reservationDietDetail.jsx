import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { ArrowLeftDetail } from '../assets/svgs';
import { useAuth } from '../hooks/useAuth';
import {
  formatCurrency,
  formatPublicDate,
  formatPublicHour,
  getCustomerFullName,
  getClientComment,
} from '../utils/formatters';
import { RequestDetailShell } from '../components/request-detail/RequestDetailShell';
import {
  buildDietScheduleRows,
  getDietModalityShortLabel,
  getDietServicePreferenceLabel,
  getDistrictLabel,
  getRequestAllergies,
  getRequestClientComment,
  getRequestCustomerName,
  getRequestServiceAmount,
  getRequestServiceTitle,
  mapDietMenusToDishes,
} from '../utils/requestDetail';
import profileIcon from '../assets/images/detalle/perfil.png';
import dayIcon from '../assets/images/detalle/dia.png';
import hourIcon from '../assets/images/detalle/hora.png';
import menuIcon from '../assets/images/detalle/menu.png';
import chefIcon from '../assets/images/detalle/chef.png';
import mapIcon from '../assets/images/detalle/map.png';
import gainIcon from '../assets/images/detalle/ganancia.png';
import upIcon from '../assets/images/detalle/up.png';
import helpIcon from '../assets/images/detalle/ayuda.png';
import listIcon from '../assets/images/detalle/lista.png';

/**
 * Detalle de reserva de plan nutricional para cocinera
 * Route: /reservation-diet/:id
 */

const SUPPORT_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';
const CARD_SHADOW = '0px 2px 4px 0px #289FDF0A, 0px 7px 7px 0px #289FDF0A, 0px 15px 9px 0px #289FDF05, 0px 26px 10px 0px #289FDF03, 0px 41px 11px 0px #289FDF00';

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
  const [collapsedSections, setCollapsedSections] = useState({
    location: false,
    plan: false,
    gain: false,
  });
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

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenMaps = () => {
    const address = record?.direction || record?.Direction || '';
    if (!address) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSupportClick = () => {
    window.open(SUPPORT_CONTACT_URL, '_blank', 'noopener,noreferrer');
  };

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
            <div style={styles.backButtonContent}>
              <ArrowLeftDetail />
              <span style={styles.backButtonText}>Volver</span>
            </div>
          </button>
        </div>
        <div style={styles.contentContainer}>
          <p style={styles.errorText}>No se pudo cargar el detalle</p>
        </div>
      </div>
    );
  }

  const customerName = getCustomerFullName(record);
  const direction = record.direction || record.Direction || '-';
  const reference = record.reference || record.Reference || '';
  const totalPrice = Number(record.totalPrice ?? record.TotalPrice ?? record.commissiontoChef ?? record.commissionToChef ?? 0);
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
  const modalityLabel = `Modalidad: ${getDietModalityShortLabel(record.dietModality ?? record.DietModality)}`;
  const serviceLabel = `Servicio: ${getDietServicePreferenceLabel(record.servicePreference ?? record.ServicePreference)}`;

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
          dishesSectionTitle={modality === 2 ? 'Tu plan' : 'Platos solicitados'}
          serviceAmount={getRequestServiceAmount({ ...record, tipo: 'dieta' })}
          clientComment={getRequestClientComment(record)}
          onAccept={handleAcceptReservation}
          onReject={() => setRejectModalVisible(true)}
          submitting={submitting}
          extraSection={modality === 2 && planUrl ? (
            <div style={styles.requestPlanBox}>
              <a href={planUrl} target="_blank" rel="noopener noreferrer" style={styles.planLink}>{planName}</a>
            </div>
          ) : null}
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
          <div style={styles.backButtonContent}>
            <ArrowLeftDetail />
            <span style={styles.backButtonText}>Volver</span>
          </div>
        </button>
        <div style={{ ...styles.statusBadge, backgroundColor: '#FFF0E6' }}>
          <span style={{ ...styles.statusBadgeText, color: '#FF5136' }}>PROXIMA</span>
        </div>
      </div>

      <div style={{ ...styles.scrollView, ...styles.contentContainer }}>
        <div style={styles.customerHeader}>
          <div style={styles.customerNameRow}>
            <img src={profileIcon} alt="" style={styles.headerIcon} />
            <h2 style={styles.customerName}>{customerName || 'Cliente'}</h2>
          </div>
        </div>

        <div style={styles.infoCardContainer}>
          <div style={styles.infoRow}>
            <img src={dayIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{formatPublicDate(getDateValue(record))}</span>
          </div>
          <div style={styles.infoRow}>
            <img src={hourIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{formatPublicHour(getHourValue(record))}</span>
          </div>
          <div style={styles.infoRow}>
            <img src={listIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{purchasesLabel}</span>
          </div>
          {peopleLabel ? (
            <div style={styles.infoRow}>
              <img src={menuIcon} alt="" style={styles.infoRowIcon} />
              <span style={styles.infoRowLabel}>{peopleLabel}</span>
            </div>
          ) : null}
          <div style={styles.infoRow}>
            <img src={listIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{modalityLabel}</span>
          </div>
          <div style={styles.infoRow}>
            <img src={chefIcon} alt="" style={styles.infoRowIcon} />
            <span style={styles.infoRowLabel}>{serviceLabel}</span>
          </div>
        </div>

        {clientComment ? (
          <div style={styles.section}>
            <div style={styles.card}>
              <p style={styles.commentLabel}>Comentarios del cliente</p>
              <p style={styles.commentText}>{clientComment}</p>
            </div>
          </div>
        ) : null}

        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('location')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={mapIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Ubicación</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.location
                ? { ...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed }
                : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.location && (
            <div style={styles.card}>
              <p style={styles.addressText}>{direction}</p>
              {reference ? (
                <p style={styles.referenceText}>{reference}</p>
              ) : (
                <p style={styles.referenceText}>Sin referencia registrada</p>
              )}
              <button style={styles.mapButton} onClick={handleOpenMaps} type="button">
                <span style={styles.mapButtonText}>Abrir en Maps</span>
              </button>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('plan')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={chefIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Tu plan</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.plan
                ? { ...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed }
                : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.plan && (
            <div style={styles.card}>
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
            </div>
          )}
        </div>

        <div style={styles.section}>
          <button style={styles.sectionHeaderButton} onClick={() => toggleSection('gain')} type="button">
            <div style={styles.sectionHeaderLeft}>
              <img src={gainIcon} alt="" style={styles.sectionHeaderIcon} />
              <h3 style={styles.sectionTitle}>Mi ganancia</h3>
            </div>
            <img
              src={upIcon}
              alt=""
              style={collapsedSections.gain
                ? { ...styles.sectionToggleIcon, ...styles.sectionToggleIconCollapsed }
                : styles.sectionToggleIcon}
            />
          </button>
          {!collapsedSections.gain && (
            <div style={styles.card}>
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaLabel}>Comisión chef</span>
                <span style={styles.garantiaValue}>{formatCurrency(totalPrice)}</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.garantiaRow}>
                <span style={styles.garantiaTotal}>Total</span>
                <span style={styles.garantiaTotalValue}>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          )}
        </div>

        <div style={styles.helpSection}>
          <p style={styles.helpTitle}>¿Necesitas ayuda?</p>
          <p style={styles.helpText}>Comunícate con una asesora</p>
          <button style={styles.helpButton} onClick={handleSupportClick} type="button">
            <img src={helpIcon} alt="" style={styles.helpIcon} />
            <span style={styles.helpButtonText}>Ayuda con el servicio</span>
          </button>
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

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.medium}px ${spacing.medium}px ${spacing.small}px`,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  backButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#1A1F24',
    fontSize: '16px',
    fontWeight: '600',
    marginLeft: '4px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
  },
  statusBadgeText: {
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: `${spacing.medium}px ${spacing.medium}px 20px`,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  customerHeader: {
    paddingBottom: `${spacing.small}px`,
    marginBottom: `${spacing.small}px`,
  },
  customerNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  customerName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1C2837',
    margin: 0,
  },
  infoCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    marginBottom: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '7px 0',
    gap: '10px',
  },
  infoRowIcon: {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  infoRowLabel: {
    fontSize: '14px',
    color: '#1A1F24',
    fontWeight: '500',
    lineHeight: '18px',
  },
  section: {
    marginBottom: `${spacing.large}px`,
  },
  sectionHeaderButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: 0,
    marginBottom: `${spacing.small}px`,
    cursor: 'pointer',
  },
  sectionHeaderLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '10px',
  },
  sectionHeaderIcon: {
    width: '20px',
    height: '20px',
    objectFit: 'contain',
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    margin: 0,
  },
  sectionToggleIcon: {
    width: '16px',
    height: '16px',
    objectFit: 'contain',
    transition: 'transform 0.2s ease',
  },
  sectionToggleIconCollapsed: {
    transform: 'rotate(180deg)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    padding: `${spacing.medium}px`,
    boxShadow: CARD_SHADOW,
  },
  addressText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1A1F24',
    marginBottom: '4px',
    marginTop: 0,
  },
  referenceText: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '20px',
    marginBottom: `${spacing.medium}px`,
    marginTop: 0,
  },
  mapButton: {
    backgroundColor: '#FF51361A',
    padding: '10px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  mapButtonText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#FF5136',
  },
  planLink: {
    color: '#1391E2',
    fontWeight: 600,
    textDecoration: 'none',
    wordBreak: 'break-word',
  },
  requestPlanBox: {
    marginTop: 8,
  },
  dishCard: {
    padding: '10px 0',
    borderBottom: '1px solid #EEF2F6',
  },
  dishName: {
    margin: '0 0 8px',
    fontSize: 15,
    fontWeight: 700,
    color: '#1A2332',
  },
  dishFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portionsText: {
    border: '1px solid #E8EEF5',
    borderRadius: 999,
    padding: '4px 12px',
    fontWeight: 700,
    color: '#1C2837',
    fontSize: 13,
  },
  emptyText: {
    margin: 0,
    textAlign: 'center',
    color: '#6B7A90',
    padding: '12px 0',
  },
  commentLabel: {
    margin: '0 0 8px',
    fontSize: 13,
    fontWeight: 600,
    color: '#6B7280',
  },
  commentText: {
    margin: 0,
    fontSize: 14,
    color: '#324154',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  garantiaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  garantiaLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  garantiaValue: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A1F24',
  },
  garantiaTotal: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1A1F24',
  },
  garantiaTotalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FF5136',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    margin: '4px 0',
  },
  helpSection: {
    textAlign: 'center',
    marginTop: spacing.large,
    marginBottom: spacing.large,
  },
  helpTitle: {
    margin: '0 0 4px',
    fontSize: 16,
    fontWeight: 700,
    color: '#1A1F24',
  },
  helpText: {
    margin: '0 0 12px',
    fontSize: 13,
    color: '#6B7280',
  },
  helpButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: `${spacing.small}px ${spacing.medium}px`,
    borderRadius: 20,
    backgroundColor: '#FCE9E8',
    border: 'none',
    cursor: 'pointer',
  },
  helpIcon: {
    width: 18,
    height: 18,
    objectFit: 'contain',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FF4336',
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #DDE6EE',
    borderTop: '4px solid #FF4336',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.medium,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.large,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 700,
    color: '#1A1F24',
    textAlign: 'center',
  },
  modalDescription: {
    margin: '0 0 16px',
    textAlign: 'center',
    color: '#6B7280',
  },
  modalTextarea: {
    width: '100%',
    padding: spacing.small,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    fontSize: 14,
    marginBottom: spacing.medium,
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  modalButtonPrimary: {
    width: '100%',
    padding: 16,
    borderRadius: 30,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#FF5136',
    color: '#FFFFFF',
    fontWeight: 600,
  },
  modalButtonDanger: {
    width: '100%',
    padding: 16,
    borderRadius: 30,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontWeight: 600,
  },
};

export default ReservationDietDetailScreen;
