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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { useBooking } from '../context/BookingContext';
import bookingAPI from '../services/bookingApi';

const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const isTablet = width >= 768;
const isLargeScreen = width >= 1024;
const isSmallScreen = width < 400;

// Responsive helper functions
const getResponsiveValue = (small, medium, large) => {
  if (isLargeScreen) return large;
  if (isTablet) return medium;
  return small;
};

const getHallCardWidth = () => {
  if (isLargeScreen) return (width - 80) / 2; // 2 columns on large screens
  return width - 40; // Single column on smaller screens
};

const HomeScreen = ({ navigation }) => {
  const { selectHall } = useBooking();
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHalls();
  }, []);

  const loadHalls = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
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
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleHallSelect = (hall) => {
    if (!hall.isAvailable) {
      Alert.alert(
        "Hall Unavailable", 
        `${hall.name} is currently unavailable for booking. Please select another hall or contact admin for assistance.`
      );
      return;
    }
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
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHalls(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.title}>Seminar Hall Booking</Text>
          <Text style={styles.subtitle}>Choose your perfect venue</Text>
        </View>

        <View style={[styles.hallsContainer, isLargeScreen && styles.hallsContainerLarge]}>
          {halls && halls.length > 0 ? (
            halls.map((hall) => (
              <TouchableOpacity
                key={hall.id}
                style={[
                  globalStyles.card, 
                  styles.hallCard,
                  isLargeScreen && { width: getHallCardWidth(), marginHorizontal: 10 }
                ]}
                onPress={() => handleHallSelect(hall)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.hallIcon}>
                    <Text style={styles.hallIconText}>🏛️</Text>
                  </View>
                  <View style={styles.hallInfo}>
                    <Text style={styles.hallName}>{hall.name}</Text>
                    <Text style={styles.hallLocation}>📍 {hall.location}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    hall.isAvailable ? styles.availableStatusBadge : styles.unavailableStatusBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      hall.isAvailable ? styles.availableStatusText : styles.unavailableStatusText
                    ]}>
                      {hall.isAvailable ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>

                <View style={styles.capacitySection}>
                  <View style={styles.capacityItem}>
                    <Text style={styles.capacityIcon}>👥</Text>
                    <Text style={styles.capacityText}>{hall.capacity}</Text>
                    <Text style={styles.capacityLabel}>People</Text>
                  </View>
                </View>

                {hall.description && (
                  <View style={styles.descriptionSection}>
                    <Text style={styles.descriptionText}>{hall.description}</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={[
                    styles.tapToBook,
                    !hall.isAvailable && styles.unavailableText
                  ]}>
                    {hall.isAvailable ? 'Tap to book this hall' : 'Hall currently unavailable'}
                  </Text>
                  <Text style={[
                    styles.arrow,
                    !hall.isAvailable && styles.unavailableText
                  ]}>
                    {hall.isAvailable ? '→' : '⚠️'}
                  </Text>
                </View>
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
        <TouchableOpacity style={styles.adminButton} onPress={() => navigation.navigate('AdminLogin')}>
          <Text style={styles.adminButtonText}>🔐 Admin Login</Text>
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
    padding: getResponsiveValue(16, 20, 32),
    paddingBottom: getResponsiveValue(8, 10, 16),
    alignItems: 'center',
  },
  welcomeText: {
    ...typography.small,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: getResponsiveValue(24, 28, 32),
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  hallsContainer: {
    paddingHorizontal: getResponsiveValue(16, 20, 32),
  },
  hallsContainerLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  hallCard: {
    marginBottom: getResponsiveValue(16, 20, 24),
    borderRadius: getResponsiveValue(12, 16, 20),
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: getResponsiveValue(12, 16, 20),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  hallIcon: {
    width: getResponsiveValue(40, 50, 60),
    height: getResponsiveValue(40, 50, 60),
    borderRadius: getResponsiveValue(20, 25, 30),
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveValue(10, 12, 16),
  },
  hallIconText: {
    fontSize: getResponsiveValue(20, 24, 28),
  },
  hallInfo: {
    flex: 1,
  },
  hallName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  hallLocation: {
    ...typography.small,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  availableStatusBadge: {
    backgroundColor: colors.success,
  },
  unavailableStatusBadge: {
    backgroundColor: colors.danger,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  availableStatusText: {
    color: colors.white,
  },
  unavailableStatusText: {
    color: colors.white,
  },
  capacitySection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  capacityItem: {
    alignItems: 'center',
  },
  capacityIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  capacityText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: 'bold',
  },
  capacityLabel: {
    ...typography.caption,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  descriptionSection: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  descriptionText: {
    ...typography.small,
    color: colors.text,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tapToBook: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  arrow: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  unavailableText: {
    color: colors.textLight,
    opacity: 0.7,
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
    padding: getResponsiveValue(16, 20, 32),
    paddingTop: getResponsiveValue(8, 10, 16),
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