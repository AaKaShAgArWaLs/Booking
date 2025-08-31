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
  ActivityIndicator
} from 'react-native';
import bookingAPI from '../services/bookingApi';

export default function BookingFormScreen({ route, navigation }) {
  const { hall, timeSlot, selectedDate } = route.params;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventTitle: '',
    description: '',
    attendees: '',
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
    
    if (parseInt(attendees) > hall.capacity) {
      Alert.alert('Capacity Exceeded', `Maximum capacity for ${hall.name} is ${hall.capacity} people`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const bookingData = {
        hall_id: hall.id,
        time_slot_id: timeSlot.id || timeSlot.slot_id,
        booking_date: typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0],
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
      
      console.log('Submitting booking data:', bookingData);
      const response = await bookingAPI.submitBooking(bookingData);
      
      if (response.success) {
        const confirmationData = {
          ...formData,
          hall,
          timeSlot: timeSlot.start_time && timeSlot.end_time ? `${timeSlot.start_time} - ${timeSlot.end_time}` : timeSlot,
          booking_id: response.data?.booking_id || response.booking_id,
          bookingId: response.data?.booking_id || response.booking_id,
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Booking Details</Text>
            <View style={styles.bookingSummary}>
              <Text style={styles.summaryText}>Hall: {hall.name}</Text>
              <Text style={styles.summaryText}>Time: {timeSlot}</Text>
              <Text style={styles.summaryText}>Capacity: {hall.capacity} people</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter your full name"
                autoCapitalize="words"
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization</Text>
              <TextInput
                style={styles.input}
                value={formData.organization}
                onChangeText={(value) => handleInputChange('organization', value)}
                placeholder="Enter your organization (optional)"
                autoCapitalize="words"
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
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Number of Attendees *</Text>
              <TextInput
                style={styles.input}
                value={formData.attendees}
                onChangeText={(value) => handleInputChange('attendees', value)}
                placeholder={`Max ${hall.capacity} people`}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Brief description of your event (optional)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Booking Request</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  bookingSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  summaryText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});