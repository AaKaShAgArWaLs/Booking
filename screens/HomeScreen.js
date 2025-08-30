import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { useBooking } from '../context/BookingContext';
import bookingAPI from '../services/bookingApi';

const HomeScreen = ({ navigation }) => {
  const { selectHall } = useBooking();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getHalls();
      console.log('API Response:', response);
      if (response.success) {
        console.log('Halls data:', response.data);
        setHalls(response.data);
      } else {
        Alert.alert('Error', 'Failed to load halls');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
      console.error('Error loading halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHallSelect = (hall) => {
    selectHall(hall);
    navigation.navigate('TimeSlot');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading halls...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Seminar Hall Booking</Text>
        </View>

        <View style={styles.hallsContainer}>
          {halls && halls.length > 0 ? (
            halls.map((hall) => (
              <TouchableOpacity
                key={hall.id}
                style={[globalStyles.card, styles.hallCard]}
                onPress={() => handleHallSelect(hall)}
                activeOpacity={0.8}
              >
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Hall:</Text>
                  <Text style={styles.summaryValue}>{hall.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Location:</Text>
                  <Text style={styles.summaryValue}>{hall.location}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Capacity:</Text>
                  <Text style={styles.summaryValue}>{hall.capacity} people</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status:</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>Available</Text>
                </View>
                {hall.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.summaryLabel}>Description:</Text>
                    <Text style={styles.description}>{hall.description}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No halls available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
    marginTop: 10,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  hallsContainer: {
    paddingHorizontal: 20,
  },
  hallCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textLight,
    flex: 1,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  description: {
    ...typography.body,
    color: colors.text,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    ...typography.h3,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    ...globalStyles.shadow,
  },
  submitButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
  adminButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: '600',
  },
});

export default HomeScreen;