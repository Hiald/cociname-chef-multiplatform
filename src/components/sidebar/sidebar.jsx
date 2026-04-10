import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../../styles';
import { useAuth } from '../../hooks/useAuth';
import closeIcon from '../../assets/images/sidebar/x.png';
import rightIcon from '../../assets/images/sidebar/right.png';
import whatsappIcon from '../../assets/images/sidebar/whatsapp.png';
import profileIcon from '../../assets/images/sidebar/perfil.png';
import availabilityIcon from '../../assets/images/sidebar/disponibilidad.png';
import pastIcon from '../../assets/images/sidebar/pasadas.png';
import manualIcon from '../../assets/images/sidebar/manual.png';
import tycIcon from '../../assets/images/sidebar/tyc.png';
import logoutIcon from '../../assets/images/sidebar/cerrar.png';

const WHATSAPP_CONTACT_URL = 'https://api.whatsapp.com/send/?phone=51963138202&text=Hola%21+Vengo+de+la+plataforma+y+tengo+una+consulta';
const TERMS_AND_CONDITIONS_URL = import.meta.env.VITE_TERMS_AND_CONDITIONS_URL || 'https://cociname.pe/terminos-y-condiciones';

// Inject responsive styles
if (!document.getElementById('sidebar-responsive-styles')) {
  const style = document.createElement('style');
  style.id = 'sidebar-responsive-styles';
  style.innerHTML = `
    .sidebar-container {
      display: block;
    }
    @media (min-width: 768px) {
      .sidebar-container {
        display: block !important;
      }
    }
  `;
  document.head.appendChild(style);
}

const Sidebar = ({ isOpen, currentRoute, onNavigate }) => {
  const { logout, chefData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = window.innerWidth < 768;
  const fullName = `${chefData?.firstName || 'Chef'} ${chefData?.lastName || ''}`.trim();
  const experienceText = chefData?.experience ? String(chefData.experience) : '-';

  const quickActions = [
    { id: 'Profile', label: 'Mi perfil', icon: profileIcon },
    { id: 'Availability', label: 'Mi disponibilidad', icon: availabilityIcon },
    { id: 'PastReservations', label: 'Reservas pasadas', icon: pastIcon },
  ];

  const infoItems = [
    { id: 'manuals', label: 'Manuales', icon: manualIcon },
    { id: 'terms', label: 'Términos y Condiciones', icon: tycIcon, url: TERMS_AND_CONDITIONS_URL },
    { id: 'logout', label: 'Cerrar sesión', icon: logoutIcon, danger: true },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleReservationClick = () => {
    navigate('/reservation');
    if (onNavigate) onNavigate('Reservation');
  };

  const handleAvailabilityClick = () => {
    navigate('/availability');
    if (onNavigate) onNavigate('Availability');
  };

  const handleContactClick = () => {
    window.open(WHATSAPP_CONTACT_URL, '_blank', 'noopener,noreferrer');
  };

  const handleActionClick = (actionId) => {
    if (actionId === 'Profile') {
      navigate('/profile');
      if (onNavigate) onNavigate('Profile');
      return;
    }

    if (actionId === 'Availability') {
      navigate('/availability');
      if (onNavigate) onNavigate('Availability');
      return;
    }

    if (actionId === 'PastReservations') {
      navigate('/reservation?tab=confirmed&history=true', {
        state: { defaultTab: 'confirmed', showPast: true },
      });
      if (onNavigate) onNavigate('PastReservations');
    }
  };

  const handleInfoItemClick = (item) => {
    if (item.id === 'logout') {
      void handleLogout();
      return;
    }

    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = () => {
    if (onNavigate) onNavigate('close');
  };

  if (!isOpen) return null;

  const containerStyle = isMobile
    ? {
        ...styles.container,
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 2000,
        height: '100vh',
        borderRight: 'none',
        boxShadow: '8px 0 24px rgba(0, 0, 0, 0.12)',
      }
    : {
        ...styles.container,
        width: 280,
      };

  return (
    <div className="sidebar-container" style={containerStyle}>
      <div style={styles.scrollView}>
        <div style={styles.userSection}>
          <button style={styles.closeButton} onClick={handleClose} aria-label="Cerrar sidebar">
            <img src={closeIcon} alt="Cerrar" style={styles.closeIcon} />
          </button>

          <div style={styles.userHeaderRow}>
            <div style={styles.avatar}>
              <span style={styles.avatarText}>{(chefData?.firstName?.charAt(0) || 'C').toUpperCase()}{(chefData?.lastName?.charAt(0) || 'H').toUpperCase()}</span>
            </div>
            <div style={styles.userHeaderText}>
              <span style={styles.userName}>{fullName}</span>
              <span style={styles.userRole}>{experienceText}</span>
            </div>
          </div>

          <button style={styles.primaryButton} onClick={handleReservationClick}>
            Ver mis reserva
          </button>
          <button style={styles.secondaryButton} onClick={handleAvailabilityClick}>
            Completar disponibilidad
          </button>
        </div>

        <div style={styles.menuSection}>
          {quickActions.map((action) => {
            const searchParams = new URLSearchParams(location.search);
            const isPastView = location.pathname === '/reservation' && searchParams.get('history') === 'true';
            const isActive = action.id === 'PastReservations'
              ? isPastView
              : currentRoute === action.id;

            return (
              <button
                key={action.id}
                style={{ ...styles.menuItem, ...(isActive && styles.menuItemActive) }}
                onClick={() => handleActionClick(action.id)}
              >
                <div style={styles.menuItemContent}>
                  <img src={action.icon} alt="" style={styles.menuItemIcon} />
                  <span style={{ ...styles.menuItemText, ...(isActive && styles.menuItemTextActive) }}>
                    {action.label}
                  </span>
                  <img src={rightIcon} alt="" style={styles.rowArrow} />
                </div>
              </button>
            );
          })}
        </div>

        <div style={styles.infoSection}>
          <p style={styles.infoTitle}>Información</p>
          {infoItems.map((item) => (
            <button
              key={item.id}
              style={{ ...styles.infoItem, ...(item.danger && styles.infoItemDanger) }}
              onClick={() => handleInfoItemClick(item)}
            >
              <div style={styles.infoItemContent}>
                <img src={item.icon} alt="" style={styles.infoItemIcon} />
                <span style={styles.infoItemText}>{item.label}</span>
              </div>
              <img src={rightIcon} alt="" style={styles.rowArrow} />
            </button>
          ))}
        </div>

        <div style={styles.contactSection}>
          <p style={styles.contactTitle}>¿Necesitas ayuda?</p>
          <p style={styles.contactSubtitle}>Comunícate con una asesora</p>
          <button style={styles.contactButton} onClick={handleContactClick}>
            <img src={whatsappIcon} alt="WhatsApp" style={styles.contactIcon} />
            <span style={styles.contactText}>Comunícate con nosotros</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    height: '100vh',
    overflow: 'hidden',
    borderRight: '1px solid #E5E7EB',
  },
  scrollView: {
    flex: 1,
    overflowY: 'auto',
  },
  userSection: {
    padding: spacing.large,
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#FAFAFA',
  },
  closeButton: {
    width: 28,
    height: 28,
    border: 'none',
    background: 'transparent',
    padding: 0,
    marginBottom: 14,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  closeIcon: {
    width: 28,
    height: 28,
    objectFit: 'contain',
    display: 'block',
  },
  userHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8CB0C8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  avatarText: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1F24',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 14,
    color: '#3D4A5B',
    marginTop: 2,
  },
  userHeaderText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
  },
  primaryButton: {
    border: 'none',
    borderRadius: 999,
    background: 'linear-gradient(97.22deg, #FF6833 2.34%, #FF4336 100%)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    padding: '11px 16px',
    cursor: 'pointer',
    marginBottom: 10,
  },
  secondaryButton: {
    border: 'none',
    borderRadius: 999,
    backgroundColor: '#FFECEB',
    color: '#FF5136',
    fontSize: 14,
    fontWeight: '600',
    padding: '11px 16px',
    cursor: 'pointer',
  },
  menuSection: {
    padding: `${spacing.medium}px ${spacing.small}px`,
  },
  menuItem: {
    width: '100%',
    padding: `14px ${spacing.medium}px`,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  menuItemActive: {
    backgroundColor: '#EEF5FB',
  },
  menuItemContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  menuItemIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    marginRight: spacing.medium,
    flexShrink: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  menuItemTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  infoSection: {
    borderTop: '1px solid #E5E7EB',
    marginTop: 4,
    padding: `${spacing.medium}px ${spacing.small}px 0`,
  },
  infoTitle: {
    margin: `0 ${spacing.medium}px 10px`,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1F24',
  },
  infoItem: {
    width: '100%',
    padding: `12px ${spacing.medium}px`,
    marginBottom: 4,
    borderRadius: 10,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItemContent: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.medium,
    flex: 1,
  },
  infoItemIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    flexShrink: 0,
  },
  infoItemDanger: {
    color: '#DC2626',
  },
  infoItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  rowArrow: {
    width: 20,
    height: 20,
    objectFit: 'contain',
    flexShrink: 0,
  },
  contactSection: {
    padding: `${spacing.medium}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingBottom: spacing.large,
  },
  contactTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1F24',
    textAlign: 'center',
  },
  contactSubtitle: {
    margin: 0,
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  contactButton: {
    width: '100%',
    border: 'none',
    borderRadius: 999,
    backgroundColor: '#48C267',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    padding: '13px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 10px 18px rgba(72, 194, 103, 0.22)',
  },
  contactIcon: {
    width: 22,
    height: 22,
    objectFit: 'contain',
    display: 'block',
  },
  contactText: {
    fontSize: 16,
    fontWeight: '700',
  },
};

export default Sidebar;
