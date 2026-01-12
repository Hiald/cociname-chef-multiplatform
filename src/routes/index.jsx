import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from '../screens/login';
import ReservationDetailScreen from '../screens/reservationDetail';
import HomeScreen from '../screens/home';
import ReservationScreen from '../screens/reservation';
import ProfileScreen from '../screens/profile';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';
import BottomTabs from '../components/bottom-tabs/bottom-tabs';
import { useAuth } from '../hooks/useAuth';
import './routes.css';

const Navigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [currentRoute, setCurrentRoute] = React.useState('Home');

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
          currentRoute={currentRoute}
          onNavigate={(route) => {
            setCurrentRoute(route);
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