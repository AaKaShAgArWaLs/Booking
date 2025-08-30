import { halls, timeSlots, sampleBookings } from '../data/dummyData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class BookingAPI {
  constructor() {
    this.bookings = [...sampleBookings];
  }

  // Get all halls
  async getHalls() {
    await delay(500);
    return {
      success: true,
      data: halls,
    };
  }

  // Get available time slots for a specific hall
  async getTimeSlots(hallId) {
    await delay(300);
    // In a real app, this would check actual availability
    return {
      success: true,
      data: timeSlots,
    };
  }

  // Submit a booking request
  async submitBooking(bookingData) {
    await delay(800);
    
    const newBooking = {
      id: Date.now().toString(),
      ...bookingData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      userName: 'User Name', // In real app, get from auth
      userEmail: 'user@example.com', // In real app, get from auth
    };

    this.bookings.push(newBooking);

    // Simulate 90% success rate
    const success = Math.random() > 0.1;
    
    if (success) {
      return {
        success: true,
        data: newBooking,
        message: 'Booking submitted successfully! You will receive a confirmation email.',
      };
    } else {
      return {
        success: false,
        error: 'Failed to submit booking. Please try again.',
      };
    }
  }

  // Get all bookings (for admin)
  async getAllBookings() {
    await delay(400);
    return {
      success: true,
      data: this.bookings.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    };
  }

  // Approve a booking (admin action)
  async approveBooking(bookingId) {
    await delay(300);
    
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'approved';
      return {
        success: true,
        data: booking,
        message: 'Booking approved successfully',
      };
    }
    
    return {
      success: false,
      error: 'Booking not found',
    };
  }

  // Reject a booking (admin action)
  async rejectBooking(bookingId) {
    await delay(300);
    
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'rejected';
      return {
        success: true,
        data: booking,
        message: 'Booking rejected',
      };
    }
    
    return {
      success: false,
      error: 'Booking not found',
    };
  }
}

const bookingAPI = new BookingAPI();
export default bookingAPI;