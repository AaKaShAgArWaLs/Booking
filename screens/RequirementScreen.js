import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import bookingAPI from '../services/bookingApi';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { globalStyles } from '../styles/globalStyles';
import { useBooking } from '../context/BookingContext';

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

export default function RequirementScreen({ navigation }) {
  const { selectedHall, selectedTimeSlots, updateForm, bookingForm, selectedDate } = useBooking();
  const [formData, setFormData] = useState({
    name: bookingForm.name || '',
    email: bookingForm.email || '',
    phone: bookingForm.phone || '',
    organization: bookingForm.organization || '',
    eventTitle: bookingForm.eventTitle || '',
    description: bookingForm.description || '',
    attendees: bookingForm.attendees || '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const { name, email, phone, eventTitle, attendees } = formData;
    
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return false;
    }
    
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number');
      return false;
    }
    
    if (!eventTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter the event title');
      return false;
    }
    
    if (!attendees.trim() || isNaN(attendees) || parseInt(attendees) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid number of attendees');
      return false;
    }
    
    if (parseInt(attendees) > selectedHall.capacity) {
      Alert.alert('Capacity Exceeded', `Maximum capacity for ${selectedHall.name} is ${selectedHall.capacity} people`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    console.log('=== HANDLE SUBMIT STARTED ===');
    console.log('Form validation started...');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, setting loading to true');
    setLoading(true);
    updateForm(formData);
    
    try {
      // Use the first selected time slot for API submission
      const primaryTimeSlot = selectedTimeSlots[0];
      
      const bookingData = {
        hall_id: selectedHall.id,
        time_slot_id: primaryTimeSlot.id,
        booking_date: selectedDate || new Date().toISOString().split('T')[0],
        requester_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        organization: formData.organization || null,
        event_title: formData.eventTitle,
        purpose: formData.description || null,
        attendees: parseInt(formData.attendees),
        notes: `Event: ${formData.eventTitle}${formData.description ? ` - ${formData.description}` : ''}`,
        status: 'pending'
      };
      
      console.log('=== BOOKING SUBMISSION DEBUG ===');
      console.log('Selected Hall:', selectedHall);
      console.log('Selected Time Slots:', selectedTimeSlots);
      console.log('Primary Time Slot:', primaryTimeSlot);
      console.log('Selected Date:', selectedDate);
      console.log('Form Data:', formData);
      console.log('Final Booking Data:', JSON.stringify(bookingData, null, 2));
      console.log('API URL:', 'http://127.0.0.1:5000/api/bookings');
      console.log('================================');
      
      const response = await bookingAPI.submitBooking(bookingData);
      
      if (response.success) {
        const confirmationData = {
          ...formData,
          hall: selectedHall,
          timeSlots: selectedTimeSlots,
          timeSlot: selectedTimeSlots.map(slot => slot.time).join(', '),
          booking_id: response.data?.booking_id || response.booking_id,
          bookingId: response.data?.booking_id || response.booking_id,
          booking_date: selectedDate,
          selectedDate: selectedDate,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        };
        
        navigation.navigate('Confirmation', { booking: confirmationData });
        Alert.alert('Success', 'Booking request submitted successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to submit booking request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      Alert.alert('Error', 'Unable to submit booking request. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedHall || !selectedTimeSlots || selectedTimeSlots.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Please select a hall and time slot first</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backButtonText}>Go Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Event Requirements</Text>
            <View style={[globalStyles.card, styles.bookingSummary]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate ? (() => {
                    try {
                      return new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    } catch (error) {
                      console.error('Date formatting error:', error);
                      return selectedDate;
                    }
                  })() : 'Not selected'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hall:</Text>
                <Text style={styles.summaryValue}>{selectedHall.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>
                  {selectedTimeSlots.map(slot => slot.time).join(', ')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Location:</Text>
                <Text style={styles.summaryValue}>{selectedHall.location}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Capacity:</Text>
                <Text style={styles.summaryValue}>{selectedHall.capacity} people</Text>
              </View>
            </View>
          </View>

          <View style={styles.form}>
            {isLargeScreen ? (
              // Two-column layout for large screens
              <>
                <View style={styles.formRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Full Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(value) => handleInputChange('name', value)}
                      placeholder="Enter your full name"
                      autoCapitalize="words"
                      placeholderTextColor={colors.lightGray}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Email Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(value) => handleInputChange('email', value)}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={colors.lightGray}
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(value) => handleInputChange('phone', value)}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor={colors.lightGray}
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Event Title *</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.eventTitle}
                      onChangeText={(value) => handleInputChange('eventTitle', value)}
                      placeholder="Enter event title"
                      autoCapitalize="words"
                      placeholderTextColor={colors.lightGray}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Number of Attendees *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.attendees}
                    onChangeText={(value) => handleInputChange('attendees', value)}
                    placeholder={`Max ${selectedHall.capacity} people`}
                    keyboardType="numeric"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Event Requirements</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Brief description of your event (optional)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>
              </>
            ) : (
              // Single column layout for smaller screens
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    placeholder="Enter your full name"
                    autoCapitalize="words"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Event Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.eventTitle}
                    onChangeText={(value) => handleInputChange('eventTitle', value)}
                    placeholder="Enter event title"
                    autoCapitalize="words"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Number of Attendees *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.attendees}
                    onChangeText={(value) => handleInputChange('attendees', value)}
                    placeholder={`Max ${selectedHall.capacity} people`}
                    keyboardType="numeric"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Event Requirements</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="Brief description of your event (optional)"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={colors.lightGray}
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={() => {
              console.log('Submit button pressed!');
              Alert.alert('Button Test', 'Button is clickable!');
              handleSubmit();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Booking Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: getResponsiveValue(16, 20, 32),
    paddingBottom: getResponsiveValue(8, 10, 16),
  },
  title: {
    fontSize: getResponsiveValue(20, 24, 28),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveValue(12, 16, 20),
    textAlign: 'center',
  },
  bookingSummary: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  form: {
    paddingHorizontal: getResponsiveValue(16, 20, 32),
    maxWidth: isLargeScreen ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: getResponsiveValue(6, 8, 10),
    padding: getResponsiveValue(10, 12, 16),
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    minHeight: getResponsiveValue(44, 48, 52),
  },
  textArea: {
    height: getResponsiveValue(80, 100, 120),
    paddingTop: getResponsiveValue(10, 12, 16),
    textAlignVertical: 'top',
  },
  footer: {
    padding: getResponsiveValue(16, 20, 32),
    paddingTop: getResponsiveValue(8, 10, 16),
  },
  submitButton: {
    backgroundColor: colors.success,
    paddingVertical: getResponsiveValue(14, 16, 20),
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadow,
    minHeight: getResponsiveValue(48, 52, 60),
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: getResponsiveValue(16, 18, 20),
    fontWeight: 'bold',
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
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: '600',
  },
});