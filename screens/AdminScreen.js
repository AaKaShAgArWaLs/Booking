import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
// Remove DateTimePicker import as it's causing issues on Android
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import { globalStyles } from "../styles/globalStyles";
import bookingAPI from "../services/bookingApi";
import { useNavigation } from '@react-navigation/native';

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

const getCardWidth = () => {
  if (isLargeScreen) return (width - 60) / 4; // 4 columns on large screens
  if (isTablet) return (width - 50) / 3; // 3 columns on tablets
  return (width - 50) / 2; // 2 columns on phones
};

const getStatCardWidth = () => {
  if (isLargeScreen) return (width - 60) / 4;
  return (width - 50) / 2;
};

const AdminScreen = ({ navigation, route }) => {
  // Get admin data from navigation params if available
  const adminData = route?.params?.adminData;
  
  console.log('AdminScreen mounted with navigation:', !!navigation);
  console.log('AdminScreen route params:', route?.params);
  console.log('AdminScreen admin data:', adminData);
  // Backup navigation hook in case navigation prop is not available
  const hookNavigation = useNavigation();
  const navigationToUse = navigation || hookNavigation;
  
  const [bookings, setBookings] = useState([]);
  const [halls, setHalls] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Priority booking states
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);
  const [priorityBookingData, setPriorityBookingData] = useState({
    hall: '',
    date: '',
    time: '',
    department: '',
    purpose: '',
    requester: '',
    otherReason: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  
  // Admin management states
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    role: '',
    email: '',
    password: ''
  });

  // Hall creation states
  const [hallModalVisible, setHallModalVisible] = useState(false);
  const [newHallData, setNewHallData] = useState({
    name: '',
    location: '',
    capacity: '',
    features: '',
    icon: '🏛️'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [statsResponse, bookingsResponse, hallsResponse, adminsResponse] = await Promise.all([
        bookingAPI.getDashboardStats(),
        bookingAPI.getAllBookings(),
        bookingAPI.getHalls(),
        bookingAPI.getAdminUsers()
      ]);

      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }

      if (bookingsResponse.success) {
        setBookings(bookingsResponse.data);
      }

      if (hallsResponse.success) {
        setHalls(hallsResponse.data.map(hall => ({
          id: hall.id,
          name: hall.name,
          location: hall.location,
          capacity: hall.capacity,
          available: hall.isAvailable,
          features: hall.features || hall.amenities || [],
          color: hall.color,
          icon: hall.icon
        })));
      }

      if (adminsResponse.success) {
        console.log('Loading admin data:', adminsResponse.data);
        const adminData = adminsResponse.data.map(admin => ({
          id: admin.id,
          name: admin.name,
          role: admin.role,
          email: admin.email,
          active: admin.status === 'active'
        }));
        console.log('Processed admin data:', adminData);
        setAdmins(adminData);
      } else {
        console.error('Failed to load admin data:', adminsResponse);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Approve Booking
  const handleApprove = async (booking) => {
    try {
      const response = await bookingAPI.approveBooking(booking.booking_id);
      if (response.success) {
        // Log admin action
        await logAdminAction('APPROVE_BOOKING', {
          booking_id: booking.booking_id,
          hall_name: booking.hall?.name || booking.name,
          booking_date: booking.booking_date,
          requester: booking.requester_name || booking.name
        });

        setBookings((prev) =>
          prev.map((b) => (b.id === booking.id ? { ...b, status: "approved" } : b))
        );
        Alert.alert("✅ Booking Approved");
        await loadDashboardData(); // Refresh data
      } else {
        Alert.alert("Error", response.error || "Failed to approve booking");
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      Alert.alert("Error", "Failed to approve booking");
    }
  };

  // Open Reject Modal
  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setModalVisible(true);
  };

  // Confirm Reject with Reason
  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("⚠️ Please provide a reason");
      return;
    }

    try {
      const response = await bookingAPI.rejectBooking(selectedBooking.booking_id, rejectReason);
      if (response.success) {
        // Log admin action
        await logAdminAction('REJECT_BOOKING', {
          booking_id: selectedBooking.booking_id,
          hall_name: selectedBooking.hall?.name || selectedBooking.name,
          booking_date: selectedBooking.booking_date,
          requester: selectedBooking.requester_name || selectedBooking.name,
          reject_reason: rejectReason
        });

        setBookings((prev) =>
          prev.map((b) =>
            b.id === selectedBooking.id
              ? { ...b, status: "rejected", rejectionReason: rejectReason }
              : b
          )
        );
        setModalVisible(false);
        Alert.alert("❌ Booking Rejected", `Reason: ${rejectReason}`);
        await loadDashboardData(); // Refresh data
      } else {
        Alert.alert("Error", response.error || "Failed to reject booking");
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert("Error", "Failed to reject booking");
    }
  };

  // Toggle Hall Availability
  const toggleHallAvailability = async (hallId) => {
    try {
      const hall = halls.find(h => h.id === hallId);
      const response = await bookingAPI.toggleHallStatus(hallId);
      if (response.success) {
        // Log admin action
        await logAdminAction('TOGGLE_HALL_STATUS', {
          hall_id: hallId,
          hall_name: hall?.name,
          new_status: response.data.is_active ? 'available' : 'unavailable'
        });

        setHalls((prev) =>
          prev.map((h) =>
            h.id === hallId ? { ...h, available: response.data.is_active } : h
          )
        );
        
        const statusMessage = response.data.is_active 
          ? "Hall is now available for bookings" 
          : "Hall is now unavailable - users cannot book this hall";
          
        Alert.alert("Hall Status Updated", statusMessage);
        
        // Refresh dashboard stats
        await loadDashboardData();
      } else {
        Alert.alert("Error", response.error || "Failed to toggle hall status");
      }
    } catch (error) {
      console.error('Error toggling hall status:', error);
      Alert.alert("Error", "Failed to toggle hall status");
    }
  };

  // Generate Reports
  const handleGenerateReports = () => {
    Alert.alert("Reports", "PDF/Excel reports will be generated here.");
  };

  // Priority Booking Functions
  const handlePriorityBooking = () => {
    setPriorityBookingData({
      hall: '',
      date: '',
      time: '',
      department: '',
      purpose: '',
      requester: '',
      otherReason: ''
    });
    setAvailableTimeSlots([]);
    const today = new Date();
    setSelectedDate(today);
    setTempSelectedDate(today);
    setShowDatePicker(false);
    setPriorityModalVisible(true);
  };

  // Fetch time slots when hall and date are selected
  const handleHallOrDateChange = async (field, value) => {
    const updatedData = { ...priorityBookingData, [field]: value };
    setPriorityBookingData(updatedData);

    // Reset time slot when hall or date changes
    if (field === 'hall' || field === 'date') {
      updatedData.time = '';
      setPriorityBookingData(updatedData);
      setAvailableTimeSlots([]);
    }

    // Load time slots if both hall and date are selected
    if (updatedData.hall && updatedData.date && (field === 'hall' || field === 'date')) {
      setLoadingTimeSlots(true);
      try {
        const response = await bookingAPI.getTimeSlots(updatedData.hall, updatedData.date);
        if (response.success && response.data) {
          console.log('Time slots loaded:', response.data);
          setAvailableTimeSlots(response.data);
        } else {
          console.log('No time slots available:', response);
          setAvailableTimeSlots([]);
          if (updatedData.hall && updatedData.date) {
            Alert.alert('Info', 'No time slots available for selected hall and date');
          }
        }
      } catch (error) {
        console.error('Error loading time slots:', error);
        setAvailableTimeSlots([]);
        Alert.alert('Error', 'Failed to load time slots. Please try again.');
      } finally {
        setLoadingTimeSlots(false);
      }
    }
  };

  // Handle date selection
  const handleDateSelection = (date) => {
    setSelectedDate(date);
    setTempSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    handleHallOrDateChange('date', dateString);
    setShowDatePicker(false);
  };

  // Generate date options for the next 30 days
  const generateDateOptions = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Show date picker
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // Log admin actions
  const logAdminAction = async (action, details) => {
    try {
      const logData = {
        action,
        details,
        timestamp: new Date().toISOString(),
        admin_id: adminData?.id || 'current_admin_id' // Use logged in admin ID
      };
      
      // You'll need to add this API method
      await bookingAPI.logAdminAction(logData);
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      `Are you sure you want to logout${adminData?.name ? `, ${adminData.name}` : ''}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Log the logout action
              await logAdminAction('LOGOUT', {
                admin_name: adminData?.name || 'Unknown',
                admin_email: adminData?.email || 'Unknown'
              });

              // Call backend logout if we have admin data
              if (adminData?.id) {
                await bookingAPI.adminLogout(adminData.id);
              }
              
              // Navigate back to home screen
              navigationToUse.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              // Even if logout API fails, still navigate away
              navigationToUse.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }
        }
      ]
    );
  };

  const submitPriorityBooking = async () => {
    if (!priorityBookingData.hall || !priorityBookingData.date || !priorityBookingData.time) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (priorityBookingData.department === 'other' && !priorityBookingData.otherReason.trim()) {
      Alert.alert("Error", "Please specify the reason for 'Other' department");
      return;
    }

    try {
      const finalDepartment = priorityBookingData.department === 'other' 
        ? priorityBookingData.otherReason 
        : priorityBookingData.department;

      const bookingData = {
        hall_id: priorityBookingData.hall,
        time_slot_id: priorityBookingData.time,
        booking_date: priorityBookingData.date,
        requester_name: priorityBookingData.requester,
        department: finalDepartment,
        purpose: priorityBookingData.purpose,
        notes: `Priority booking created by admin`,
        attendees: 50 // Default value
      };

      const response = await bookingAPI.createPriorityBooking(bookingData);
      
      if (response.success) {
        // Log admin action
        await logAdminAction('CREATE_PRIORITY_BOOKING', {
          hall_id: priorityBookingData.hall,
          booking_date: priorityBookingData.date,
          department: finalDepartment,
          requester: priorityBookingData.requester
        });

        setPriorityModalVisible(false);
        Alert.alert("Success", response.message || "Priority booking created successfully!");
        await loadDashboardData(); // Refresh data
      } else {
        Alert.alert("Error", response.error || "Failed to create priority booking");
      }
    } catch (error) {
      console.error('Error creating priority booking:', error);
      Alert.alert("Error", "Failed to create priority booking");
    }
  };

  // Hall Management Functions
  const handleAddHall = () => {
    setNewHallData({
      name: '',
      location: '',
      capacity: '',
      features: '',
      icon: '🏛️'
    });
    setHallModalVisible(true);
  };

  const submitHallData = async () => {
    if (!newHallData.name || !newHallData.location || !newHallData.capacity) {
      Alert.alert("Error", "Please fill all required fields (Name, Location, Capacity)");
      return;
    }

    try {
      const hallData = {
        name: newHallData.name.trim(),
        location: newHallData.location.trim(),
        capacity: parseInt(newHallData.capacity),
        features: newHallData.features.split(',').map(f => f.trim()).filter(f => f),
        icon: newHallData.icon,
        isAvailable: true
      };

      const response = await bookingAPI.createHall(hallData);
      
      if (response.success) {
        // Log admin action
        await logAdminAction('CREATE_HALL', {
          hall_name: hallData.name,
          location: hallData.location,
          capacity: hallData.capacity
        });

        setHallModalVisible(false);
        Alert.alert("Success", "Hall created successfully!");
        await loadDashboardData(); // Refresh data
      } else {
        Alert.alert("Error", response.error || "Failed to create hall");
      }
    } catch (error) {
      console.error('Error creating hall:', error);
      Alert.alert("Error", "Failed to create hall");
    }
  };

  // Admin Management Functions
  const handleAddAdmin = () => {
    setSelectedAdmin(null);
    setNewAdminData({ name: '', role: '', email: '', password: '' });
    setAdminModalVisible(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setNewAdminData({
      name: admin.name,
      role: admin.role,
      email: admin.email,
      password: '' // Don't pre-fill password for security
    });
    setAdminModalVisible(true);
  };

  const submitAdminData = async () => {
    if (!newAdminData.name || !newAdminData.role || !newAdminData.email) {
      Alert.alert("Error", "Please fill all required fields (Name, Role, Email)");
      return;
    }

    if (!selectedAdmin && !newAdminData.password) {
      Alert.alert("Error", "Password is required for new admin accounts");
      return;
    }

    try {
      if (selectedAdmin) {
        // Edit existing admin
        const adminData = {
          name: newAdminData.name.trim(),
          role: newAdminData.role.trim(),
          email: newAdminData.email.trim(),
          ...(newAdminData.password && { password: newAdminData.password })
        };

        const response = await bookingAPI.updateAdminUser(selectedAdmin.id, adminData);
        
        if (response.success) {
          // Log admin action
          await logAdminAction('UPDATE_ADMIN', {
            admin_id: selectedAdmin.id,
            admin_name: adminData.name,
            admin_role: adminData.role
          });

          Alert.alert("Success", response.message || "Admin updated successfully!");
          await loadDashboardData(); // Refresh data
        } else {
          Alert.alert("Error", response.error || "Failed to update admin");
        }
      } else {
        // Add new admin
        const adminData = {
          name: newAdminData.name.trim(),
          role: newAdminData.role.trim(),
          email: newAdminData.email.trim(),
          password: newAdminData.password,
          permissions: ['bookings', 'halls'] // Default permissions
        };

        const response = await bookingAPI.createAdminUser(adminData);
        
        if (response.success) {
          // Log admin action
          await logAdminAction('CREATE_ADMIN', {
            admin_name: adminData.name,
            admin_role: adminData.role,
            admin_email: adminData.email
          });

          Alert.alert("Success", response.message || "Admin added successfully!");
          await loadDashboardData(); // Refresh data
        } else {
          Alert.alert("Error", response.error || "Failed to create admin");
        }
      }

      setAdminModalVisible(false);
    } catch (error) {
      console.error('Error managing admin:', error);
      Alert.alert("Error", "Failed to save admin data");
    }
  };

  const handleDeleteAdmin = async (admin) => {
    console.log('Delete admin function called with:', admin);
    
    Alert.alert(
      "Delete Admin User",
      `Are you sure you want to permanently delete "${admin.name}"?\n\nThis action cannot be undone and will remove all access for this admin.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log('Attempting to delete admin with ID:', admin.id);
              const response = await bookingAPI.deleteAdminUser(admin.id);
              console.log('Delete response:', response);
              
              if (response.success) {
                // Log the deletion action
                await logAdminAction('DELETE_ADMIN', {
                  deleted_admin_name: admin.name,
                  deleted_admin_email: admin.email,
                  deleted_admin_role: admin.role
                });

                Alert.alert("Success", response.message || "Admin deleted successfully!");
                await loadDashboardData(); // Refresh the admin list
              } else {
                console.error('Delete failed:', response);
                Alert.alert("Error", response.error || "Failed to delete admin user");
              }
            } catch (error) {
              console.error('Error deleting admin:', error);
              Alert.alert("Error", "Failed to delete admin user");
            }
          }
        }
      ]
    );
  };

  // Calculate statistics from dashboard data or fallback to local calculations
  const totalBookings = dashboardStats.total_bookings !== undefined ? dashboardStats.total_bookings : bookings.length;
  const pendingCount = dashboardStats.pending_bookings !== undefined ? dashboardStats.pending_bookings : bookings.filter(b => b.status === "pending").length;
  const approvedCount = dashboardStats.approved_bookings !== undefined ? dashboardStats.approved_bookings : bookings.filter(b => b.status === "approved").length;
  const priorityCount = dashboardStats.priority_bookings !== undefined ? dashboardStats.priority_bookings : bookings.filter(b => b.priority_booking || b.status === "priority").length;
  const availableHalls = dashboardStats.total_halls !== undefined ? dashboardStats.total_halls : halls.filter(h => h.available).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Professional Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>👤</Text>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>
              {adminData?.name ? `Welcome, ${adminData.name}` : 'Manage your booking system efficiently'}
            </Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {isLargeScreen ? (
            // Single row for large screens
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.primaryCard, { width: getStatCardWidth() }]}>
                <Text style={styles.statNumber}>{totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
                <Text style={styles.statIcon}>📊</Text>
              </View>
              <View style={[styles.statCard, styles.warningCard, { width: getStatCardWidth() }]}>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statIcon}>⏳</Text>
              </View>
              <View style={[styles.statCard, styles.successCard, { width: getStatCardWidth() }]}>
                <Text style={styles.statNumber}>{priorityCount}</Text>
                <Text style={styles.statLabel}>Priority</Text>
                <Text style={styles.statIcon}>🔥</Text>
              </View>
              <View style={[styles.statCard, styles.availableCard, { width: getStatCardWidth() }]}>
                <Text style={styles.statNumber}>{availableHalls}</Text>
                <Text style={styles.statLabel}>Available Halls</Text>
                <Text style={styles.statIcon}>🏛️</Text>
              </View>
            </View>
          ) : (
            // Two rows for smaller screens
            <>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.primaryCard]}>
                  <Text style={styles.statNumber}>{totalBookings}</Text>
                  <Text style={styles.statLabel}>Total Bookings</Text>
                  <Text style={styles.statIcon}>📊</Text>
                </View>
                <View style={[styles.statCard, styles.warningCard]}>
                  <Text style={styles.statNumber}>{pendingCount}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                  <Text style={styles.statIcon}>⏳</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.successCard]}>
                  <Text style={styles.statNumber}>{priorityCount}</Text>
                  <Text style={styles.statLabel}>Priority</Text>
                  <Text style={styles.statIcon}>🔥</Text>
                </View>
                <View style={[styles.statCard, styles.availableCard]}>
                  <Text style={styles.statNumber}>{availableHalls}</Text>
                  <Text style={styles.statLabel}>Available Halls</Text>
                  <Text style={styles.statIcon}>🏛️</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Booking Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Requests</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => {
                try {
                  console.log('View All button pressed');
                  console.log('Prop navigation exists:', !!navigation);
                  console.log('Hook navigation exists:', !!hookNavigation);
                  console.log('Using navigation:', !!navigationToUse);
                  
                  if (navigationToUse && navigationToUse.navigate) {
                    console.log('Navigating to ViewAllBookings...');
                    navigationToUse.navigate('ViewAllBookings');
                  } else {
                    console.error('No navigation method available');
                    Alert.alert('Error', 'Navigation not available. Please restart the app.');
                  }
                } catch (error) {
                  console.error('Error navigating to ViewAllBookings:', error);
                  Alert.alert('Error', 'Failed to navigate to bookings page: ' + error.message);
                }
              }}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {bookings.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateTitle}>No Booking Requests</Text>
              <Text style={styles.emptyStateText}>
                No booking requests have been submitted yet. When users submit booking requests, they will appear here for your review and approval.
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setPriorityModalVisible(true)}
              >
                <Text style={styles.emptyStateButtonText}>Create Priority Booking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Sort bookings: pending first, then by booking date (newest first)
            bookings
              .sort((a, b) => {
                // First priority: status (pending first)
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (b.status === 'pending' && a.status !== 'pending') return 1;
                
                // Second priority: booking date (newest first)
                const dateA = new Date(a.booking_date || a.submittedAt || 0);
                const dateB = new Date(b.booking_date || b.submittedAt || 0);
                return dateB - dateA;
              })
              .slice(0, 3)
              .map((item) => (
            <View key={item.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.hallInfo}>
                  <Text style={styles.hallName}>{item.hall?.name || item.name}</Text>
                  <Text style={styles.timeText}>🕐 {item.timeSlot || item.time}</Text>
                  <Text style={styles.timeText}>📅 {item.booking_date}</Text>
                  <Text style={styles.timeText}>📧 {item.eventTitle || item.event_title}</Text>
                </View>
                <View style={[styles.statusBadge, styles[`${item.status}Status`]]}>
                  <Text style={[styles.statusText, styles[`${item.status}StatusText`]]}>
                    {item.priority_booking ? '🔥 PRIORITY' : item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {item.rejectionReason && (
                <View style={styles.reasonContainer}>
                  <Text style={styles.reasonText}>💬 {item.rejectionReason}</Text>
                </View>
              )}

              {item.priority_booking && (
                <View style={styles.priorityInfo}>
                  <Text style={styles.priorityText}>
                    🏢 Organization: {item.organization}
                  </Text>
                  <Text style={styles.priorityText}>
                    📝 Event: {item.eventTitle}
                  </Text>
                  <Text style={styles.priorityText}>
                    👤 Contact: {item.name}
                  </Text>
                </View>
              )}

              {(item.status === "pending" || item.status === "approved") && (
                <View style={styles.actionButtons}>
                  {item.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(item)}
                    >
                      <Text style={styles.actionBtnText}>✓ Approve</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => openRejectModal(item)}
                  >
                    <Text style={styles.actionBtnText}>
                      {item.status === "approved" ? "✗ Urgent Reject" : "✗ Reject"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            ))
          )}
        </View>

        {/* Hall Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hall Availability</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddHall}
            >
              <Text style={styles.addButtonText}>+ Add Hall</Text>
            </TouchableOpacity>
          </View>
          
          {halls.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🏛️</Text>
              <Text style={styles.emptyStateTitle}>No Halls Available</Text>
              <Text style={styles.emptyStateText}>
                No halls have been added to the system yet. Add halls to start accepting booking requests from users.
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleAddHall}
              >
                <Text style={styles.emptyStateButtonText}>Add Your First Hall</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.hallsGrid}>
              {halls.map((hall) => (
                <View key={hall.id} style={[styles.hallCard, { width: getCardWidth() }]}>
                  <View style={styles.hallCardHeader}>
                    <Text style={styles.hallCardIcon}>{hall.icon || '🏛️'}</Text>
                    <Text style={styles.hallCardName}>{hall.name}</Text>
                  </View>
                  <View style={styles.hallCardBody}>
                    <Text style={styles.hallCardLocation}>📍 {hall.location}</Text>
                    <Text style={styles.hallCardCapacity}>👥 {hall.capacity} people</Text>
                    {hall.features && hall.features.length > 0 && (
                      <Text style={styles.hallCardFeatures}>
                        🔧 {hall.features.slice(0, 2).join(', ')}
                        {hall.features.length > 2 && ` +${hall.features.length - 2} more`}
                      </Text>
                    )}
                  </View>
                  <View style={styles.hallCardFooter}>
                    <Text style={[styles.hallStatus, hall.available ? styles.hallAvailable : styles.hallUnavailable]}>
                      {hall.available ? 'Available for Booking' : 'Unavailable - No Bookings'}
                    </Text>
                    <Switch
                      value={hall.available}
                      onValueChange={() => toggleHallAvailability(hall.id)}
                      trackColor={{ false: colors.lightGray, true: colors.success }}
                      thumbColor={hall.available ? colors.white : colors.gray}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Admin Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Admin Management</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAdmin}>
              <Text style={styles.addButtonText}>+ Add Admin</Text>
            </TouchableOpacity>
          </View>
          
          {admins.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>👥</Text>
              <Text style={styles.emptyStateTitle}>No Admin Users</Text>
              <Text style={styles.emptyStateText}>
                No admin users have been added to the system yet. Add admin users to help manage the booking system efficiently.
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleAddAdmin}
              >
                <Text style={styles.emptyStateButtonText}>Add First Admin</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.adminsContainer}>
              {admins.map((admin) => (
                <View key={admin.id} style={styles.adminCard}>
                  <View style={styles.adminHeader}>
                    <View style={styles.adminInfo}>
                      <Text style={styles.adminName}>{admin.name}</Text>
                      <Text style={styles.adminRole}>{admin.role}</Text>
                      <Text style={styles.adminEmail}>📧 {admin.email}</Text>
                    </View>
                    <View style={styles.adminActions}>
                      <View style={[styles.adminStatusBadge, admin.active ? styles.activeStatus : styles.inactiveStatus]}>
                        <Text style={[styles.adminStatusText, admin.active ? styles.activeStatusText : styles.inactiveStatusText]}>
                          {admin.active ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.adminCardActions}>
                    <TouchableOpacity
                      style={[styles.adminActionBtn, styles.editBtn]}
                      onPress={() => handleEditAdmin(admin)}
                    >
                      <Text style={styles.adminActionText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.adminActionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteAdmin(admin)}
                    >
                      <Text style={styles.adminActionText}>
                        🗑️ Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={[styles.quickActions, isTablet && styles.quickActionsTablet]}>
            <TouchableOpacity
              style={[
                styles.quickActionBtn, 
                styles.priorityBtn,
                isTablet && styles.quickActionBtnTablet
              ]}
              onPress={handlePriorityBooking}
            >
              <Text style={[styles.quickActionIcon, isTablet && styles.quickActionIconTablet]}>🔥</Text>
              <Text style={[styles.quickActionText, isTablet && styles.quickActionTextTablet]}>Priority Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickActionBtn, 
                styles.reportsBtn,
                isTablet && styles.quickActionBtnTablet
              ]}
              onPress={handleGenerateReports}
            >
              <Text style={[styles.quickActionIcon, isTablet && styles.quickActionIconTablet]}>📊</Text>
              <Text style={[styles.quickActionText, isTablet && styles.quickActionTextTablet]}>Generate Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Reject Reason Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedBooking?.status === "approved"
                ? "Urgent Reject Approved Booking"
                : "Reject Booking"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason for rejection"
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.reject]}
                onPress={confirmReject}
              >
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: "gray" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Priority Booking Modal */}
      <Modal
        visible={priorityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPriorityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.priorityModalContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.priorityModalContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>🔥 Priority Booking</Text>
              
              {/* Hall Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Hall Name *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={priorityBookingData.hall}
                    onValueChange={(value) => handleHallOrDateChange('hall', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Hall" value="" />
                    {halls.map((hall) => (
                      <Picker.Item key={hall.id} label={hall.name} value={hall.id} />
                    ))}
                  </Picker>
                </View>
              </View>
              
              {/* Date Picker */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Date *</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton} 
                  onPress={showDatePickerModal}
                >
                  <Text style={styles.datePickerText}>
                    {priorityBookingData.date 
                      ? selectedDate.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        })
                      : 'Select Date'
                    }
                  </Text>
                  <Text style={styles.datePickerIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              
              {/* Time Slot Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Time Slot *</Text>
                <View style={[styles.pickerWrapper, loadingTimeSlots && styles.pickerLoading]}>
                  {loadingTimeSlots ? (
                    <View style={styles.loadingTimeSlots}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingText}>Loading time slots...</Text>
                    </View>
                  ) : (
                    <Picker
                      selectedValue={priorityBookingData.time}
                      onValueChange={(value) => {
                        console.log('Selected time slot:', value);
                        setPriorityBookingData({...priorityBookingData, time: value});
                      }}
                      style={styles.picker}
                      enabled={availableTimeSlots.length > 0}
                    >
                      {availableTimeSlots.length === 0 ? (
                        <Picker.Item 
                          label={priorityBookingData.hall && priorityBookingData.date ? "No slots available" : "Select hall and date first"} 
                          value="" 
                        />
                      ) : (
                        <>
                          <Picker.Item label="Select Time Slot" value="" />
                          {availableTimeSlots.map((slot) => (
                            <Picker.Item 
                              key={slot.id || slot.slot_id} 
                              label={`${slot.start_time} - ${slot.end_time}`} 
                              value={slot.id || slot.slot_id} 
                            />
                          ))}
                        </>
                      )}
                    </Picker>
                  )}
                </View>
              </View>
              
              {/* Department Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Department</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={priorityBookingData.department}
                    onValueChange={(value) => setPriorityBookingData({...priorityBookingData, department: value, otherReason: ''})}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Department" value="" />
                    <Picker.Item label="Placement" value="placement" />
                    <Picker.Item label="Head Office" value="head_office" />
                    <Picker.Item label="Other" value="other" />
                  </Picker>
                </View>
              </View>

              {/* Other Reason Input - Show when 'other' is selected */}
              {priorityBookingData.department === 'other' && (
                <TextInput
                  style={styles.input}
                  placeholder="Specify reason for Other department *"
                  value={priorityBookingData.otherReason}
                  onChangeText={(text) => setPriorityBookingData({...priorityBookingData, otherReason: text})}
                />
              )}
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Purpose of booking"
                value={priorityBookingData.purpose}
                onChangeText={(text) => setPriorityBookingData({...priorityBookingData, purpose: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Requester Name"
                value={priorityBookingData.requester}
                onChangeText={(text) => setPriorityBookingData({...priorityBookingData, requester: text})}
              />
              
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.prioritySubmitBtn]}
                onPress={submitPriorityBooking}
              >
                <Text style={styles.btnText}>🔥 Create Priority Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.reject]}
                onPress={() => setPriorityModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setTempSelectedDate(selectedDate); // Reset temp date
                  setShowDatePicker(false);
                }}
                style={styles.datePickerCancelBtn}
              >
                <Text style={[styles.datePickerBtnText, {color: colors.primary}]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity 
                onPress={() => handleDateSelection(tempSelectedDate)}
                style={styles.datePickerDoneBtn}
              >
                <Text style={styles.datePickerBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.datePickerContent} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((date, index) => {
                const dateString = date.toISOString().split('T')[0];
                const isSelected = tempSelectedDate.toISOString().split('T')[0] === dateString;
                const displayDate = date.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });
                
                return (
                  <TouchableOpacity
                    key={dateString}
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionSelected
                    ]}
                    onPress={() => setTempSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dateOptionText,
                      isSelected && styles.dateOptionTextSelected
                    ]}>
                      {displayDate}
                    </Text>
                    {index === 0 && (
                      <Text style={styles.dateOptionLabel}>Today</Text>
                    )}
                    {index === 1 && (
                      <Text style={styles.dateOptionLabel}>Tomorrow</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Admin Management Modal */}
      <Modal
        visible={adminModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedAdmin ? '✏️ Edit Admin' : '➕ Add New Admin'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={newAdminData.name}
              onChangeText={(text) => setNewAdminData({...newAdminData, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Role (e.g., Super Admin, Placement Admin) *"
              value={newAdminData.role}
              onChangeText={(text) => setNewAdminData({...newAdminData, role: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              value={newAdminData.email}
              onChangeText={(text) => setNewAdminData({...newAdminData, email: text})}
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder={selectedAdmin ? "New Password (leave empty to keep current)" : "Password *"}
              value={newAdminData.password}
              onChangeText={(text) => setNewAdminData({...newAdminData, password: text})}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.approve]}
                onPress={submitAdminData}
              >
                <Text style={styles.btnText}>
                  {selectedAdmin ? '💾 Update' : '➕ Add Admin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.reject]}
                onPress={() => setAdminModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hall Creation Modal */}
      <Modal
        visible={hallModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHallModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🏛️ Add New Hall</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Hall Name *"
              value={newHallData.name}
              onChangeText={(text) => setNewHallData({...newHallData, name: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Location *"
              value={newHallData.location}
              onChangeText={(text) => setNewHallData({...newHallData, location: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Capacity (number of people) *"
              value={newHallData.capacity}
              onChangeText={(text) => setNewHallData({...newHallData, capacity: text})}
              keyboardType="numeric"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Features (comma-separated, e.g., AC, Projector, WiFi)"
              value={newHallData.features}
              onChangeText={(text) => setNewHallData({...newHallData, features: text})}
              multiline
            />
            
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Hall Icon</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={newHallData.icon}
                  onValueChange={(value) => setNewHallData({...newHallData, icon: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="🏛️ Classic Hall" value="🏛️" />
                  <Picker.Item label="🎭 Auditorium" value="🎭" />
                  <Picker.Item label="🏢 Conference Room" value="🏢" />
                  <Picker.Item label="🎪 Event Hall" value="🎪" />
                  <Picker.Item label="📚 Library Hall" value="📚" />
                  <Picker.Item label="🎨 Art Gallery" value="🎨" />
                  <Picker.Item label="🏟️ Sports Hall" value="🏟️" />
                  <Picker.Item label="🎵 Music Hall" value="🎵" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.button, styles.approve]}
                onPress={submitHallData}
              >
                <Text style={styles.btnText}>🏛️ Create Hall</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.reject]}
                onPress={() => setHallModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header Styles
   headerContainer: {
    backgroundColor: colors.primary,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
  },

  // Row layout for title + logout button
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 10, // optional for rounded corners
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  logoutIcon: {
    fontSize: 16,
    marginRight: 6,
    color: colors.white,
  },

  logoutText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
title: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },

  // Statistics Section
  statsContainer: {
    paddingHorizontal: getResponsiveValue(16, 24, 32),
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveValue(12, 15, 18),
    flexWrap: isLargeScreen ? 'nowrap' : 'wrap',
  },
  statCard: {
    ...globalStyles.card,
    flex: isLargeScreen ? 0 : 1,
    marginHorizontal: getResponsiveValue(4, 6, 8),
    marginBottom: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    paddingVertical: getResponsiveValue(16, 20, 24),
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    position: 'relative',
    overflow: 'hidden',
    minHeight: getResponsiveValue(80, 100, 120),
  },
  primaryCard: {
    backgroundColor: colors.primary,
  },
  warningCard: {
    backgroundColor: colors.warning,
  },
  successCard: {
    backgroundColor: colors.success,
  },
  availableCard: {
    backgroundColor: colors.secondary,
  },
  statNumber: {
    ...typography.h1,
    color: colors.white,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statIcon: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 16,
    opacity: 0.7,
  },

  // Section Styles
  section: {
    paddingHorizontal: getResponsiveValue(16, 24, 32),
    marginBottom: getResponsiveValue(24, 32, 40),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    fontWeight: '600',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.light,
    borderRadius: 12,
  },
  viewAllText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },

  // Booking Card Styles
  bookingCard: {
    ...globalStyles.card,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hallInfo: {
    flex: 1,
  },
  hallName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  timeText: {
    ...typography.small,
    color: colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  pendingStatus: {
    backgroundColor: '#FEF3C7',
  },
  approvedStatus: {
    backgroundColor: '#D1FAE5',
  },
  rejectedStatus: {
    backgroundColor: '#FEE2E2',
  },
  priorityStatus: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  pendingStatusText: {
    color: '#B45309',
  },
  approvedStatusText: {
    color: '#059669',
  },
  rejectedStatusText: {
    color: '#DC2626',
  },
  priorityStatusText: {
    color: '#D97706',
  },
  reasonContainer: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    ...typography.small,
    color: colors.danger,
    fontStyle: 'italic',
  },
  priorityInfo: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  priorityText: {
    ...typography.small,
    color: '#D97706',
    marginBottom: 4,
  },

  // Action Button Styles
  actionButtons: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveValue(6, 8, 10),
  },
  actionBtn: {
    flex: isSmallScreen ? 0 : 1,
    paddingVertical: getResponsiveValue(8, 10, 12),
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    borderRadius: getResponsiveValue(6, 8, 10),
    alignItems: 'center',
    marginHorizontal: isSmallScreen ? 0 : getResponsiveValue(2, 4, 6),
    marginBottom: isSmallScreen ? 8 : 0,
    minHeight: getResponsiveValue(36, 44, 52),
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  rejectBtn: {
    backgroundColor: colors.danger,
  },
  actionBtnText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },

  // Hall Management Styles
  hallsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isLargeScreen ? 'flex-start' : 'space-between',
  },
  hallCard: {
    ...globalStyles.card,
    marginBottom: getResponsiveValue(12, 16, 20),
    padding: getResponsiveValue(12, 16, 20),
    marginRight: isLargeScreen ? 12 : 0,
  },
  hallCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hallCardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  hallCardName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  hallCardBody: {
    marginBottom: 12,
  },
  hallCardLocation: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: 4,
  },
  hallCardCapacity: {
    ...typography.small,
    color: colors.textLight,
    marginBottom: 4,
  },
  hallCardFeatures: {
    ...typography.small,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  hallCardFooter: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  hallStatus: {
    ...typography.small,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  hallAvailable: {
    color: colors.success,
    backgroundColor: '#E8F5E8',
  },
  hallUnavailable: {
    color: colors.danger,
    backgroundColor: '#FEE8E8',
  },

  // Quick Actions
  quickActions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
  },
  quickActionsTablet: {
    justifyContent: 'center',
  },
  quickActionBtn: {
    ...globalStyles.card,
    flex: isSmallScreen ? 0 : 1,
    alignItems: 'center',
    paddingVertical: getResponsiveValue(24, 32, 40),
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    marginHorizontal: isSmallScreen ? 0 : getResponsiveValue(4, 6, 8),
    marginBottom: isSmallScreen ? 12 : 0,
    minHeight: getResponsiveValue(100, 120, 140),
  },
  quickActionBtnTablet: {
    maxWidth: 250,
    marginHorizontal: 12,
    minHeight: 150,
    paddingVertical: 36,
  },
  priorityBtn: {
    backgroundColor: colors.warning,
  },
  reportsBtn: {
    backgroundColor: colors.secondary,
  },
  settingsBtn: {
    backgroundColor: colors.primary,
  },
  quickActionIcon: {
    fontSize: getResponsiveValue(28, 36, 44),
    marginBottom: getResponsiveValue(8, 12, 16),
  },
  quickActionIconTablet: {
    fontSize: 48,
    marginBottom: 16,
  },
  quickActionText: {
    ...typography.body,
    fontSize: getResponsiveValue(16, 18, 20),
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: getResponsiveValue(20, 24, 28),
  },
  quickActionTextTablet: {
    fontSize: 20,
    lineHeight: 26,
  },

  // Admin Management Styles
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },
  adminsContainer: {
    marginTop: 8,
  },
  adminCard: {
    ...globalStyles.card,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 4,
  },
  adminRole: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminEmail: {
    ...typography.small,
    color: colors.textLight,
  },
  adminActions: {
    alignItems: 'flex-end',
  },
  adminStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  activeStatus: {
    backgroundColor: '#D1FAE5',
  },
  inactiveStatus: {
    backgroundColor: '#FEE2E2',
  },
  adminStatusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  activeStatusText: {
    color: '#059669',
  },
  inactiveStatusText: {
    color: '#DC2626',
  },
  adminCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  adminActionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  activateBtn: {
    backgroundColor: colors.success,
  },
  deactivateBtn: {
    backgroundColor: colors.danger,
  },
  deleteBtn: {
    backgroundColor: '#dc3545', // Strong red for delete action
  },
  adminActionText: {
    ...typography.small,
    color: colors.white,
    fontWeight: '600',
  },

  // Modal Styles (Enhanced)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    backgroundColor: colors.white,
    padding: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(16, 20, 24),
    width: getResponsiveValue('95%', '85%', '75%'),
    maxWidth: getResponsiveValue(350, 400, 500),
    ...globalStyles.shadow,
  },
  priorityModalContainer: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(16, 20, 24),
    width: getResponsiveValue('95%', '85%', '75%'),
    maxWidth: getResponsiveValue(450, 500, 600),
    maxHeight: getResponsiveValue('90%', '85%', '80%'),
    ...globalStyles.shadow,
    flex: 0,
  },
  
  priorityModalContent: {
    padding: getResponsiveValue(20, 24, 32),
    paddingBottom: getResponsiveValue(10, 15, 20),
  },
  
  // Dropdown Styles
  dropdownContainer: {
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  dropdownLabel: {
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: getResponsiveValue(8, 12, 16),
    backgroundColor: colors.background,
    minHeight: getResponsiveValue(44, 48, 52),
    justifyContent: 'center',
  },
  picker: {
    height: getResponsiveValue(44, 48, 52),
    color: colors.text,
  },
  pickerLoading: {
    opacity: 0.6,
  },
  loadingTimeSlots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveValue(12, 16, 20),
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: getResponsiveValue(8, 12, 16),
    backgroundColor: colors.background,
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    paddingVertical: getResponsiveValue(12, 16, 20),
    minHeight: getResponsiveValue(44, 48, 52),
  },
  datePickerText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    flex: 1,
  },
  datePickerIcon: {
    fontSize: getResponsiveValue(16, 18, 20),
    marginLeft: 10,
  },
  
  // Text Area Style
  textArea: {
    minHeight: getResponsiveValue(80, 90, 100),
    paddingTop: getResponsiveValue(12, 16, 20),
  },
  
  // Custom Date Picker Modal Styles
  datePickerModalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    paddingBottom: 34, // Safe area for iOS
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  datePickerCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  datePickerBtnText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
  },
  datePickerContent: {
    maxHeight: 300,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  dateOptionSelected: {
    backgroundColor: colors.light,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dateOptionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dateOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  dateOptionLabel: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: getResponsiveValue(18, 20, 24),
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: getResponsiveValue(8, 12, 16),
    padding: getResponsiveValue(12, 16, 20),
    marginBottom: getResponsiveValue(16, 20, 24),
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: getResponsiveValue(44, 48, 52),
  },
  modalActions: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    paddingVertical: getResponsiveValue(16, 20, 24),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    borderBottomLeftRadius: getResponsiveValue(16, 20, 24),
    borderBottomRightRadius: getResponsiveValue(16, 20, 24),
  },
  button: {
    flex: isSmallScreen ? 0 : 1,
    paddingVertical: getResponsiveValue(10, 12, 14),
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    borderRadius: getResponsiveValue(8, 10, 12),
    alignItems: 'center',
    marginHorizontal: isSmallScreen ? 0 : getResponsiveValue(4, 6, 8),
    marginBottom: isSmallScreen ? 10 : 0,
    minHeight: getResponsiveValue(44, 48, 52),
  },
  approve: {
    backgroundColor: colors.success,
  },
  prioritySubmitBtn: {
    backgroundColor: colors.warning,
  },
  reject: {
    backgroundColor: colors.gray,
  },
  btnText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: getResponsiveValue(12, 14, 16),
    color: colors.textLight,
    marginLeft: 8,
    textAlign: 'center',
  },
  
  // Empty state styles
  emptyStateContainer: {
    ...globalStyles.card,
    alignItems: 'center',
    paddingVertical: getResponsiveValue(40, 50, 60),
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    marginVertical: getResponsiveValue(8, 12, 16),
  },
  emptyStateIcon: {
    fontSize: getResponsiveValue(48, 64, 80),
    marginBottom: getResponsiveValue(16, 20, 24),
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: getResponsiveValue(18, 20, 24),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: getResponsiveValue(8, 12, 16),
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: getResponsiveValue(14, 16, 18),
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: getResponsiveValue(20, 24, 28),
    marginBottom: getResponsiveValue(20, 24, 32),
    maxWidth: getResponsiveValue(280, 350, 400),
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: getResponsiveValue(12, 14, 16),
    paddingHorizontal: getResponsiveValue(20, 24, 32),
    borderRadius: getResponsiveValue(8, 10, 12),
    minHeight: getResponsiveValue(44, 48, 52),
    justifyContent: 'center',
  },
  emptyStateButtonText: {
    color: colors.white,
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminScreen;
