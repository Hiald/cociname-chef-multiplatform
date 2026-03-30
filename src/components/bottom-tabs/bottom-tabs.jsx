import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Reservation, Profile } from '../../assets/svgs';

// Inject responsive styles
if (!document.getElementById('bottom-tabs-responsive-styles')) {
  const style = document.createElement('style');
  style.id = 'bottom-tabs-responsive-styles';
  style.innerHTML = `
    .bottom-tabs-container {
      display: none;
    }
    @media (max-width: 767px) {
      .bottom-tabs-container {
        display: flex !important;
      }
    }
  `;
  document.head.appendChild(style);
}

const BottomTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', path: '/', label: 'Inicio', Icon: Home },
    { id: 'reservation', path: '/reservation', label: 'Reservas', Icon: Reservation },
    { id: 'profile', path: '/profile', label: 'Perfil', Icon: Profile },
  ];

  const getActiveIndex = () => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/home') return 0;
    if (currentPath === '/reservation' || currentPath.startsWith('/reservation/')) return 1;
    if (currentPath === '/profile') return 2;
    return -1; // No active tab for other routes
  };

  const activeIndex = getActiveIndex();

  const handleClick = (index) => {
    navigate(tabs[index].path);
  };

  const bottomBarStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    borderRadius: '20px 20px 0 0',
    boxShadow: `
      0px -5px 10px 0px #376A7C1C,
      0px -18px 18px 0px #376A7C17,
      0px -42px 25px 0px #376A7C0D,
      0px -74px 30px 0px #376A7C05,
      0px -115px 32px 0px #376A7C00,
      0px 4px 15px 2px #E3F0F8
    `,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    overflow: 'hidden',
  };

  const bottomBarListStyle = {
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
  };

  const bottomBarLinkStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2, // Menos espacio entre icono y texto
    cursor: 'pointer',
    transition: 'color 0.2s',
    userSelect: 'none',
  };

  return (
    <div className="bottom-tabs-container" style={bottomBarStyle}>
      <div style={bottomBarListStyle}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const color = isActive ? '#FF4336' : '#6B7280';
          const iconContainerStyle = {
            width: 24,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: color,
            transition: 'color 0.2s',
          };
          const labelStyle = {
            fontFamily: 'Goldplay, sans-serif',
            fontWeight: 700,
            fontStyle: 'normal',
            fontSize: 12,
            lineHeight: '16px',
            letterSpacing: 0,
            color: color,
            marginTop: 0,
            textAlign: 'center',
            verticalAlign: 'middle',
            transition: 'color 0.2s',
            display: 'block',
          };
          return (
            <div
              key={tab.id}
              style={bottomBarLinkStyle}
              onClick={() => handleClick(index)}
            >
              <div style={iconContainerStyle}>
                <tab.Icon color="currentColor" />
              </div>
              <span style={labelStyle}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BottomTabs;