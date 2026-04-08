import React, { useState, useEffect } from 'react';
import { spacing } from '../../styles';
import { images } from '../../assets/images';

const Header = ({ onMenuPress, showMenu = true, notificationCount = 0, onNotificationPress }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.leftSection, 
        ...(isMobile && styles.leftSectionMobile),
        ...(!showMenu && styles.centerSection)
      }}>
        {showMenu && onMenuPress && isMobile && (
          <button 
            onClick={onMenuPress} 
            style={{ ...styles.menuButton, ...styles.menuButtonMobile }}
            aria-label="Abrir menú"
          >
            <div style={styles.menuIcon}>
              <div style={styles.menuLine} />
              <div style={styles.menuLine} />
              <div style={styles.menuLine} />
            </div>
          </button>
        )}
        
        <img 
          src={images.logo}
          alt="Logo"
          style={styles.logo}
        />
      </div>

      <div style={styles.rightSection}>
        {showMenu && (
          <button style={styles.notificationButton} onClick={onNotificationPress}>
            <img 
              src={images.notification} 
              alt="Notificaciones" 
              style={styles.notificationIcon} 
            />
            {notificationCount > 0 && (
              <span style={styles.notificationBadge}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: 60,
    backgroundColor: '#FFFFFF',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 ${spacing.medium}px`,
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  leftSectionMobile: {
    flex: 1,
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
  },
  menuButton: {
    padding: spacing.small,
    marginRight: spacing.small,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  menuButtonMobile: {
    position: 'absolute',
    left: 0,
    marginRight: 0,
    zIndex: 2,
  },
  menuIcon: {
    width: 24,
    height: 24,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: '#FF4336',
    borderRadius: 2,
    marginBottom: 4,
  },
  logo: {
    width: 124,
    height: 24,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    width: 28,
    height: 28,
    padding: (spacing.xs || 4), // Usa spacing.xs si existe, si no 4
    background: '#FF4336',
    border: 'none',
    borderRadius: 20, // O tu variable Radius/6
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `
      0px 5px 11px 0px #2C48581A,
      0px 19px 19px 0px #2C485817,
      0px 44px 26px 0px #2C48580D,
      0px 78px 31px 0px #2C485803,
      0px 122px 34px 0px #2C485800
    `,
    cursor: 'pointer',
    gap: 4,
    opacity: 1,
  },
  notificationIcon: {
    width: 20,
    height: 20,
    objectFit: 'contain',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 14,
    height: 14,
    borderRadius: 9,
    backgroundColor: '#1C2837',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: '700',
    padding: '0 4px',
    lineHeight: 1,
  },
};

export default Header;
