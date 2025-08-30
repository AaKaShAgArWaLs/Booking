import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { useBooking } from '../context/BookingContext';
import CustomCheckbox from '../components/CustomCheckbox';
import CustomButton from '../components/CustomButton';
import bookingAPI from '../services/bookingApi';

const TimeSlotScreen = ({ navigation }) => {
  const { 
    selectedHall, 
    selectedTimeSlots, 
    toggleTimeSlot 
  } = useBooking();
  
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedHall) {
      Alert.alert('Error', 'Please select a hall first', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
      return;
    }
    loadTimeSlots();
  }, [selectedHall]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getTimeSlots(selectedHall.id);
      if (response.success) {
        setTimeSlots(response.data);
      } else {
        Alert.alert('Error', 'Failed to load time slots');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
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

  const isTimeSlotSelected = (timeSlot) => {
    return selectedTimeSlots.some(slot => slot.id === timeSlot.id);
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, globalStyles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading time slots...</Text>
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
          <Text style={styles.title}>Select Time Slots</Text>
          <Text style={styles.hallName}>{selectedHall.name}</Text>
          <Text style={styles.subtitle}>
            Choose your preferred time slots for the seminar
          </Text>
        </View>

        <View style={[globalStyles.card, styles.timeSlotsCard]}>
          <Text style={styles.cardTitle}>Available Time Slots</Text>
          
          {timeSlots.map((timeSlot) => (
            <CustomCheckbox
              key={timeSlot.id}
              label={`${timeSlot.time} (${timeSlot.duration})`}
              checked={isTimeSlotSelected(timeSlot)}
              onPress={() => handleTimeSlotToggle(timeSlot)}
              style={styles.timeSlotCheckbox}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  hallName: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  timeSlotsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.light,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 12,
  },
  timeSlotCheckbox: {
    marginVertical: 4,
  },
  selectedSlot: {
    ...typography.body,
    color: colors.primary,
    marginVertical: 2,
    fontWeight: '600',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    marginVertical: 2,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    ...globalStyles.shadow,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    marginRight: 10,
  },
  continueButton: {
    flex: 2,
    marginLeft: 10,
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
});

export default TimeSlotScreen;