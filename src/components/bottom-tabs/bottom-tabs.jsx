import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import homeIcon from '../../assets/images/navigation/home.png';
import homeActiveIcon from '../../assets/images/navigation/home-color.png';
import reservationIcon from '../../assets/images/navigation/reserva.png';
import reservationActiveIcon from '../../assets/images/navigation/reserva-color.png';
import requestIcon from '../../assets/images/navigation/solicitud.png';
import requestActiveIcon from '../../assets/images/navigation/solicitud-color.png';
import profileIcon from '../../assets/images/navigation/perfil.png';
import profileActiveIcon from '../../assets/images/navigation/perfil-color.png';

if (!document.getElementById('bottom-tabs-responsive-styles')) {
  const style = document.createElement('style');
  style.id = 'bottom-tabs-responsive-styles';
  style.innerHTML = `
    .bottom-tabs-container { display: none; }
    @media (max-width: 767px) {
      .bottom-tabs-container { display: flex !important; }
    }
  `;
  document.head.appendChild(style);
}

const BottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const reservationTab = searchParams.get('tab');
  const originTab = location.state?.originTab || null;
  const isRequestContext = location.state?.isRequest || originTab === 'requests' || reservationTab === 'requests';

  const tabs = [
    { id: 'home', path: '/', label: 'Inicio', icon: homeIcon, activeIcon: homeActiveIcon },
    { id: 'reservation', path: '/reservation', label: 'Mis Reservas', icon: reservationIcon, activeIcon: reservationActiveIcon },
    { id: 'requests', path: '/reservation?tab=requests', label: 'Solicitudes', icon: requestIcon, activeIcon: requestActiveIcon },
    { id: 'profile', path: '/profile', label: 'Perfil', icon: profileIcon, activeIcon: profileActiveIcon },
  ];

  const getActiveIndex = () => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/home') return 0;
    if (currentPath === '/reservation' || currentPath.startsWith('/reservation/')) {
      return isRequestContext ? 2 : 1;
    }
    if (currentPath.startsWith('/reservation-suscription/')) {
      return isRequestContext ? 2 : 1;
    }
    if (currentPath === '/profile' || currentPath === '/availability') return 3;
    return -1;
  };

  const activeIndex = getActiveIndex();

  const handleClick = (index) => {
    const tab = tabs[index];
    const defaultTab = tab.id === 'requests' ? 'requests' : 'confirmed';
    navigate(tab.path, {
      state: tab.id === 'reservation' || tab.id === 'requests' ? { defaultTab } : undefined,
    });
  };

  return (
    <div className="bottom-tabs-container" style={styles.container}>
      {tabs.map((tab, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? '#F2542D' : '#9AA3B5';
        return (
          <button
            key={tab.id}
            type="button"
            style={styles.tabButton}
            onClick={() => handleClick(index)}
          >
            <img
              src={isActive ? tab.activeIcon : tab.icon}
              alt=""
              style={styles.tabIcon}
            />
            <span style={{ ...styles.tabLabel, color }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(480px, 100vw)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '10px 8px 20px',
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid #F0E7DF',
    boxSizing: 'border-box',
  },
  tabButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
  },
  tabIcon: {
    width: 23,
    height: 23,
    objectFit: 'contain',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    fontFamily: "'Poppins', system-ui, sans-serif",
    textAlign: 'center',
  },
};

export default BottomTabs;
