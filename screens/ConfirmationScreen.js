import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
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
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>Booking Request Submitted!</Text>
          <Text style={styles.subtitle}>
            Your booking request has been sent to the admin for approval
          </Text>
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
                  <Text style={styles.detailLabel}>Hall:</Text>
                  <Text style={styles.detailValue}>{booking.hall.name}</Text>
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
                <Text style={styles.detailLabel}>Hall:</Text>
                <Text style={styles.detailValue}>{booking.hall.name}</Text>
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
    backgroundColor: '#f5f5f5',
    padding: getResponsiveValue(16, 20, 32),
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(24, 32, 40),
  },
  successIcon: {
    fontSize: getResponsiveValue(48, 64, 80),
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  title: {
    fontSize: getResponsiveValue(20, 24, 32),
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: getResponsiveValue(6, 8, 12),
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveValue(20, 22, 26),
    maxWidth: isLargeScreen ? 600 : '100%',
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
    backgroundColor: 'white',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventDetails: {
    backgroundColor: 'white',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactDetails: {
    backgroundColor: 'white',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionSection: {
    backgroundColor: 'white',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextSteps: {
    backgroundColor: '#e8f4fd',
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(16, 20, 24),
    marginBottom: getResponsiveValue(12, 16, 20),
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  sectionTitle: {
    fontSize: getResponsiveValue(16, 18, 22),
    fontWeight: 'bold',
    color: '#2c3e50',
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
    color: '#666',
    flex: isSmallScreen ? 0 : 1,
    marginBottom: isSmallScreen ? 4 : 0,
  },
  detailValue: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: '#2c3e50',
    fontWeight: '500',
    flex: isSmallScreen ? 0 : 2,
    textAlign: isSmallScreen ? 'left' : 'right',
  },
  statusBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: getResponsiveValue(8, 12, 16),
    paddingVertical: getResponsiveValue(3, 4, 6),
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: getResponsiveValue(11, 12, 14),
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: '#2c3e50',
    lineHeight: getResponsiveValue(18, 20, 24),
  },
  nextStepText: {
    fontSize: getResponsiveValue(13, 14, 16),
    color: '#2c3e50',
    marginBottom: getResponsiveValue(6, 8, 10),
    lineHeight: getResponsiveValue(18, 20, 24),
  },
  newBookingButton: {
    backgroundColor: '#3498db',
    paddingVertical: getResponsiveValue(14, 16, 20),
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    marginTop: getResponsiveValue(12, 16, 20),
    minHeight: getResponsiveValue(48, 52, 60),
  },
  newBookingButtonText: {
    color: 'white',
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
    color: '#666',
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
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: 'bold',
  },
});