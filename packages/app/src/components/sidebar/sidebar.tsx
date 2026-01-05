import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { spacing } from '../../styles';
import { Home, Reservation, Profile } from '../../assets/svgs';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  currentRoute: 'Home' | 'Reservation' | 'Profile';
  onNavigate: (route: 'Home' | 'Reservation' | 'Profile') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentRoute, onNavigate }) => {
  const { chefData, logout } = useAuth();
  const sidebarWidth = isOpen ? 250 : 0;

  const menuItems = [
    { id: 'Home', label: 'Inicio', Icon: Home },
    { id: 'Reservation', label: 'Reservas', Icon: Reservation },
    { id: 'Profile', label: 'Perfil', Icon: Profile },
  ];

  const handleLogout = async () => {
    await logout();
  };

  if (!isOpen) return null;

  return (
    <View style={[styles.container, { width: sidebarWidth }]}>
      <ScrollView style={styles.scrollView}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍🍳</Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            Chef
          </Text>
        </View>

        {/* Navigation Menu */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => onNavigate(item.id as any)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                    <item.Icon />
                  </View>
                  <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1F24',
    height: '100vh',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF5136',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  avatarText: {
    fontSize: 32,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  menuSection: {
    paddingVertical: spacing.medium,
  },
  menuItem: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    marginHorizontal: spacing.small,
    marginBottom: spacing.tiny,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255, 81, 54, 0.15)',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.small,
  },
  iconContainerActive: {
    backgroundColor: '#FF5136',
  },
  menuItemText: {
    fontSize: 14,
    color: '#B8BFC4',
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutSection: {
    padding: spacing.medium,
    marginTop: 'auto',
  },
  logoutButton: {
    padding: spacing.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default Sidebar;
