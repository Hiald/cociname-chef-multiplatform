import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { spacing, color } from '../../styles';
import { images } from '../../assets/images';

interface HeaderProps {
  onMenuPress?: () => void;
  showMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuPress, showMenu = true }) => {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showMenu && onMenuPress && (
          <TouchableOpacity 
            onPress={onMenuPress} 
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View style={styles.menuIcon}>
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
              <View style={styles.menuLine} />
            </View>
          </TouchableOpacity>
        )}
        
        <Image 
          source={images.logo}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    padding: spacing.small,
    marginRight: spacing.small,
  },
  menuIcon: {
    width: 24,
    height: 24,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 24,
    height: 3,
    backgroundColor: '#1A1F24',
    borderRadius: 2,
  },
  logo: {
    width: 120,
    height: 30,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: spacing.small,
  },
  notificationIcon: {
    fontSize: 20,
  },
});

export default Header;
