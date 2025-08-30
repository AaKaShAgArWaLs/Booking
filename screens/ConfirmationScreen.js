import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function ConfirmationScreen({ route, navigation }) {
  const { booking } = route.params;

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

        <View style={styles.bookingDetails}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>{booking.bookingId}</Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  bookingDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
  nextStepText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  newBookingButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  newBookingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});