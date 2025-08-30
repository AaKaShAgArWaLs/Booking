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
    toggleTimeSlot 
  } = useBooking();
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!selectedHall) {
      Alert.alert('Error', 'Please select a hall first', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
      return;
    }
    loadTimeSlots();
  }, [selectedHall, selectedDate]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      
      // Format date for API call (YYYY-MM-DD)
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // API call with both hall ID and selected date
      const response = await bookingAPI.getTimeSlots(selectedHall.id, formattedDate);
      
      if (response.success) {
        setTimeSlots(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load time slots for selected date');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to load time slots. Please check your connection.');
      console.error('Error loading time slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotToggle = (timeSlot) => {
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
    navigation.navigate('Requirements');
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
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
        </View>

        <View style={[globalStyles.card, styles.timeSlotsCard]}>
          <Text style={styles.cardTitle}>Available Time Slots</Text>
          
          {timeSlots.map((timeSlot) => (
            <View key={timeSlot.id} style={styles.timeSlotContainer}>
              <CustomCheckbox
                label={`${timeSlot.time} (${timeSlot.duration})`}
                checked={isTimeSlotSelected(timeSlot)}
                onPress={() => timeSlot.available ? handleTimeSlotToggle(timeSlot) : null}
                style={[
                  styles.timeSlotCheckbox,
                  !timeSlot.available && styles.unavailableSlot
                ]}
                disabled={!timeSlot.available}
              />
              {!timeSlot.available && timeSlot.reason && (
                <Text style={styles.unavailableReason}>
                  ❌ {timeSlot.reason}
                </Text>
              )}
              {timeSlot.available && (
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
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
});

export default TimeSlotScreen;