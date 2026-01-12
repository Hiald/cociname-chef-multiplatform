import React from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import LoginScreen from '../screens/login';
import ReservationDetailScreen from '../screens/reservationDetail';
import HomeScreen from '../screens/home';
import ReservationScreen from '../screens/reservation';
import ProfileScreen from '../screens/profile';
import { PublicReservationScreen } from '../screens/public-reservation';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';
import BottomTabs from '../components/bottom-tabs/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import './routes.css';

const Navigator = () => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Wrapper para la vista pública
  const PublicReservationWrapper = () => {
    const { token } = useParams();
    return <PublicReservationScreen token={token} />;
  };

  // Ruta pública independiente - NO requiere autenticación
  // Se verifica DESPUÉS de los hooks pero ANTES de verificar auth
  if (location.pathname.startsWith('/reserva/')) {
    return (
      <Routes>
        <Route path="/reserva/:token" element={<PublicReservationWrapper />} />
      </Routes>
    );
  }

  const getCurrentRoute = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'Home';
    if (path === '/reservation' || path.startsWith('/reservation/')) return 'Reservation';
    if (path === '/profile') return 'Profile';
    return 'Home';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: 16, color: '#6B7280' }}>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Header 
        showMenu={true} 
        onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)} 
      />
      <div className="app-content">
        <Sidebar 
          isOpen={isSidebarOpen} 
          currentRoute={getCurrentRoute()}
          onNavigate={() => {
            setIsSidebarOpen(false);
          }}
        />
        <div className="app-main">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/reservation" element={<ReservationScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/reservation/:id" element={<ReservationDetailScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default Navigator;