import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/images/logo.png';

const TERMS_AND_CONDITIONS_URL = import.meta.env.VITE_TERMS_AND_CONDITIONS_URL || 'https://cociname.pe/terminos-y-condiciones';

const navIcon = (paths) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const NAV_ICONS = {
  home: navIcon(<><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" /></>),
  calendar: navIcon(<><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  inbox: navIcon(<><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></>),
  user: navIcon(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>),
  clock: navIcon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
};

const Sidebar = ({ isOpen, currentRoute, onNavigate }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const searchParams = new URLSearchParams(location.search);
  const isRequestsView = location.pathname === '/reservation' && searchParams.get('tab') === 'requests';

  const navItems = [
    { id: 'Home', label: 'Inicio', path: '/', icon: NAV_ICONS.home },
    { id: 'Reservation', label: 'Mis Reservas', path: '/reservation', icon: NAV_ICONS.calendar },
    { id: 'Requests', label: 'Solicitudes', path: '/reservation?tab=requests', icon: NAV_ICONS.inbox },
    { id: 'Profile', label: 'Perfil', path: '/profile', icon: NAV_ICONS.user },
    { id: 'Availability', label: 'Mi disponibilidad', path: '/availability', icon: NAV_ICONS.clock },
  ];

  const isActive = (item) => {
    if (item.id === 'Requests') return isRequestsView || currentRoute === 'Requests';
    if (item.id === 'Reservation') return location.pathname === '/reservation' && !isRequestsView;
    if (item.id === 'Home') return location.pathname === '/' || location.pathname === '/home';
    if (item.id === 'Profile') return location.pathname === '/profile';
    if (item.id === 'Availability') return location.pathname === '/availability';
    return currentRoute === item.id;
  };

  const handleNav = (item) => {
    if (item.id === 'Requests') {
      navigate('/reservation?tab=requests', { state: { defaultTab: 'requests' } });
    } else {
      navigate(item.path);
    }
    if (onNavigate) onNavigate(item.id);
  };

  const handleClose = () => {
    if (onNavigate) onNavigate('close');
  };

  const navContent = (
    <>
      <div style={styles.drawerHeader}>
        <img src={logoImg} alt="Cociname" style={styles.brandLogo} />
        <button
          type="button"
          className="sidebar-close-btn"
          style={styles.closeButton}
          onClick={handleClose}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <button
              key={item.id}
              type="button"
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
              onClick={() => handleNav(item)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={{ ...styles.navLabel, ...(active ? styles.navLabelActive : {}) }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <button
          type="button"
          style={styles.footerLink}
          onClick={() => window.open(TERMS_AND_CONDITIONS_URL, '_blank', 'noopener,noreferrer')}
        >
          Términos y Condiciones
        </button>
        <button
          type="button"
          style={styles.footerLogout}
          onClick={() => void logout()}
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  if (!isMobile) {
    return (
      <aside className="sidebar-desktop-rail">
        {navContent}
      </aside>
    );
  }

  if (!isOpen) return null;

  return (
    <div
      style={styles.overlay}
      onClick={handleClose}
      role="presentation"
    >
      <aside style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {navContent}
      </aside>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 2000,
    background: 'rgba(20, 30, 50, 0.45)',
    animation: 'coci-fade 0.2s ease',
    display: 'block',
  },
  drawer: {
    width: 274,
    maxWidth: '84vw',
    height: '100%',
    background: '#FFFFFF',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    boxSizing: 'border-box',
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLogo: {
    width: 122,
    height: 28,
    objectFit: 'contain',
  },
  closeButton: {
    border: 'none',
    background: '#F4F0EC',
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: 17,
    color: '#5B6577',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '13px 14px',
    border: 'none',
    borderRadius: 14,
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
  },
  navItemActive: {
    background: '#FFF3EF',
  },
  navIcon: {
    width: 22,
    height: 22,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#1B2436',
  },
  navLabel: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 15,
    fontWeight: 600,
    color: '#1B2436',
  },
  navLabelActive: {
    fontFamily: "'Poppins', system-ui, sans-serif",
    fontWeight: 700,
    color: '#F2542D',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 8,
    borderTop: '1px solid #F0E7DF',
  },
  footerLink: {
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 600,
    color: '#5B6577',
    cursor: 'pointer',
  },
  footerLogout: {
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 700,
    color: '#DC2626',
    cursor: 'pointer',
  },
};

export default Sidebar;
