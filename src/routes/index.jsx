import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import ReservationDetailScreen from '../screens/reservationDetail';
import ReservationSuscriptionDetailScreen from '../screens/reservationSuscriptionDetail';
import ReservationEventDetailScreen from '../screens/reservationEventDetail';
import { ReservationDietDetailScreen, ReservationServiceTaskDetailScreen } from '../screens/reservationAppDetail';
import HomeScreen from '../screens/home';
import ReservationScreen from '../screens/reservation';
import AvailabilityScreen from '../screens/availability';
import ProfileScreen from '../screens/profile';
import { PublicReservationScreen } from '../screens/public-reservation';
import { PublicSuscriptionScreen } from '../screens/public-suscription';
import { PublicEventScreen } from '../screens/public-event';
import PublicOnboardingScreen from '../screens/public-onboarding';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';
import BottomTabs from '../components/bottom-tabs/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import { useSignalR } from '../hooks/useSignalR';
import { apiService } from '../services/api.service';
import { StatusReservation } from '../types';
import './routes.css';

const Navigator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [pendingNotifications, setPendingNotifications] = React.useState(0);
  const isPublicRoute =
    location.pathname.startsWith('/evento/') ||
    location.pathname.startsWith('/reserva/') ||
    location.pathname.startsWith('/suscripcion/') ||
    location.pathname.startsWith('/inicio/') ||
    location.pathname.startsWith('/onboarding/') ||
    location.pathname === '/register';

  const loadPendingNotifications = React.useCallback(async () => {
    try {
      const now = new Date();
      const dateFilter = now.toISOString().split('T')[0];
      const timeFilter = now.toTimeString().split(' ')[0].substring(0, 5);

      const [requestsResponse, suscriptionResponse, eventsResponse] = await Promise.all([
        apiService.getPendingReservations({ dateFilter, timeFilter }),
        apiService.getPendingReservationSuscription({ dateFilter, timeFilter }),
        apiService.getPendingEventReservation({ dateFilter, timeFilter }),
      ]);

      const normalRequests = requestsResponse.success && requestsResponse.data
        ? requestsResponse.data.filter(r => (
            r.chefId === null &&
            (r.statusReservation === StatusReservation.Creada ||
              r.statusReservation === StatusReservation.Reprogramada ||
              r.statusReservation === StatusReservation.ReasignacionCocinera)
          ))
        : [];

      const suscriptionRequests = suscriptionResponse.success && suscriptionResponse.data
        ? suscriptionResponse.data.filter(r => (
            r.chefId === null &&
            (r.suscriptionStatus === StatusReservation.Creada ||
              r.suscriptionStatus === StatusReservation.Reprogramada ||
              r.suscriptionStatus === StatusReservation.ReasignacionCocinera)
          ))
        : [];

      const eventRequests = eventsResponse.success && eventsResponse.data
        ? eventsResponse.data.filter(r => (
            r.chefId === null &&
            (r.statusEvent === StatusReservation.Creada ||
              r.statusEvent === StatusReservation.Reprogramada ||
              r.statusEvent === StatusReservation.ReasignacionCocinera)
          ))
        : [];

      setPendingNotifications(normalRequests.length + suscriptionRequests.length + eventRequests.length);
    } catch (error) {
      console.error('Error loading pending notifications:', error);
    }
  }, []);

  useSignalR(() => {
    void loadPendingNotifications();
  }, {
    enabled: isAuthenticated && !isPublicRoute,
    playSound: true,
    listenEvents: [
      'ReceiveNewReservation',
      'ReceiveReservationAccepted',
      'ReceiveAcceptedReservation',
      'ReservationAccepted',
    ],
    soundEvents: [
      'ReceiveReservationAccepted',
      'ReceiveAcceptedReservation',
      'ReservationAccepted',
    ],
  });

  React.useEffect(() => {
    if (!isAuthenticated || isPublicRoute) {
      setPendingNotifications(0);
      return;
    }

    void loadPendingNotifications();
    const intervalId = window.setInterval(() => {
      void loadPendingNotifications();
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, isPublicRoute, loadPendingNotifications]);

  // Wrapper para la vista pública
  const PublicReservationWrapper = () => {
    const { token } = useParams();
    return <PublicReservationScreen token={token} />;
  };

  const PublicSuscriptionWrapper = () => {
    const { token } = useParams();
    return <PublicSuscriptionScreen token={token} />;
  };

  const PublicOnboardingWrapper = () => {
    const { token } = useParams();
    return <PublicOnboardingScreen token={token} />;
  };

  const PublicEventWrapper = () => {
    const { token } = useParams();
    return <PublicEventScreen token={token} />;
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

  if (location.pathname.startsWith('/suscripcion/')) {
    return (
      <Routes>
        <Route path="/suscripcion/:token" element={<PublicSuscriptionWrapper />} />
      </Routes>
    );
  }

  // Alias para /inicio/:token -> mismo que /onboarding/:token
  if (location.pathname.startsWith('/inicio/')) {
    return (
      <Routes>
        <Route path="/inicio/:token" element={<PublicOnboardingWrapper />} />
      </Routes>
    );
  }

  // Alias para /evento/:token -> vista pública de evento
  if (location.pathname.startsWith('/evento/')) {
    return (
      <Routes>
        <Route path="/evento/:token" element={<PublicEventWrapper />} />
      </Routes>
    );
  }

  // Ruta pública para onboarding
  if (location.pathname.startsWith('/onboarding/')) {
    return (
      <Routes>
        <Route path="/onboarding/:token" element={<PublicOnboardingWrapper />} />
      </Routes>
    );
  }

  // Ruta pública para registro
  if (location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/register" element={<RegisterScreen />} />
      </Routes>
    );
  }

  const getCurrentRoute = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'Home';
    if (path === '/reservation') {
      const tabFromQuery = new URLSearchParams(location.search).get('tab');
      return tabFromQuery === 'requests' ? 'Requests' : 'Reservation';
    }
    if (
      path.startsWith('/reservation/') ||
      path.startsWith('/reservation-suscription/') ||
      path.startsWith('/reservation-event/') ||
      path.startsWith('/reservation-diet/') ||
      path.startsWith('/reservation-service-task/')
    ) {
      return location.state?.isRequest ? 'Requests' : 'Reservation';
    }
    if (path === '/availability') return 'Availability';
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
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Header 
        showMenu={true} 
        onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
        notificationCount={pendingNotifications}
        onNotificationPress={() => {
          setIsSidebarOpen(false);
          navigate('/reservation', { state: { defaultTab: 'requests' } });
        }}
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
            <Route path="/availability" element={<AvailabilityScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/reservation/:id" element={<ReservationDetailScreen />} />
            <Route path="/reservation-suscription/:id" element={<ReservationSuscriptionDetailScreen />} />
            <Route path="/reservation-event/:id" element={<ReservationEventDetailScreen />} />
            <Route path="/reservation-diet/:id" element={<ReservationDietDetailScreen />} />
            <Route path="/reservation-service-task/:id" element={<ReservationServiceTaskDetailScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

export default Navigator;