import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { useBooking } from '../context/BookingContext';
import CustomCheckbox from '../components/CustomCheckbox';
import CustomButton from '../components/CustomButton';
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

const TimeSlotScreen = ({ navigation }) => {
  const { 
    selectedHall, 
    selectedTimeSlots, 
    toggleTimeSlot,
    bookingForm,
    selectDate
  } = useBooking();
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUserIdentification, setShowUserIdentification] = useState(false);
  const [tempUserData, setTempUserData] = useState({ email: '', phone: '' });

  useEffect(() => {
    if (!selectedHall) {
      Alert.alert('Error', 'Please select a hall first', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
      return;
    }
    
    // Initialize context with today's date
    selectDate(selectedDate.toISOString().split('T')[0]);
    
    // Load time slots regardless of user identification - we can handle it during booking
    loadTimeSlots();
  }, [selectedHall, selectedDate]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading time slots...');
      
      // Format date for API call (YYYY-MM-DD)
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      console.log('🔍 Loading time slots with params:', {
        hallId: selectedHall.id,
        date: formattedDate
      });
      
      // Get available time slots for the hall
      const timeSlotsResponse = await bookingAPI.getTimeSlots(selectedHall.id, formattedDate, null);
      
      console.log('📡 Time slots API response:', timeSlotsResponse);
      
      if (!timeSlotsResponse.success) {
        Alert.alert('Error', timeSlotsResponse.message || 'Failed to load time slots for selected date');
        return;
      }
      
      setTimeSlots(timeSlotsResponse.data || []);
      
      // Debug: Log each time slot's availability
      console.log('📝 Time slots received:');
      (timeSlotsResponse.data || []).forEach((slot, index) => {
        console.log(`  ${index + 1}. ${slot.time} - Available: ${slot.available}, Reason: ${slot.reason || 'N/A'}`);
      });
      
    } catch (error) {
      console.error('💥 Error loading time slots:', error);
      
      let errorMessage = 'Unable to load time slots. ';
      
      if (error.message.includes('fetch')) {
        errorMessage += 'Network connection failed. Please check:\n\n1. Backend server is running\n2. Internet connection is available\n3. API URL is correct (localhost:5000)';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. The server might be slow or unreachable.';
      } else {
        errorMessage += `Error details: ${error.message}`;
      }
      
      Alert.alert('Connection Error', errorMessage, [
        { text: 'OK' },
        { text: 'Retry', onPress: () => loadTimeSlots() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isSlotAvailable = (timeSlot) => {
    // Check both available and isAvailable properties for compatibility
    return timeSlot.available !== false && timeSlot.isAvailable !== false;
  };

  const handleTimeSlotToggle = (timeSlot) => {
    // Don't allow toggling unavailable slots
    if (!isSlotAvailable(timeSlot)) {
      return;
    }
    
    // If selecting "Full Day", deselect all other slots
    if (timeSlot.id === '4') {
      // Clear all other selections first
      selectedTimeSlots.forEach(slot => {
        if (slot.id !== '4') {
          toggleTimeSlot(slot);
        }
      });
    } else {
      // If selecting individual slot, deselect "Full Day" if selected
      const fullDaySlot = selectedTimeSlots.find(slot => slot.id === '4');
      if (fullDaySlot) {
        toggleTimeSlot(fullDaySlot);
      }
    }
    
    toggleTimeSlot(timeSlot);
  };

  const handleContinue = () => {
    if (selectedTimeSlots.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one time slot');
      return;
    }
    
    // Pass user identification data to Requirements screen if available
    const navigationParams = {};
    if (tempUserData.email || tempUserData.phone) {
      navigationParams.prefilledUserData = tempUserData;
    }
    
    navigation.navigate('Requirements', navigationParams);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Update the global context with formatted date string
    selectDate(date.toISOString().split('T')[0]);
    setShowDatePicker(false);
    // Clear selected slots when date changes
    selectedTimeSlots.forEach(slot => toggleTimeSlot(slot));
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getMinimumDate = () => {
    return new Date(); // Today
  };

  const getMaximumDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 3 months ahead
    return maxDate;
  };

  const isTimeSlotSelected = (timeSlot) => {
    return selectedTimeSlots.some(slot => slot.id === timeSlot.id);
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Loading time slots for {formatDisplayDate(selectedDate)}...
        </Text>
      </View>
    );
  }

  if (!selectedHall) {
    return (
      <View style={[globalStyles.container, globalStyles.centered]}>
        <Text style={styles.errorText}>No hall selected</Text>
        <CustomButton
          title="Back to Home"
          onPress={() => navigation.navigate('Home')}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Date & Time Slots</Text>
          <Text style={styles.hallName}>{selectedHall.name}</Text>
          <Text style={styles.subtitle}>
            Choose your preferred date and time slots for the seminar
          </Text>
        </View>

        {/* Date Selector */}
        <View style={[globalStyles.card, styles.dateCard]}>
          <Text style={styles.cardTitle}>📅 Select Date</Text>
          <TouchableOpacity 
            style={styles.dateSelector} 
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
            <Text style={styles.dateIcon}>📅</Text>
          </TouchableOpacity>
          
          {isDateInPast(selectedDate) && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>⚠️ Selected date is in the past. Please choose a future date.</Text>
            </View>
          )}
          
          <Text style={styles.dateHint}>
            You can book up to 3 months in advance
          </Text>
          
          {selectedDate.getDay() === 0 && (
            <View style={styles.sundayNotice}>
              <Text style={styles.sundayNoticeIcon}>ℹ️</Text>
              <Text style={styles.sundayNoticeText}>
                Sunday bookings are only available through priority requests. Please contact admin if you need to book for Sunday.
              </Text>
            </View>
          )}
        </View>

        <View style={[globalStyles.card, styles.timeSlotsCard]}>
          <Text style={styles.cardTitle}>Available Time Slots</Text>
          
          {timeSlots.map((timeSlot) => (
            <View key={timeSlot.id} style={styles.timeSlotContainer}>
              <CustomCheckbox
                label={`${timeSlot.time} (${timeSlot.duration})`}
                checked={isTimeSlotSelected(timeSlot)}
                onPress={() => handleTimeSlotToggle(timeSlot)}
                style={[
                  styles.timeSlotCheckbox,
                  !isSlotAvailable(timeSlot) && styles.unavailableSlot
                ]}
                disabled={!isSlotAvailable(timeSlot)}
              />
              {!isSlotAvailable(timeSlot) && timeSlot.reason && (
                <Text style={styles.unavailableReason}>
                  ❌ {timeSlot.reason}
                </Text>
              )}
              {isSlotAvailable(timeSlot) && (
                <Text style={styles.availableIndicator}>✅ Available</Text>
              )}
            </View>
          ))}
        </View>

        {selectedTimeSlots.length > 0 && (
          <View style={[globalStyles.card, styles.summaryCard]}>
            <Text style={styles.cardTitle}>Selected Time Slots</Text>
            {selectedTimeSlots.map((slot) => (
              <Text key={slot.id} style={styles.selectedSlot}>
                • {slot.time}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 Tip: Select "Full Day" for events requiring the entire day
          </Text>
          <Text style={styles.infoText}>
            📋 Individual slots are perfect for shorter sessions
          </Text>
        </View>

        <View style={styles.footer}>
          <CustomButton
            title="Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <CustomButton
            title={`Continue (${selectedTimeSlots.length} selected)`}
            onPress={handleContinue}
            disabled={selectedTimeSlots.length === 0}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View 
          style={styles.modalOverlay}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <View 
            style={styles.datePickerModal}
            accessible={true}
            accessibilityRole="dialog"
            accessibilityLabel="Select booking date"
          >
            <Text style={styles.modalTitle}>Select Date</Text>
            
            <ScrollView style={styles.dateScrollView} showsVerticalScrollIndicator={false}>
              {/* Generate next 90 days */}
              {Array.from({ length: 30 }, (_, index) => {
                const date = new Date();
                date.setDate(date.getDate() + index);
                const isToday = index === 0;
                const isSelected = date.toDateString() === selectedDate.toDateString();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateOption,
                      isSelected && styles.selectedDateOption,
                      isToday && styles.todayDateOption
                    ]}
                    onPress={() => handleDateChange(date)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isSelected && styles.selectedDateText,
                      isToday && styles.todayDateText
                    ]}>
                      {formatDisplayDate(date)} {isToday && '(Today)'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Identification Modal for Double-Booking Prevention */}
      <Modal
        visible={showUserIdentification}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {}}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View 
          style={styles.modalOverlay}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <View 
            style={styles.userIdModal}
            accessible={true}
            accessibilityRole="dialog"
            accessibilityLabel="User identification for booking"
          >
            <Text style={styles.modalTitle}>User Identification</Text>
            <Text style={styles.modalSubtitle}>
              To prevent double bookings, please provide your email or phone number
            </Text>
            
            <TextInput
              style={styles.userIdInput}
              placeholder="Email Address"
              value={tempUserData.email}
              onChangeText={(text) => setTempUserData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Text style={styles.orText}>OR</Text>
            
            <TextInput
              style={styles.userIdInput}
              placeholder="Phone Number"
              value={tempUserData.phone}
              onChangeText={(text) => setTempUserData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            
            <TouchableOpacity 
              style={[
                styles.userIdButton,
                (!tempUserData.email && !tempUserData.phone) && styles.userIdButtonDisabled
              ]} 
              onPress={() => {
                if (tempUserData.email || tempUserData.phone) {
                  setShowUserIdentification(false);
                }
              }}
              disabled={!tempUserData.email && !tempUserData.phone}
            >
              <Text style={styles.userIdButtonText}>Continue</Text>
            </TouchableOpacity>
            
            <Text style={styles.privacyNote}>
              This information is only used to prevent double bookings and will be included in your booking details.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: getResponsiveValue(16, 20, 24),
  },
  header: {
    padding: getResponsiveValue(16, 20, 32),
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveValue(20, 24, 28),
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  hallName: {
    fontSize: getResponsiveValue(18, 20, 24),
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: getResponsiveValue(6, 8, 10),
  },
  subtitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
  },
  dateCard: {
    marginHorizontal: getResponsiveValue(16, 20, 32),
    marginBottom: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(16, 20, 24),
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.light,
    padding: getResponsiveValue(12, 16, 20),
    borderRadius: getResponsiveValue(8, 12, 16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: getResponsiveValue(8, 12, 16),
  },
  dateText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  dateIcon: {
    fontSize: getResponsiveValue(18, 20, 24),
  },
  dateHint: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.textLight,
    textAlign: 'center',
    marginTop: getResponsiveValue(4, 6, 8),
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(6, 8, 10),
    marginBottom: getResponsiveValue(8, 10, 12),
  },
  warningText: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: '#B45309',
    textAlign: 'center',
  },
  sundayNotice: {
    backgroundColor: '#E3F2FD',
    padding: getResponsiveValue(12, 14, 16),
    borderRadius: getResponsiveValue(8, 10, 12),
    marginTop: getResponsiveValue(12, 14, 16),
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sundayNoticeIcon: {
    fontSize: getResponsiveValue(16, 18, 20),
    marginRight: getResponsiveValue(8, 10, 12),
    marginTop: 2,
  },
  sundayNoticeText: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.primary,
    flex: 1,
    lineHeight: getResponsiveValue(18, 20, 22),
    fontWeight: '500',
  },
  timeSlotsCard: {
    marginHorizontal: getResponsiveValue(16, 20, 32),
    marginBottom: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(16, 20, 24),
  },
  summaryCard: {
    marginHorizontal: getResponsiveValue(16, 20, 32),
    marginBottom: getResponsiveValue(12, 16, 20),
    backgroundColor: colors.light,
    padding: getResponsiveValue(16, 20, 24),
  },
  cardTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: '600',
    color: colors.text,
    marginBottom: getResponsiveValue(10, 12, 16),
  },
  timeSlotContainer: {
    marginVertical: getResponsiveValue(4, 6, 8),
    padding: getResponsiveValue(8, 10, 12),
    borderRadius: getResponsiveValue(6, 8, 10),
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  timeSlotCheckbox: {
    marginBottom: getResponsiveValue(4, 6, 8),
  },
  unavailableSlot: {
    opacity: 0.5,
    backgroundColor: colors.lightGray,
  },
  unavailableReason: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.danger,
    fontStyle: 'italic',
    marginTop: 4,
  },
  availableIndicator: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.success,
    fontWeight: '600',
    marginTop: 4,
  },
  selectedSlot: {
    ...typography.body,
    color: colors.primary,
    marginVertical: 2,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: getResponsiveValue(16, 20, 32),
    padding: getResponsiveValue(12, 16, 20),
    backgroundColor: colors.primary + '10',
    borderRadius: getResponsiveValue(8, 12, 16),
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  infoText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    textAlign: 'center',
    marginVertical: getResponsiveValue(1, 2, 3),
  },
  footer: {
    backgroundColor: colors.white,
    padding: getResponsiveValue(16, 20, 32),
    paddingBottom: getResponsiveValue(20, 30, 40),
    flexDirection: isSmallScreen ? 'column' : 'row',
    ...globalStyles.shadow,
    marginTop: getResponsiveValue(16, 20, 24),
  },
  backButton: {
    flex: isSmallScreen ? 0 : 1,
    marginRight: isSmallScreen ? 0 : getResponsiveValue(8, 10, 12),
    marginBottom: isSmallScreen ? 12 : 0,
  },
  continueButton: {
    flex: isSmallScreen ? 0 : 2,
    marginLeft: isSmallScreen ? 0 : getResponsiveValue(8, 10, 12),
  },
  loadingText: {
    ...typography.body,
    color: colors.textLight,
    marginTop: 10,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Date Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(16, 20, 24),
    width: getResponsiveValue('90%', '80%', '70%'),
    maxWidth: 500,
    maxHeight: '80%',
    ...globalStyles.shadow,
  },
  modalTitle: {
    fontSize: getResponsiveValue(18, 20, 24),
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  dateScrollView: {
    maxHeight: getResponsiveValue(300, 400, 500),
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  dateOption: {
    padding: getResponsiveValue(12, 16, 20),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedDateOption: {
    backgroundColor: colors.primary,
    borderRadius: getResponsiveValue(8, 10, 12),
    marginVertical: 2,
    borderBottomWidth: 0,
  },
  todayDateOption: {
    backgroundColor: colors.secondary + '20',
    borderRadius: getResponsiveValue(8, 10, 12),
    marginVertical: 2,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  dateOptionText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    textAlign: 'center',
  },
  selectedDateText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  todayDateText: {
    color: colors.secondary,
    fontWeight: '600',
  },
  modalCloseButton: {
    backgroundColor: colors.gray,
    padding: getResponsiveValue(12, 16, 20),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.white,
    fontWeight: '600',
  },

  // User Identification Modal Styles
  userIdModal: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(20, 24, 28),
    width: getResponsiveValue('90%', '80%', '70%'),
    maxWidth: 400,
    ...globalStyles.shadow,
  },
  modalSubtitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: getResponsiveValue(20, 24, 28),
    lineHeight: getResponsiveValue(20, 24, 26),
  },
  userIdInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: getResponsiveValue(8, 10, 12),
    padding: getResponsiveValue(12, 16, 18),
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: getResponsiveValue(12, 16, 18),
  },
  orText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: getResponsiveValue(8, 10, 12),
    fontWeight: '600',
  },
  userIdButton: {
    backgroundColor: colors.primary,
    padding: getResponsiveValue(14, 18, 20),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    marginTop: getResponsiveValue(12, 16, 18),
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  userIdButtonDisabled: {
    backgroundColor: colors.gray,
    opacity: 0.6,
  },
  userIdButtonText: {
    fontSize: getResponsiveValue(16, 18, 20),
    color: colors.white,
    fontWeight: '600',
  },
  privacyNote: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: getResponsiveValue(16, 18, 20),
  },
});

export default TimeSlotScreen;