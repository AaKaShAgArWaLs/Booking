import React, { createContext, useContext, useReducer } from 'react';

const BookingContext = createContext();

const initialState = {
  selectedHall: null,
  selectedTimeSlots: [],
  bookingForm: {
    name: '',
    email: '',
    phone: '',
    organization: '',
    eventTitle: '',
    description: '',
    attendees: '',
  },
  bookings: [],
};

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SELECT_HALL':
      return {
        ...state,
        selectedHall: action.payload,
      };
    case 'TOGGLE_TIME_SLOT':
      const timeSlot = action.payload;
      const isSelected = state.selectedTimeSlots.some(slot => slot.id === timeSlot.id);
      
      if (isSelected) {
        return {
          ...state,
          selectedTimeSlots: state.selectedTimeSlots.filter(slot => slot.id !== timeSlot.id),
        };
      } else {
        return {
          ...state,
          selectedTimeSlots: [...state.selectedTimeSlots, timeSlot],
        };
      }
    case 'UPDATE_FORM':
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          ...action.payload,
        },
      };
    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [...state.bookings, action.payload],
      };
    case 'RESET_BOOKING':
      return {
        ...state,
        selectedHall: null,
        selectedTimeSlots: [],
        bookingForm: initialState.bookingForm,
      };
    default:
      return state;
  }
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const selectHall = (hall) => {
    dispatch({ type: 'SELECT_HALL', payload: hall });
  };

  const toggleTimeSlot = (timeSlot) => {
    dispatch({ type: 'TOGGLE_TIME_SLOT', payload: timeSlot });
  };

  const updateForm = (formData) => {
    dispatch({ type: 'UPDATE_FORM', payload: formData });
  };

  const addBooking = (booking) => {
    dispatch({ type: 'ADD_BOOKING', payload: booking });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const value = {
    ...state,
    selectHall,
    toggleTimeSlot,
    updateForm,
    addBooking,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};