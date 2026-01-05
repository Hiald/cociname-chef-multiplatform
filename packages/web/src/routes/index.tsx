import * as React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import LoginScreen from '@anilist-fe/app/src/screens/login';
import HomeScreen from '@anilist-fe/app/src/screens/home';
import ReservationScreen from '@anilist-fe/app/src/screens/reservation';
import ProfileScreen from '@anilist-fe/app/src/screens/profile';
import { useAuth } from '@anilist-fe/app/src/hooks/useAuth';
import { Header } from '@anilist-fe/app/src/components/header';
import { Sidebar } from '@anilist-fe/app/src/components/sidebar';

type RouteType = 'Home' | 'Reservation' | 'Profile';

const Navigator: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [currentRoute, setCurrentRoute] = React.useState<RouteType>('Home');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5136" />
        <Text style={styles.loadingText}>Cargando...</Text>
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
        return <HomeScreen />;
      case 'Reservation':
        return <ReservationScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        onMenuPress={() => setIsSidebarOpen(!isSidebarOpen)}
        showMenu={true}
      />
      <View style={styles.mainContainer}>
        <Sidebar 
          isOpen={isSidebarOpen}
          currentRoute={currentRoute}
          onNavigate={setCurrentRoute}
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
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    overflow: 'scroll',
  },
});

export default Navigator;