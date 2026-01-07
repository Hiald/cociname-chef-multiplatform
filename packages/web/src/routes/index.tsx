import * as React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from '@anilist-fe/app/src/screens/login';
import HomeScreen from '@anilist-fe/app/src/screens/home';
import ReservationScreen from '@anilist-fe/app/src/screens/reservation';
import ProfileScreen from '@anilist-fe/app/src/screens/profile';
import ReservationDetailScreen from '@anilist-fe/app/src/screens/reservationDetail';
import { PublicReservationScreen } from '@anilist-fe/app/src/screens/public-reservation';
import { useAuth } from '@anilist-fe/app/src/hooks/useAuth';
import { Header } from '@anilist-fe/app/src/components/header';
import { Sidebar } from '@anilist-fe/app/src/components/sidebar';
import WebBottomTabs from '../components/web-bottom-tabs';

type MainRouteType = 'Home' | 'Reservation' | 'Profile';
type RouteType = MainRouteType | 'ReservationDetail' | 'PublicReservation';

interface ReservationDetailParams {
  reservationId: number;
  isActive?: boolean;
}

interface WebNavigation {
  navigate: (routeName: string, params?: ReservationDetailParams) => void;
  goBack: () => void;
}

const Navigator: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState<RouteType>('Home');
  const [reservationDetailParams, setReservationDetailParams] = React.useState<ReservationDetailParams | null>(null);
  const [publicToken, setPublicToken] = React.useState<string | null>(null);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Detectar ruta de URL al cargar
  React.useEffect(() => {
    const checkPublicRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      
      // Detectar /reserva/:token en la URL
      const reservaMatch = path.match(/\/reserva\/([^/]+)/);
      if (reservaMatch) {
        const token = reservaMatch[1];
        console.log('Ruta pública detectada con token:', token);
        setPublicToken(token);
        setCurrentRoute('PublicReservation');
        return;
      }

      // También soportar hash routing: #/reserva/:token
      const hashReservaMatch = hash.match(/#\/reserva\/([^/]+)/);
      if (hashReservaMatch) {
        const token = hashReservaMatch[1];
        console.log('Ruta pública detectada en hash con token:', token);
        setPublicToken(token);
        setCurrentRoute('PublicReservation');
        return;
      }
    };

    checkPublicRoute();

    // Escuchar cambios en la URL
    const handlePopState = () => {
      checkPublicRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // Crear objeto de navegación personalizado para web
  const webNavigation: WebNavigation = React.useMemo(() => ({
    navigate: (routeName: string, params?: ReservationDetailParams) => {
      if (routeName === 'ReservationDetail') {
        setReservationDetailParams(params || null);
        setCurrentRoute('ReservationDetail');
      } else {
        setCurrentRoute(routeName as RouteType);
      }
    },
    goBack: () => {
      setCurrentRoute('Home');
      setReservationDetailParams(null);
    },
  }), []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Permitir acceso a ruta pública sin autenticación
  if (currentRoute === 'PublicReservation' && publicToken) {
    return (
      <View style={styles.fullScreen}>
        <PublicReservationScreen token={publicToken} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.fullScreen}>
        <LoginScreen />
      </View>
    );
  }

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case 'Home':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <HomeScreen navigation={webNavigation as unknown as any} />;
      case 'Reservation':
        return <ReservationScreen />;
      case 'Profile':
        return <ProfileScreen />;
      case 'ReservationDetail':
        return reservationDetailParams ? (
          <ReservationDetailScreen 
            route={{ params: reservationDetailParams }} 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            navigation={webNavigation as unknown as any}
          />
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) : <HomeScreen navigation={webNavigation as unknown as any} />;
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <HomeScreen navigation={webNavigation as unknown as any} />;
    }
  };

  if (isMobile) {
    return (
      <View style={styles.container}>
        <Header showMenu={false} />
        <View style={styles.contentContainer}>
          {renderCurrentScreen()}
        </View>
        <WebBottomTabs 
          currentRoute={currentRoute === 'ReservationDetail' ? 'Home' : currentRoute as MainRouteType} 
          onNavigate={(route) => {
            setCurrentRoute(route);
            setReservationDetailParams(null);
          }} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenu={true}
      />
      <View style={styles.mainContainer}>
        <Sidebar 
          isOpen={isSidebarOpen}
          currentRoute={currentRoute === 'ReservationDetail' ? 'Home' : currentRoute as MainRouteType}
          onNavigate={(route) => {
            setCurrentRoute(route);
            setReservationDetailParams(null);
          }}
        />
        <View style={styles.contentContainer}>
          {renderCurrentScreen()}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: '100vh',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  fullScreen: {
    flex: 1,
    minHeight: '100vh',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});

export default Navigator;