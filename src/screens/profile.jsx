import React, { useMemo } from 'react';
import { spacing } from '../styles';
import { useAuth } from '../hooks/useAuth';
import datosIcon from '../assets/images/perfil/datos.png';
import seguridadIcon from '../assets/images/perfil/seguridad.png';
import sanidadIcon from '../assets/images/perfil/sanidad.png';
import onboardingIcon from '../assets/images/perfil/onboarding.png';
import firmaIcon from '../assets/images/perfil/firma.png';
import rightRedIcon from '../assets/images/perfil/right-red.png';

const ProfileScreen = () => {
  const { chefData } = useAuth();

  const initials = useMemo(() => {
    const first = chefData?.firstName?.charAt(0) || 'C';
    const last = chefData?.lastName?.charAt(0) || 'H';
    return `${first}${last}`.toUpperCase();
  }, [chefData]);

  const fullName = useMemo(() => {
    const firstName = chefData?.firstName || 'Chef';
    const lastName = chefData?.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }, [chefData]);

  const aboutText = chefData?.description && String(chefData.description).trim() !== ''
    ? String(chefData.description)
    : '-';

  const specialties = useMemo(() => {
    const raw = chefData?.specialty || '';
    const items = String(raw)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return items.length > 0
      ? items
      : ['Sin especialidad registrada'];
  }, [chefData]);

  const experienceText = useMemo(() => {
    const experience = chefData?.experience;
    if (experience === null || experience === undefined || String(experience).trim() === '') {
      return '-';
    }
    return String(experience);
  }, [chefData]);

  const verificationItems = useMemo(() => ([
    {
      title: 'Verificación de datos',
      description: 'Verificación de identidad y datos personales.',
      icon: datosIcon,
      status: chefData?.documentNumber ? 'Aprobado' : 'Pendiente',
      statusColor: chefData?.documentNumber ? '#FFFFFF' : '#FFFFFF',
      statusBg: chefData?.documentNumber ? '#00BA96' : '#FFB125',
    },
    {
      title: 'Filtros de seguridad',
      description: 'Verificación de antecedentes.',
      icon: seguridadIcon,
      status: chefData?.status ? 'En Revisión' : 'Pendiente',
      statusColor: '#FFFFFF',
      statusBg: '#FFB125',
    },
    {
      title: 'Protocolo de sanidad',
      description: 'Capacitación de manipulación de alimentos.',
      icon: sanidadIcon,
      status: chefData?.processDetailtoCooking ? 'Pendiente' : 'Realizado',
      statusColor: '#FFFFFF',
      statusBg: '#FF564A',
    },
    {
      title: 'Onboarding',
      description: 'Recepción de uniformes y fotocheck.',
      icon: onboardingIcon,
      status: chefData?.emailConfirmed ? 'Realizado' : 'Pendiente',
      statusColor: '#FFFFFF',
      statusBg: '#00BA96',
    },
    {
      title: 'Firma de Documentos',
      description: 'Autorizaciones, contrato y reglamento.',
      icon: firmaIcon,
      status: chefData?.documentNumber ? 'Realizado' : 'Pendiente',
      statusColor: '#FFFFFF',
      statusBg: '#00BA96',
    },
  ]), [chefData]);

  const renderStars = () => {
    const rating = Number(chefData?.rating || 0);
    const rounded = Math.round(rating);
    return '★★★★★'.split('').map((star, index) => (
      <span key={`${star}-${index}`} style={{ color: index < rounded ? '#F59E0B' : '#D1D5DB' }}>{star}</span>
    ));
  };

  return (
    <div style={styles.container}>
      <div style={styles.contentContainer}>
        <div style={styles.pageHeader}>
          <div style={styles.pageTitleRow}>
            <h1 style={styles.pageTitle}>Mi perfil</h1>
          </div>
        </div>

        <div style={styles.profileCard}>
          <div style={styles.profileTopRow}>
            <div style={styles.avatarCircle}>
              <span style={styles.avatarText}>{initials}</span>
            </div>

            <div style={styles.profileTextBlock}>
              <h2 style={styles.profileName}>{fullName}</h2>
              <p style={styles.profileRole}>{experienceText}</p>
              <div style={styles.ratingRow}>
                <div style={styles.starsRow}>{renderStars()}</div>
                <span style={styles.ratingText}>{Number(chefData?.rating || 0).toFixed(1)} ({chefData?.id ? '127 reseñas' : '0 reseñas'})</span>
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.sectionBlock}>
            <p style={styles.sectionLabel}>SOBRE MÍ</p>
            <p style={styles.aboutText}>{aboutText}</p>
          </div>
        </div>

        <div style={styles.verificationCard}>
          <p style={styles.sectionHeading}>VERIFICACIONES</p>

          <div style={styles.verificationList}>
            {verificationItems.map((item) => (
              <div key={item.title} style={styles.verificationItem}>
                <img src={item.icon} alt={item.title} style={styles.verificationIcon} />
                <div style={styles.verificationTextWrap}>
                  <p style={styles.verificationTitle}>{item.title}</p>
                  <p style={styles.verificationDescription}>{item.description}</p>
                </div>
                <span style={{ ...styles.verificationStatus, color: item.statusColor, backgroundColor: item.statusBg }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.specialtiesCard}>
          <div style={styles.specialtiesHeader}>
            <p style={styles.sectionHeading}>MIS ESPECIALIDADES</p>
            <button style={styles.editButton}>Editar <img src={rightRedIcon} alt="Editar" style={styles.editIcon} /></button>
          </div>

          <div style={styles.chipWrap}>
            {specialties.map((specialty) => (
              <span key={specialty} style={styles.chip}>{specialty}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100%',
    width: '100%',
    backgroundColor: '#ECF4FA',
  },
  contentContainer: {
    padding: `${spacing.medium}px ${spacing.medium}px 20px`,
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
  },
  pageHeader: {
    marginBottom: spacing.small,
  },
  pageTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#1B2736',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.medium,
    boxShadow: '0 12px 26px rgba(44, 72, 88, 0.08)',
    marginBottom: spacing.medium,
  },
  profileTopRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8CB0C8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  profileTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    margin: '0 0 2px',
    fontSize: 20,
    fontWeight: 800,
    color: '#1B2736',
  },
  profileRole: {
    margin: 0,
    fontSize: 14,
    color: '#556475',
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  starsRow: {
    display: 'flex',
    gap: 2,
    fontSize: 14,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E9EEF4',
    margin: `${spacing.medium}px 0`,
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#1B2736',
  },
  aboutText: {
    margin: 0,
    fontSize: 15,
    lineHeight: '22px',
    color: '#263447',
  },
  quickActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: spacing.medium,
  },
  primaryAction: {
    width: '100%',
    border: 'none',
    borderRadius: 999,
    backgroundColor: '#FF5136',
    padding: '14px 16px',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 8px 18px rgba(255, 81, 54, 0.22)',
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: 800,
  },
  secondaryAction: {
    width: '100%',
    border: 'none',
    borderRadius: 999,
    backgroundColor: '#FCE8E5',
    padding: '14px 16px',
    color: '#FF5136',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  secondaryActionText: {
    fontSize: 15,
    fontWeight: 800,
  },
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: spacing.medium,
    marginBottom: spacing.medium,
    boxShadow: '0 10px 24px rgba(44, 72, 88, 0.06)',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    color: '#1B2736',
  },
  verificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  verificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  verificationIcon: {
    width: 32,
    height: 32,
    objectFit: 'contain',
    display: 'block',
    flexShrink: 0,
  },
  verificationTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  verificationTitle: {
    margin: '0 0 2px',
    fontSize: 14,
    fontWeight: 800,
    color: '#1B2736',
  },
  verificationDescription: {
    margin: 0,
    fontSize: 12,
    lineHeight: '18px',
    color: '#556475',
  },
  verificationStatus: {
    minWidth: 82,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 800,
    borderRadius: 999,
    padding: '5px 10px',
    alignSelf: 'center',
  },
  specialtiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: '0px 20px 12px',
    marginBottom: spacing.medium,
    boxShadow: '0 10px 24px rgba(44, 72, 88, 0.06)',
  },
  specialtiesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editButton: {
    border: 'none',
    background: 'transparent',
    color: '#FF5136',
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
  },
  editIcon: {
    width: 16,
    height: 16,
    objectFit: 'contain',
  },
  chipWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    padding: '8px 12px',
    borderRadius: 999,
    backgroundColor: '#FFF0EA',
    color: '#FF5136',
    fontSize: 13,
    fontWeight: 700,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    boxShadow: '0 10px 24px rgba(44, 72, 88, 0.06)',
    overflow: 'hidden',
  },
  menuItem: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 18px',
    cursor: 'pointer',
    borderBottom: '1px solid #EEF2F7',
    textAlign: 'left',
  },
  menuItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#F3F7FB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuText: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1B2736',
  },
};

export default ProfileScreen;
