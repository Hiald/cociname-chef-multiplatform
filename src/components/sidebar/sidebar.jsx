import React from 'react';
import { spacing } from '../../styles';
import { Home, Reservation, Profile } from '../../assets/svgs';
import { useAuth } from '../../hooks/useAuth';

// Inject responsive styles
if (!document.getElementById('sidebar-responsive-styles')) {
  const style = document.createElement('style');
  style.id = 'sidebar-responsive-styles';
  style.innerHTML = `
    .sidebar-container {
      display: none;
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
  const { logout } = useAuth();
  const sidebarWidth = isOpen ? 280 : 0;

  const menuItems = [
    { id: 'Home', label: 'Inicio', Icon: Home },
    { id: 'Reservation', label: 'Reservas', Icon: Reservation },
    { id: 'Profile', label: 'Perfil', Icon: Profile },
  ];

  const handleLogout = async () => {
    await logout();
  };

  if (!isOpen) return null;

  return (
    <div className="sidebar-container" style={{...styles.container, width: sidebarWidth}}>
      <div style={styles.scrollView}>
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            <span style={styles.avatarText}></span>
          </div>
          <span style={styles.userName}>
            Chef
          </span>
        </div>

        <div style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                style={{...styles.menuItem, ...(isActive && styles.menuItemActive)}}
                onClick={() => onNavigate(item.id)}
              >
                <div style={styles.menuItemContent}>
                  <div style={{...styles.iconContainer, ...(isActive && styles.iconContainerActive)}}>
                    <item.Icon />
                  </div>
                  <span style={{...styles.menuItemText, ...(isActive && styles.menuItemTextActive)}}>
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={styles.logoutSection}>
          <button 
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            <span style={styles.logoutText}>🚪 Cerrar sesión</span>
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
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF5136',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  avatarText: {
    fontSize: 36,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
};

export default Sidebar;
