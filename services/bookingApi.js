const API_BASE_URL = 'https://booking-seven-wheat.vercel.app'; // Change to your backend URL

class BookingAPI {
  constructor() {
    this.bookings = [];
  }

  // Get all halls
  async getHalls() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/halls`);
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
      console.log('API: Sending POST request to:', `${API_BASE_URL}/api/bookings`);
      console.log('API: Request body:', JSON.stringify(bookingData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      console.log('API: Response status:', response.status);
      console.log('API: Response headers:', JSON.stringify([...response.headers.entries()]));
      
      const responseText = await response.text();
      console.log('API: Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('API: Failed to parse JSON response:', parseError);
        return {
          success: false,
          error: `Server returned invalid JSON (Status: ${response.status})`,
          message: responseText.substring(0, 200),
          status: response.status
        };
      }
      
      if (!response.ok) {
        console.error('API: HTTP Error:', response.status, data);
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          message: data.details || 'Server error occurred',
          status: response.status,
          data: data
        };
      }
      
      console.log('API: Success response:', data);
      return data;
    } catch (error) {
      console.error('API: Network/Connection error:', error);
      return {
        success: false,
        error: 'Failed to submit booking. Please try again.',
        message: 'Unable to connect to the server',
        networkError: error.message
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

  // Admin Authentication
  async adminLogin(email, password) {
    try {
      console.log('API: Admin login attempt for:', email);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API: Admin login response:', data);

      if (response.ok && data.success) {
        // Store admin session data (in production, use secure storage)
        console.log('API: Admin login successful:', data.data);
        return data;
      } else {
        return {
          success: false,
          error: data.error || 'Login failed',
          message: data.message || 'Invalid credentials'
        };
      }
    } catch (error) {
      console.error('API: Admin login error:', error);
      return {
        success: false,
        error: 'Login failed',
        message: 'Unable to connect to the server',
        networkError: error.message
      };
    }
  }

  async adminLogout(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ admin_id: adminId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during admin logout:', error);
      return {
        success: false,
        error: 'Logout failed',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Admin Management
  async createAdminUser(adminData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating admin user:', error);
      return {
        success: false,
        error: 'Failed to create admin user',
        message: 'Unable to connect to the server'
      };
    }
  }

  async updateAdminUser(adminId, adminData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating admin user:', error);
      return {
        success: false,
        error: 'Failed to update admin user',
        message: 'Unable to connect to the server'
      };
    }
  }

  async toggleAdminStatus(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${adminId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error toggling admin status:', error);
      return {
        success: false,
        error: 'Failed to toggle admin status',
        message: 'Unable to connect to the server'
      };
    }
  }

  async deleteAdminUser(adminId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting admin user:', error);
      return {
        success: false,
        error: 'Failed to delete admin user',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Admin Logs
  async getAdminLogs() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/logs`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      return {
        success: false,
        error: 'Failed to load admin logs',
        message: 'Unable to connect to the server'
      };
    }
  }

  async logAdminAction(actionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error logging admin action:', error);
      // Don't return error for logging failures - it's not critical
      return { success: true };
    }
  }
}

const bookingAPI = new BookingAPI();
export default bookingAPI;