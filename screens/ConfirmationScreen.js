import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
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

export default function ConfirmationScreen({ route, navigation }) {
  const { booking: initialBooking } = route.params;
  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have a booking ID, fetch the latest details from backend
    if (initialBooking?.bookingId) {
      fetchBookingDetails(initialBooking.bookingId);
    }
  }, [initialBooking?.bookingId]);

  const fetchBookingDetails = async (bookingId) => {
    try {
      setLoading(true);
      const response = await bookingAPI.getBookingDetails(bookingId);
      if (response.success) {
        setBooking(response.data);
      } else {
        Alert.alert('Error', 'Failed to load booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Unable to load latest booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleNewBooking = () => {
    navigation.navigate('Home');
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBookingDate = (booking) => {
    // Try to get the booking date from various possible fields
    const bookingDateStr = booking.booking_date || booking.selectedDate || booking.date;
    
    if (bookingDateStr) {
      try {
        const date = new Date(bookingDateStr);
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (error) {
        console.error('Error formatting booking date:', error);
        return bookingDateStr;
      }
    }
    
    return 'Date not specified';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#27ae60" />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleNewBooking}>
            <Text style={styles.backButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✅</Text>
          </View>
          <Text style={styles.title}>Booking Request Submitted Successfully!</Text>
          <Text style={styles.subtitle}>
            Thank you for your submission. Your booking request has been received and is now pending approval.
          </Text>
          <View style={styles.bookingIdContainer}>
            <Text style={styles.bookingIdLabel}>Booking Reference</Text>
            <Text style={styles.bookingIdValue}>#{booking.booking_id || booking.bookingId}</Text>
          </View>
        </View>

        {isLargeScreen ? (
          // Two-column layout for large screens
          <View style={styles.twoColumnContainer}>
            <View style={styles.leftColumn}>
              <View style={styles.bookingDetails}>
                <Text style={styles.sectionTitle}>Booking Details</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking ID:</Text>
                  <Text style={styles.detailValue}>{booking.booking_id || booking.bookingId}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Pending Approval</Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted:</Text>
                  <Text style={styles.detailValue}>{formatDate(booking.submittedAt)}</Text>
                </View>
              </View>

              <View style={styles.eventDetails}>
                <Text style={styles.sectionTitle}>Event Information</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking Date:</Text>
                  <Text style={styles.detailValue}>{formatBookingDate(booking)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hall:</Text>
                  <Text style={styles.detailValue}>{booking.hall.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{booking.hall.location}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time Slot:</Text>
                  <Text style={styles.detailValue}>{booking.timeSlot}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Event Title:</Text>
                  <Text style={styles.detailValue}>{booking.eventTitle}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Attendees:</Text>
                  <Text style={styles.detailValue}>{booking.attendees} people</Text>
                </View>
                
                {booking.organization && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Organization:</Text>
                    <Text style={styles.detailValue}>{booking.organization}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={styles.contactDetails}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{booking.name}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{booking.email}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={styles.detailValue}>{booking.phone}</Text>
                </View>
              </View>

              {booking.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.sectionTitle}>Event Description</Text>
                  <Text style={styles.descriptionText}>{booking.description}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          // Single column layout for smaller screens
          <>
            <View style={styles.bookingDetails}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking ID:</Text>
                <Text style={styles.detailValue}>{booking.booking_id || booking.bookingId}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending Approval</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Submitted:</Text>
                <Text style={styles.detailValue}>{formatDate(booking.submittedAt)}</Text>
              </View>
            </View>

            <View style={styles.eventDetails}>
              <Text style={styles.sectionTitle}>Event Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Booking Date:</Text>
                <Text style={styles.detailValue}>{formatBookingDate(booking)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hall:</Text>
                <Text style={styles.detailValue}>{booking.hall.name}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{booking.hall.location}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Slot:</Text>
                <Text style={styles.detailValue}>{booking.timeSlot}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Event Title:</Text>
                <Text style={styles.detailValue}>{booking.eventTitle}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Attendees:</Text>
                <Text style={styles.detailValue}>{booking.attendees} people</Text>
              </View>
              
              {booking.organization && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Organization:</Text>
                  <Text style={styles.detailValue}>{booking.organization}</Text>
                </View>
              )}
            </View>

            <View style={styles.contactDetails}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{booking.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{booking.email}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{booking.phone}</Text>
              </View>
            </View>

            {booking.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Event Description</Text>
                <Text style={styles.descriptionText}>{booking.description}</Text>
              </View>
            )}
          </>
        )}


        <View style={styles.nextSteps}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <Text style={styles.nextStepText}>
            • You will receive a confirmation email shortly
          </Text>
          <Text style={styles.nextStepText}>
            • Admin will review your request within 24 hours
          </Text>
          <Text style={styles.nextStepText}>
            • You'll be notified via email about the approval status
          </Text>
          <Text style={styles.nextStepText}>
            • For urgent requests, contact admin directly
          </Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.newBookingButton} onPress={handleNewBooking}>
        <Text style={styles.newBookingButtonText}>Make Another Booking</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: getResponsiveValue(16, 20, 32),
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(24, 32, 40),
    backgroundColor: colors.white,
    padding: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(12, 16, 20),
    ...globalStyles.shadow,
  },
  successIconContainer: {
    backgroundColor: colors.success + '20',
    width: getResponsiveValue(80, 100, 120),
    height: getResponsiveValue(80, 100, 120),
    borderRadius: getResponsiveValue(40, 50, 60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  successIcon: {
    fontSize: getResponsiveValue(36, 48, 60),
  },
  title: {
    fontSize: getResponsiveValue(18, 22, 28),
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveValue(8, 12, 16),
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: getResponsiveValue(20, 22, 26),
    maxWidth: isLargeScreen ? 600 : '100%',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  bookingIdContainer: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingVertical: getResponsiveValue(8, 12, 16),
    borderRadius: getResponsiveValue(8, 10, 12),
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  bookingIdLabel: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  bookingIdValue: {
    fontSize: getResponsiveValue(16, 18, 20),
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Two-column layout styles
  twoColumnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 16,
  },
  bookingDetails: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    ...globalStyles.shadow,
  },
  eventDetails: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...globalStyles.shadow,
  },
  contactDetails: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
    ...globalStyles.shadow,
  },
  descriptionSection: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...globalStyles.shadow,
  },
  nextSteps: {
    backgroundColor: colors.primary + '10',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...globalStyles.shadow,
  },
  sectionTitle: {
    fontSize: getResponsiveValue(16, 18, 22),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  detailRow: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isSmallScreen ? 'flex-start' : 'center',
    marginBottom: getResponsiveValue(10, 12, 16),
  },
  detailLabel: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: colors.textLight,
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? 4 : 0,
  },
  detailValue: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: colors.text,
    fontWeight: '500',
    flex: isSmallScreen ? 0 : 2,
    textAlign: isSmallScreen ? 'left' : 'right',
  },
  statusBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    paddingVertical: getResponsiveValue(3, 4, 6),
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: getResponsiveValue(11, 12, 14),
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: colors.text,
    lineHeight: getResponsiveValue(18, 20, 24),
  },
  nextStepText: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: colors.text,
    marginBottom: getResponsiveValue(6, 8, 10),
    lineHeight: getResponsiveValue(18, 20, 24),
  },
  newBookingButton: {
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveValue(14, 16, 20),
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    marginTop: getResponsiveValue(12, 16, 20),
    minHeight: getResponsiveValue(48, 52, 60),
    ...globalStyles.shadow,
  },
  newBookingButtonText: {
    color: colors.white,
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: getResponsiveValue(16, 18, 20),
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    ...globalStyles.shadow,
  },
  backButtonText: {
    color: colors.white,
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: 'bold',
  },
});