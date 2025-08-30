const API_BASE_URL = 'https://booking-seven-wheat.vercel.app';

class BookingAPI {
  constructor() {
    this.bookings = [];
  }

  // Get all halls
  async getHalls() {
    try {
      const response = await fetch(`${API_BASE_URL}/apiw/halls`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching halls:', error);
      return {
        success: false,
        error: 'Failed to load halls. Please check your connection.',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get available time slots for a specific hall and date
  async getTimeSlots(hallId, selectedDate = null) {
    try {
      const date = selectedDate || new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/api/halls/${hallId}/timeslots?date=${date}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return {
        success: false,
        error: 'Failed to load time slots. Please try again.',
        message: 'Unable to connect to the server'
      };
    }
  }


  // Submit a booking request
  async submitBooking(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting booking:', error);
      return {
        success: false,
        error: 'Failed to submit booking. Please try again.',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get all bookings (for admin)
  async getAllBookings() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return {
        success: false,
        error: 'Failed to load bookings',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Approve a booking (admin action)
  async approveBooking(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error approving booking:', error);
      return {
        success: false,
        error: 'Failed to approve booking',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Reject a booking (admin action)
  async rejectBooking(bookingId, reason = 'No reason provided') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error rejecting booking:', error);
      return {
        success: false,
        error: 'Failed to reject booking',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get booking details by ID
  async getBookingDetails(bookingId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching booking details:', error);
      return {
        success: false,
        error: 'Failed to load booking details',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get admin dashboard statistics
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        success: false,
        error: 'Failed to load dashboard statistics',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Create priority booking
  async createPriorityBooking(bookingData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/priority-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating priority booking:', error);
      return {
        success: false,
        error: 'Failed to create priority booking',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get admin users
  async getAdminUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return {
        success: false,
        error: 'Failed to load admin users',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Create hall
  async createHall(hallData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/halls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hallData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating hall:', error);
      return {
        success: false,
        error: 'Failed to create hall',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Update hall
  async updateHall(hallId, hallData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/halls/${hallId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hallData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating hall:', error);
      return {
        success: false,
        error: 'Failed to update hall',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Toggle hall status
  async toggleHallStatus(hallId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/halls/${hallId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling hall status:', error);
      return {
        success: false,
        error: 'Failed to toggle hall status',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Schedule maintenance
  async scheduleMaintenance(maintenanceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      return {
        success: false,
        error: 'Failed to schedule maintenance',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get maintenance schedules
  async getMaintenanceSchedules() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/maintenance`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      return {
        success: false,
        error: 'Failed to load maintenance schedules',
        message: 'Unable to connect to the server'
      };
    }
  }
}

const bookingAPI = new BookingAPI();
export default bookingAPI;