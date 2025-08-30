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
  Platform
} from 'react-native';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { globalStyles } from '../styles/globalStyles';
import { useBooking } from '../context/BookingContext';

export default function RequirementScreen({ navigation }) {
  const { selectedHall, selectedTimeSlots, updateForm, bookingForm } = useBooking();
  const [formData, setFormData] = useState({
    name: bookingForm.name || '',
    email: bookingForm.email || '',
    phone: bookingForm.phone || '',
    organization: bookingForm.organization || '',
    eventTitle: bookingForm.eventTitle || '',
    description: bookingForm.description || '',
    attendees: bookingForm.attendees || '',
  });

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

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    updateForm(formData);
    
    const bookingData = {
      ...formData,
      hall: selectedHall,
      timeSlots: selectedTimeSlots,
      bookingId: `BK${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    
    navigation.navigate('Confirmation', { booking: bookingData });
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
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Booking Request</Text>
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 16,
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
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    ...typography.body,
    color: colors.text,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
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
    ...globalStyles.shadow,
  },
  submitButtonText: {
    color: colors.white,
    ...typography.body,
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