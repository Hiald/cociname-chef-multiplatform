import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { spacing } from '../styles';
import { apiService } from '../services/api.service';
import { useAuth } from '../hooks/useAuth';
import { Profile, Clock, Restaurant, List, Verified, TyC, Logout, WhatsApp, Calendar, ArrowRight } from '../assets/svgs';

const ProfileScreen = () => {
  const [chefData, setChefData] = useState(null);
  const [loading, setLoading] = useState(true);
  const chefId = 30; // TODO: Obtener del contexto de autenticación
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    loadChefData();
  }, []);

  const loadChefData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getChef(chefId);
      if (response.success && response.data) {
        setChefData(response.data);
      }
    } catch (error) {
      console.error('Error loading chef data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleWhatsAppContact = () => {
    const url = 'https://wa.me/51963138202?text=Hola!%20Necesito%20ayuda%20con%20mi%20Reserva%20de%20Cocina%20a%20Domicilio';
    window.open(url, '_blank');
  };

  // eslint-disable-next-line no-unused-vars
  const handleWhatsAppHelp = () => {
    const url = 'https://wa.me/51963138202?text=Hola!%20Necesito%20ayuda%20con%20mi%20Reserva%20de%20Cocina%20a%20Domicilio';
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    // Usar el método logout del contexto de autenticación
    await logout();
    // Navigate to login
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, ...styles.contentContainer}}>
      {/* Header con foto de perfil */}
      <div style={styles.header}>
        <div style={styles.profileImageContainer}>
          <span style={styles.profileInitials}>
            {chefData ? getInitials(chefData.firstName, chefData.lastName) : 'CH'}
          </span>
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.name}>
            {chefData ? `${chefData.firstName} ${chefData.lastName}` : 'Chef'}
          </h2>
          <p style={styles.role}>Cocinera experta</p>
        </div>
      </div>

      {/* Botones principales */}
      <div style={styles.buttonSection}>
        <button style={styles.primaryButton}>
          <span style={styles.primaryButtonText}>Ver mis reservas</span>
        </button>
        <button style={styles.secondaryButton}>
          <span style={styles.secondaryButtonText}>Completar disponibilidad</span>
        </button>
      </div>

      {/* Menú principal */}
      <div style={styles.menuSection}>
        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Mi perfil</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Mi disponibilidad</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Mi cobertura</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Historial de pagos</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Beneficios</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>
      </div>

      {/* Sección de información */}
      <div style={styles.infoSection}>
        <h3 style={styles.sectionTitle}>Información</h3>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <List />
            </div>
            <span style={styles.menuText}>Manuales</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <TyC />
            </div>
            <span style={styles.menuText}>Términos y Condiciones</span>
          </div>
          <div style={styles.menuArrowContainer}>
            <ArrowRight />
          </div>
        </button>

        <button style={styles.menuItem} onClick={handleLogout}>
          <div style={styles.menuItemLeft}>
            <div style={styles.menuIconContainer}>
              <Logout />
            </div>
            <span style={styles.menuText}>Cerrar sesión</span>
          </div>
        </button>
      </div>

      {/* Sección de ayuda */}
      <div style={styles.helpSection}>
        <p style={styles.helpTitle}>¿Necesitas ayuda?</p>
        <p style={styles.helpSubtitle}>Comunícate con una asesora</p>
        <button style={styles.whatsappButton} onClick={handleWhatsAppContact}>
          <div style={styles.whatsappIconContainer}>
            <WhatsApp />
          </div>
          <span style={styles.whatsappButtonText}>Comunícate con nosotros</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#F5F7FA',
    overflowX: 'hidden',
  },
  contentContainer: {
    padding: `${spacing.medium}px ${spacing.medium}px 20px`,
    maxWidth: '100%',
    width: '100%',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #FF5136',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `${spacing.large}px 0`,
  },
  profileImageContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '40px',
    backgroundColor: '#C5D8E7',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: `${spacing.medium}px`,
  },
  profileInfo: {
    flex: 1,
  },
  profileInitials: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: '4px',
    margin: 0,
  },
  role: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0,
  },
  buttonSection: {
    marginBottom: `${spacing.large}px`,
  },
  primaryButton: {
    backgroundColor: '#FF5136',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: `${spacing.small}px`,
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  primaryButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFE8E5',
    padding: '16px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FF5136',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.small}px`,
    marginBottom: `${spacing.large}px`,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: `${spacing.small}px`,
    marginBottom: `${spacing.large}px`,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    padding: `${spacing.small}px ${spacing.medium}px`,
    margin: 0,
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `16px ${spacing.medium}px`,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #F3F4F6',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  menuItemLeft: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    marginRight: `${spacing.medium}px`,
  },
  menuText: {
    fontSize: '15px',
    color: '#1A1F24',
  },
  menuArrowContainer: {
    // Container for ArrowRight SVG
  },
  helpSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: `${spacing.large}px 0`,
  },
  helpTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1A1F24',
    marginBottom: '4px',
  },
  helpSubtitle: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: `${spacing.medium}px`,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    padding: '14px 24px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: 'none',
    cursor: 'pointer',
  },
  whatsappIconContainer: {
    marginRight: `${spacing.small}px`,
  },
  whatsappButtonText: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

export default ProfileScreen;
