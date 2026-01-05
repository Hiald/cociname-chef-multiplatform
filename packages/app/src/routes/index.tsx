import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/login';
import RegisterScreen from '../screens/register';
import { BottomTabs } from '../components/bottom-tabs';
import { RootStackParamList } from '../types';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, Text } from 'react-native';

const Stack = createStackNavigator<RootStackParamList>();

const Navigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF5136" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <Stack.Screen name="MainTabs" component={BottomTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigator;