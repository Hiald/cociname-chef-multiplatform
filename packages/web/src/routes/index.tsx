import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import LoginScreen from '@anilist-fe/app/src/screens/login';
import HomeScreen from '@anilist-fe/app/src/screens/home';
import { useAuth } from '@anilist-fe/app/src/hooks/useAuth';

const Navigator: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
        <ActivityIndicator size="large" color="#FF5136" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: '100vh' }}>
      {isAuthenticated ? <HomeScreen /> : <LoginScreen />}
    </View>
  );
};

export default Navigator;