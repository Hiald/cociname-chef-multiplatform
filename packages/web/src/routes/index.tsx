import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '@anilist-fe/app/src/screens/login';
import RegisterScreen from '@anilist-fe/app/src/screens/register';
import HomeScreen from '@anilist-fe/app/src/screens/home';
import ReservationScreen from '@anilist-fe/app/src/screens/reservation';
import ProfileScreen from '@anilist-fe/app/src/screens/profile';
import { RootStackParamList } from '@anilist-fe/app/src/types';

const Stack = createStackNavigator<RootStackParamList>();

const Navigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default Navigator;