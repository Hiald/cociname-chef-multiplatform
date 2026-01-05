import React, { useState, useEffect } from 'react';
import { Home, Reservation, Profile } from '@anilist-fe/app/src/assets/svgs';

type RouteType = 'Home' | 'Reservation' | 'Profile';

interface WebBottomTabsProps {
  currentRoute: RouteType;
  onNavigate: (route: RouteType) => void;
}

const WebBottomTabs: React.FC<WebBottomTabsProps> = ({ currentRoute, onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = [
    { id: 'Home' as RouteType, label: 'Inicio', Icon: Home },
    { id: 'Reservation' as RouteType, label: 'Reservas', Icon: Reservation },
    { id: 'Profile' as RouteType, label: 'Perfil', Icon: Profile },
  ];

  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === currentRoute);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [currentRoute]);

  const handleClick = (index: number) => {
    setActiveIndex(index);
    onNavigate(tabs[index].id);
  };

  const bottomBarStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    boxShadow: '0px -2px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const bottomBarListStyle: React.CSSProperties = {
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
  };

  const bottomBarLinkStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    cursor: 'pointer',
  };

  return (
    <div style={bottomBarStyle}>
      <div style={bottomBarListStyle}>
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const color = isActive ? '#FF5136' : '#6B7280';
          
          const iconContainerStyle: React.CSSProperties = {
            width: 24,
            height: 24,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          };

          const labelStyle: React.CSSProperties = {
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

export default WebBottomTabs;