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
        {showMenu && onMenuPress && !isMobile && (
          <button 
            onClick={onMenuPress} 
            style={styles.menuButton}
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
            <span style={styles.notificationIcon}>🔔</span>
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
    backgroundColor: '#1A1F24',
    borderRadius: 2,
    marginBottom: 4,
  },
  logo: {
    width: 120,
    height: 30,
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: spacing.small,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
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
