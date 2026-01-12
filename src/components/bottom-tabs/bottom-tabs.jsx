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
    if (currentPath === '/reservation') return 1;
    if (currentPath === '/profile') return 2;
    return 0;
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
    boxShadow: '0px -2px 3px rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
    gap: 4,
    cursor: 'pointer',
  };

  return (
    <div className="bottom-tabs-container" style={bottomBarStyle}>
      <div style={bottomBarListStyle}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const color = isActive ? '#FF5136' : '#6B7280';
          
          const iconContainerStyle = {
            width: 24,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          };

          const labelStyle = {
            fontSize: 12,
            fontWeight: isActive ? 500 : 400,
            color: color,
            marginTop: 4,
          };

          return (
            <div
              key={tab.id}
              style={bottomBarLinkStyle}
              onClick={() => handleClick(index)}
            >
              <div style={iconContainerStyle}>
                <tab.Icon />
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