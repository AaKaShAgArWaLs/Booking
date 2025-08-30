import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingProvider } from './context/BookingContext';

import HomeScreen from './screens/HomeScreen';
import TimeSlotScreen from './screens/TimeSlotScreen';
import RequirementScreen from './screens/RequirementScreen';
import ConfirmationScreen from './screens/ConfirmationScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <BookingProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TimeSlot" component={TimeSlotScreen} />
          <Stack.Screen name="Requirements" component={RequirementScreen} />
          <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </BookingProvider>
  );
};

export default App;
