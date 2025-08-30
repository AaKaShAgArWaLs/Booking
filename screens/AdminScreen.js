import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const AdminScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage bookings and hall settings</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.comingSoon}>🚧 Coming Soon</Text>
        <Text style={styles.description}>
          Admin features will include:
        </Text>
        <Text style={styles.feature}>• View all booking requests</Text>
        <Text style={styles.feature}>• Approve/reject bookings</Text>
        <Text style={styles.feature}>• Manage hall availability</Text>
        <Text style={styles.feature}>• Generate reports</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 48,
    marginBottom: 20,
  },
  description: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  feature: {
    ...typography.body,
    color: colors.textLight,
    marginVertical: 4,
  },
});

export default AdminScreen;