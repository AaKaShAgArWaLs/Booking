const API_BASE_URL = 'https://booking-seven-wheat.vercel.app'; // Change to your backend URL
// const API_BASE_URL = 'http://localhost:5000'; // Change to your backend URL

class BookingAPI {
  constructor() {
    this.bookings = [];
  }

  // Test API connectivity
  async testConnection() {
    try {
      console.log('🔗 Testing API connection to:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/halls`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('🔍 Connection test response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API connection successful, found', data.data?.length || 0, 'halls');
        return { success: true, connected: true };
      } else {
        console.log('❌ API connection failed:', response.status, response.statusText);
        return { success: false, connected: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error('💥 API connection error:', error);
      return { success: false, connected: false, error: error.message };
    }
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
  async getTimeSlots(hallId, selectedDate = null, userContext = null) {
    try {
      const date = selectedDate || new Date().toISOString().split('T')[0];
      let url = `${API_BASE_URL}/api/halls/${hallId}/timeslots?date=${date}`;
      
      // Add user context to check for existing bookings
      if (userContext && userContext.userId) {
        url += `&userId=${userContext.userId}`;
      }
      if (userContext && userContext.userEmail) {
        url += `&userEmail=${encodeURIComponent(userContext.userEmail)}`;
      }
      if (userContext && userContext.userPhone) {
        url += `&userPhone=${encodeURIComponent(userContext.userPhone)}`;
      }
      
      console.log('🚀 Making API request to:', url);
      console.log('📝 Request params:', { hallId, date, userContext });
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        clearTimeout(timeoutId);
        console.log('📊 Response status:', response.status);
      
        if (!response.ok) {
          console.error('❌ Network response was not ok:', response.status, response.statusText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        return data;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('⏰ Request timed out after 10 seconds');
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        console.error('🚨 Fetch error:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return {
        success: false,
        error: 'Failed to load time slots. Please try again.',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get user's existing bookings for a specific date
  async getUserBookingsForDate(date, userContext = {}) {
    try {
      const params = new URLSearchParams();
      params.append('date', date);
      
      if (userContext.userId) {
        params.append('userId', userContext.userId);
      }
      if (userContext.userEmail) {
        params.append('userEmail', userContext.userEmail);
      }
      if (userContext.userPhone) {
        params.append('userPhone', userContext.userPhone);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/bookings/user-bookings?${params.toString()}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return {
        success: false,
        error: 'Failed to check existing bookings',
        message: 'Unable to connect to the server'
      };
    }
  }

  // Get all time slots for priority booking (including unavailable ones)
  async getAllTimeSlots(hallId, selectedDate = null) {
    try {
      const date = selectedDate || new Date().toISOString().split('T')[0];
      console.log('📞 Fetching ALL time slots for priority booking:', { hallId, date });
      
      const response = await fetch(`${API_BASE_URL}/api/halls/${hallId}/timeslots?date=${date}&showAll=true&priority=true`);
      
      if (!response.ok) {
        console.warn('⚠️ API request failed, using fallback time slots');
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 API response for getAllTimeSlots:', data);
      
      // Ensure we always return time slots, even if API returns empty or malformed data
      if (data.success && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log('✅ Using API time slots:', data.data);
        return data;
      } else {
        console.log('⚠️ API returned empty/invalid data, using fallback');
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('❌ Error fetching all time slots:', error);
      console.log('🔄 Returning fallback time slots for priority booking');
      
      // Return comprehensive default time slots as fallback
      const fallbackSlots = [
        { 
          id: 'slot1', 
          slot_id: 'slot1', 
          start_time: '08:45', 
          end_time: '10:45', 
          time: '8:45 AM - 10:45 AM',
          label: '8:45 AM - 10:45 AM',
          available: true,
          priority_available: true
        },
        { 
          id: 'slot2', 
          slot_id: 'slot2', 
          start_time: '11:00', 
          end_time: '12:45', 
          time: '11:00 AM - 12:45 PM',
          label: '11:00 AM - 12:45 PM',
          available: true,
          priority_available: true
        },
        { 
          id: 'slot3', 
          slot_id: 'slot3', 
          start_time: '13:00', 
          end_time: '15:45', 
          time: '1:00 PM - 3:45 PM',
          label: '1:00 PM - 3:45 PM',
          available: true,
          priority_available: true
        }
      ];
      
      return {
        success: true,
        data: fallbackSlots,
        fallback: true
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

  // Report Generation
  async generateBookingReport(reportType, dateRange = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', reportType); // 'pdf' or 'excel'
      
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/bookings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // For file downloads, we need to handle the blob
        const blob = await response.blob();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || 
                        `booking-report-${new Date().toISOString().split('T')[0]}.${reportType === 'pdf' ? 'pdf' : 'xlsx'}`;
        
        return {
          success: true,
          data: blob,
          filename: filename.replace(/"/g, ''), // Remove quotes from filename
          contentType: response.headers.get('Content-Type')
        };
      } else {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Failed to generate report',
          message: data.message || 'Server error occurred'
        };
      }
    } catch (error) {
      console.error('Error generating booking report:', error);
      return {
        success: false,
        error: 'Failed to generate report',
        message: 'Unable to connect to the server'
      };
    }
  }

  async generateHallUtilizationReport(reportType, dateRange = {}) {
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      
      if (dateRange.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports/utilization?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || 
                        `utilization-report-${new Date().toISOString().split('T')[0]}.${reportType === 'pdf' ? 'pdf' : 'xlsx'}`;
        
        return {
          success: true,
          data: blob,
          filename: filename.replace(/"/g, ''),
          contentType: response.headers.get('Content-Type')
        };
      } else {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Failed to generate utilization report',
          message: data.message || 'Server error occurred'
        };
      }
    } catch (error) {
      console.error('Error generating utilization report:', error);
      return {
        success: false,
        error: 'Failed to generate utilization report',
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