import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, spacing } from '../styles';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil - Cociname Chef</Text>
      <Text style={styles.subtitle}>Tu perfil de cocinero</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: color.background,
    padding: spacing.large,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: color.text,
    marginBottom: spacing.medium,
  },
  subtitle: {
    fontSize: 16,
    color: color.dim,
  },
});

export default ProfileScreen;
