import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../../screens/home';
import ReservationScreen from '../../screens/reservation';
import ProfileScreen from '../../screens/profile';
import { Home, Reservation, Profile } from '../../assets/svgs';
import { Header } from '../header';

const Tab = createBottomTabNavigator();

const BottomTabs: React.FC = () => {
  return (
    <>
      <Header showMenu={false} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#FF5136',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Inicio',
            tabBarIcon: ({ color, size }) => (
              <View style={styles.iconWrapper}>
                <Home width={size} height={size} fill={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Reservation"
          component={ReservationScreen}
          options={{
            tabBarLabel: 'Reservas',
            tabBarIcon: ({ color, size }) => (
              <View style={styles.iconWrapper}>
                <Reservation width={size} height={size} fill={color} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <View style={styles.iconWrapper}>
                <Profile width={size} height={size} fill={color} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBarIcon: {
    marginBottom: -4,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomTabs;
