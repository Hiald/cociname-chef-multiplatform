import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { spacing } from '../../styles';
import { Home, Reservation, Profile } from '../../assets/svgs';
import { useAuth } from '../../hooks/useAuth';
import closeIcon from '../../assets/images/sidebar/x.png';
import rightIcon from '../../assets/images/sidebar/right.png';
import whatsappIcon from '../../assets/images/sidebar/whatsapp.png';

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

  const menuItems = [
    { id: 'Home', label: 'Inicio', Icon: Home, path: '/' },
    { id: 'Reservation', label: 'Reservas', Icon: Reservation, path: '/reservation' },
    { id: 'Requests', label: 'Solicitudes', Icon: Reservation, path: '/reservation?tab=requests' },
    { id: 'Profile', label: 'Perfil', Icon: Profile, path: '/profile' },
  ];

  const infoItems = [
    { id: 'manuals', label: 'Manuales' },
    { id: 'terms', label: 'Términos y Condiciones', url: TERMS_AND_CONDITIONS_URL },
    { id: 'logout', label: 'Cerrar sesión', danger: true },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const handleNavigate = (item) => {
    navigate(item.path);
    if (onNavigate) onNavigate(item.id);
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
          {menuItems.map((item) => {
            const searchParams = new URLSearchParams(location.search);
            const reservationTab = searchParams.get('tab');
            const isReservationRoute = location.pathname === '/reservation' || location.pathname.startsWith('/reservation/');
            const isActive = item.id === 'Requests'
              ? isReservationRoute && reservationTab === 'requests'
              : item.id === 'Reservation'
                ? isReservationRoute && reservationTab !== 'requests'
                : currentRoute === item.id;
            return (
              <button
                key={item.id}
                style={{...styles.menuItem, ...(isActive && styles.menuItemActive)}}
                onClick={() => handleNavigate(item)}
              >
                <div style={styles.menuItemContent}>
                  <div style={{...styles.iconContainer, ...(isActive && styles.iconContainerActive)}}>
                    <item.Icon />
                  </div>
                  <span style={{...styles.menuItemText, ...(isActive && styles.menuItemTextActive)}}>
                    {item.label}
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
              <span style={styles.infoItemText}>{item.label}</span>
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
    marginBottom: 12,
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
    backgroundColor: '#d9dbf1',
  },
  menuItemContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  iconContainerActive: {
    backgroundColor: '#FFFFFF',
  },
  iconEmoji: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: '#56688a',
    fontWeight: '500',
    letterSpacing: 0.2,
    flex: 1,
  },
  menuItemTextActive: {
    color: '#1e2133',
    fontWeight: '700',
  },
  logoutSection: {
    padding: spacing.medium,
    marginTop: 'auto',
  },
  logoutButton: {
    width: '100%',
    padding: spacing.medium,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #FEE2E2',
    cursor: 'pointer',
  },
  logoutText: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '600',
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
