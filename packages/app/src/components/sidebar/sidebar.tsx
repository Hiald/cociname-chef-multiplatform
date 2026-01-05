import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { spacing } from '../../styles';
import { Home, Reservation, Profile } from '../../assets/svgs';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  currentRoute: 'Home' | 'Reservation' | 'Profile';
  onNavigate: (route: 'Home' | 'Reservation' | 'Profile') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentRoute, onNavigate }) => {
  const { logout } = useAuth();
  const sidebarWidth = isOpen ? 280 : 0;

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
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}></Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            Chef
          </Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => onNavigate(item.id as SidebarProps['currentRoute'])}
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

        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}> Cerrar sesi�n</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'web' ? '100vh' : '100%',
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF5136',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  avatarText: {
    fontSize: 36,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1F24',
    textAlign: 'center',
  },
  menuSection: {
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.small,
  },
  menuItem: {
    paddingHorizontal: spacing.medium,
    paddingVertical: 14,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#d9dbf1',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  iconContainerActive: {
    backgroundColor: '#FFFFFF',
  },
  iconEmoji: {
    fontSize: 20,
  },
  menuItemText: {
    fontSize: 15,
    color: '#56688a',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  menuItemTextActive: {
    color: '#1e2133',
    fontWeight: '700',
  },
  logoutSection: {
    padding: spacing.medium,
    marginTop: 'auto',
  },
  logoutButton: {
    padding: spacing.medium,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
});

export default Sidebar;
