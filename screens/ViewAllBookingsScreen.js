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
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";
import { globalStyles } from "../styles/globalStyles";
import bookingAPI from "../services/bookingApi";

const { width, height } = Dimensions.get('window');

// Enhanced responsive breakpoints
const isPhone = width < 768;
const isTablet = width >= 768 && width < 1024;
const isDesktop = width >= 1024;
const isLargeDesktop = width >= 1200;

// Professional spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Enhanced responsive helper functions
const getResponsiveValue = (phone, tablet, desktop, largeDesktop) => {
  if (isLargeDesktop && largeDesktop) return largeDesktop;
  if (isDesktop) return desktop;
  if (isTablet) return tablet;
  return phone;
};

const getColumns = () => {
  if (isLargeDesktop) return 3;
  if (isDesktop) return 2;
  return 1;
};

const ViewAllBookingsScreen = ({ navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Enhanced filter and sort states
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    loadBookings();
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [bookings, statusFilter, sortBy, searchQuery]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingAPI.getAllBookings();
      
      if (response.success) {
        setBookings(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...bookings];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        (booking.name && booking.name.toLowerCase().includes(query)) ||
        (booking.eventTitle && booking.eventTitle.toLowerCase().includes(query)) ||
        (booking.hall && booking.hall.name && booking.hall.name.toLowerCase().includes(query)) ||
        (booking.organization && booking.organization.toLowerCase().includes(query)) ||
        (booking.booking_id && booking.booking_id.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0);
        case 'oldest':
          return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
        case 'date_asc':
          return new Date(a.booking_date || 0) - new Date(b.booking_date || 0);
        case 'date_desc':
          return new Date(b.booking_date || 0) - new Date(a.booking_date || 0);
        case 'hall_name':
          const aHall = (a.hall && a.hall.name) || '';
          const bHall = (b.hall && b.hall.name) || '';
          return aHall.localeCompare(bHall);
        case 'requester':
          const aName = a.name || '';
          const bName = b.name || '';
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    setFilteredBookings(filtered);
  };

  const handleApprove = async (booking) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.approveBooking(booking.booking_id);
      
      if (response.success) {
        setBookings(prev => 
          prev.map(b => 
            b.booking_id === booking.booking_id 
              ? { ...b, status: 'approved' } 
              : b
          )
        );
        Alert.alert('✅ Success', 'Booking approved successfully!');
      } else {
        Alert.alert('Error', response.error || 'Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      Alert.alert('Error', 'Failed to approve booking');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert("⚠️ Error", "Please provide a reason for rejection");
      return;
    }

    try {
      setActionLoading(true);
      const response = await bookingAPI.rejectBooking(selectedBooking.booking_id, rejectReason);
      
      if (response.success) {
        setBookings(prev => 
          prev.map(b => 
            b.booking_id === selectedBooking.booking_id 
              ? { ...b, status: 'rejected', rejectionReason: rejectReason } 
              : b
          )
        );
        setModalVisible(false);
        Alert.alert('❌ Booking Rejected', `Reason: ${rejectReason}`);
      } else {
        Alert.alert('Error', response.error || 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert('Error', 'Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return colors.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '📝';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBookingCard = ({ item, index }) => (
    <Animated.View 
      style={[
        styles.bookingCard,
        {
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, 50 * (index % 3 + 1)],
            })
          }],
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Card Header with Priority Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.bookingIdSection}>
          <Text style={styles.bookingId}>#{item.booking_id}</Text>
          {item.priority_booking && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>🔥 PRIORITY</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(item.status)} {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Main Event Info */}
        <View style={styles.eventSection}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.eventTitle || 'Untitled Event'}</Text>
          <Text style={styles.requesterName}>👤 {item.name || 'Unknown'}</Text>
          {item.organization && (
            <Text style={styles.organization}>🏢 {item.organization}</Text>
          )}
        </View>

        {/* Booking Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🏛️</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Hall</Text>
              <Text style={styles.detailValue}>{item.hall?.name || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{item.booking_date ? formatDate(item.booking_date) : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🕐</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{item.timeSlot || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>👥</Text>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Attendees</Text>
              <Text style={styles.detailValue}>{item.attendees || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={styles.contactText} numberOfLines={1}>{item.email || 'N/A'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Text style={styles.contactIcon}>📱</Text>
            <Text style={styles.contactText}>{item.phone || 'N/A'}</Text>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionLabel}>📝 Description</Text>
            <Text style={styles.descriptionText} numberOfLines={3}>{item.description}</Text>
          </View>
        )}

        {/* Rejection Reason */}
        {item.rejectionReason && (
          <View style={styles.rejectionSection}>
            <Text style={styles.rejectionLabel}>❌ Rejection Reason</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metaSection}>
          <Text style={styles.submittedAt}>
            Submitted: {item.submittedAt ? formatDateTime(item.submittedAt) : 'N/A'}
          </Text>
        </View>

        {/* Action Buttons for Pending Bookings */}
        {item.status === 'pending' && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApprove(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => openRejectModal(item)}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>✗ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderFilterSection = () => (
    <View style={styles.filtersContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bookings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.lightGray}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? '🔽 Hide Filters' : '🔼 Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Collapsible Filters */}
      {showFilters && (
        <Animated.View style={styles.filterOptions}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={statusFilter}
                  onValueChange={setStatusFilter}
                  style={styles.picker}
                >
                  <Picker.Item label="All Status" value="all" />
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="Approved" value="approved" />
                  <Picker.Item label="Rejected" value="rejected" />
                </Picker>
              </View>
            </View>

            {/* Sort Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>Sort By</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={sortBy}
                  onValueChange={setSortBy}
                  style={styles.picker}
                >
                  <Picker.Item label="Newest First" value="newest" />
                  <Picker.Item label="Oldest First" value="oldest" />
                  <Picker.Item label="Event Date ↑" value="date_asc" />
                  <Picker.Item label="Event Date ↓" value="date_desc" />
                  <Picker.Item label="Hall Name" value="hall_name" />
                  <Picker.Item label="Requester" value="requester" />
                </Picker>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );

  const getSummaryStats = () => {
    const total = bookings.length;
    const filtered = filteredBookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const approved = bookings.filter(b => b.status === 'approved').length;
    const rejected = bookings.filter(b => b.status === 'rejected').length;
    return { total, filtered, pending, approved, rejected };
  };

  const summary = getSummaryStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Professional Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>All Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage booking requests</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.totalCard]}>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, styles.pendingCard]}>
          <Text style={[styles.summaryNumber, { color: '#F59E0B' }]}>{summary.pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
        <View style={[styles.summaryCard, styles.approvedCard]}>
          <Text style={[styles.summaryNumber, { color: '#10B981' }]}>{summary.approved}</Text>
          <Text style={styles.summaryLabel}>Approved</Text>
        </View>
        <View style={[styles.summaryCard, styles.rejectedCard]}>
          <Text style={[styles.summaryNumber, { color: '#EF4444' }]}>{summary.rejected}</Text>
          <Text style={styles.summaryLabel}>Rejected</Text>
        </View>
      </View>

      {/* Enhanced Filters */}
      {renderFilterSection()}

      {/* Results Info */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          Showing {summary.filtered} of {summary.total} bookings
        </Text>
      </View>

      {/* Bookings List */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery || statusFilter !== 'all' 
                ? 'No bookings match your current filters.'
                : 'No booking requests have been submitted yet.'
              }
            </Text>
            {(searchQuery || statusFilter !== 'all') && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            numColumns={getColumns()}
            key={getColumns()}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={getColumns() > 1 ? styles.row : null}
          />
        )}
      </Animated.View>

      {/* Enhanced Reject Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Booking</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Please provide a detailed reason for rejecting this booking request:
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.lightGray}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={confirmReject}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject Booking</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Professional Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveValue(spacing.md, spacing.lg, spacing.xl, spacing.xxl),
    paddingVertical: getResponsiveValue(spacing.md, spacing.lg, spacing.lg, spacing.xl),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveValue(20, 22, 24, 28),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: getResponsiveValue(14, 15, 16, 18),
    color: '#64748B',
    fontWeight: '500',
  },
  headerActions: {
    width: 44,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // Enhanced Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveValue(spacing.md, spacing.lg, spacing.xl, spacing.xxl),
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  totalCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FED7AA',
  },
  approvedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  rejectedCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  summaryNumber: {
    fontSize: getResponsiveValue(24, 28, 32, 36),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: getResponsiveValue(12, 13, 14, 16),
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Enhanced Filters
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveValue(spacing.md, spacing.lg, spacing.xl, spacing.xxl),
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
    color: '#64748B',
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveValue(14, 15, 16, 18),
    color: '#1E293B',
    paddingVertical: spacing.md,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },
  filterToggle: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterToggleText: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    color: colors.primary,
    fontWeight: '600',
  },
  filterOptions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  filterGroup: {
    marginRight: spacing.lg,
    minWidth: getResponsiveValue(140, 160, 180, 200),
  },
  filterGroupLabel: {
    fontSize: getResponsiveValue(12, 13, 14, 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  picker: {
    height: getResponsiveValue(44, 48, 52, 56),
    color: '#374151',
  },

  // Results
  resultsContainer: {
    paddingHorizontal: getResponsiveValue(spacing.md, spacing.lg, spacing.xl, spacing.xxl),
    paddingVertical: spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  resultsText: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    color: '#64748B',
    fontWeight: '500',
  },

  // List Container
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: getResponsiveValue(spacing.md, spacing.lg, spacing.xl, spacing.xxl),
    paddingTop: spacing.lg,
  },
  row: {
    justifyContent: 'space-between',
  },

  // Professional Booking Cards
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: getResponsiveValue(spacing.lg, spacing.xl, spacing.xl, spacing.xxl),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    flex: getColumns() > 1 ? 1 : undefined,
    marginHorizontal: getColumns() > 1 ? spacing.xs : 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bookingIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingId: {
    fontSize: getResponsiveValue(16, 17, 18, 20),
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: spacing.sm,
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: getResponsiveValue(11, 12, 13, 14),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card Content
  cardContent: {
    padding: spacing.lg,
  },
  eventSection: {
    marginBottom: spacing.lg,
  },
  eventTitle: {
    fontSize: getResponsiveValue(18, 19, 20, 22),
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: spacing.sm,
    lineHeight: getResponsiveValue(24, 26, 28, 30),
  },
  requesterName: {
    fontSize: getResponsiveValue(15, 16, 17, 18),
    color: '#374151',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  organization: {
    fontSize: getResponsiveValue(14, 15, 16, 17),
    color: '#64748B',
    fontStyle: 'italic',
  },

  // Details Grid
  detailsGrid: {
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: spacing.md,
    width: 20,
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: getResponsiveValue(12, 13, 14, 15),
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: getResponsiveValue(14, 15, 16, 17),
    color: '#1E293B',
    fontWeight: '600',
  },

  // Contact Section
  contactSection: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 14,
    marginRight: spacing.sm,
  },
  contactText: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },

  // Description Section
  descriptionSection: {
    marginBottom: spacing.lg,
    backgroundColor: '#F0F9FF',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  descriptionLabel: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    fontWeight: '600',
    color: '#0C4A6E',
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: getResponsiveValue(14, 15, 16, 17),
    color: '#374151',
    lineHeight: getResponsiveValue(20, 22, 24, 26),
  },

  // Rejection Section
  rejectionSection: {
    marginBottom: spacing.lg,
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectionLabel: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    fontWeight: '600',
    color: '#B91C1C',
    marginBottom: spacing.sm,
  },
  rejectionText: {
    fontSize: getResponsiveValue(14, 15, 16, 17),
    color: '#7F1D1D',
    lineHeight: getResponsiveValue(20, 22, 24, 26),
  },

  // Meta Section
  metaSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: spacing.lg,
  },
  submittedAt: {
    fontSize: getResponsiveValue(12, 13, 14, 15),
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Action Section
  actionSection: {
    flexDirection: isPhone ? 'column' : 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: isPhone ? 0 : 1,
    paddingVertical: getResponsiveValue(spacing.md, spacing.lg, spacing.lg, spacing.xl),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveValue(48, 52, 56, 60),
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: getResponsiveValue(15, 16, 17, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(spacing.xl, spacing.xxl, spacing.xxl, 80),
    paddingVertical: getResponsiveValue(spacing.xxl, 80, 100, 120),
  },
  emptyIcon: {
    fontSize: getResponsiveValue(80, 96, 112, 128),
    marginBottom: spacing.xl,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: getResponsiveValue(20, 22, 24, 28),
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: getResponsiveValue(16, 17, 18, 20),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: getResponsiveValue(24, 26, 28, 32),
    marginBottom: spacing.xl,
  },
  clearFiltersButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  clearFiltersText: {
    fontSize: getResponsiveValue(15, 16, 17, 18),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: getResponsiveValue(16, 17, 18, 20),
    color: '#64748B',
    marginTop: spacing.lg,
    fontWeight: '500',
  },

  // Enhanced Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(spacing.lg, spacing.xl, spacing.xxl, spacing.xxl),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: getResponsiveValue(400, 480, 560, 640),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: getResponsiveValue(18, 20, 22, 24),
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: getResponsiveValue(15, 16, 17, 18),
    color: '#64748B',
    lineHeight: getResponsiveValue(22, 24, 26, 28),
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    fontSize: getResponsiveValue(15, 16, 17, 18),
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: getResponsiveValue(100, 120, 140, 160),
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'column',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  modalRejectButton: {
    backgroundColor: '#EF4444',
    paddingVertical: getResponsiveValue(spacing.md, spacing.lg, spacing.lg, spacing.xl),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveValue(48, 52, 56, 60),
  },
  modalRejectText: {
    fontSize: getResponsiveValue(16, 17, 18, 20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: getResponsiveValue(spacing.md, spacing.lg, spacing.lg, spacing.xl),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveValue(48, 52, 56, 60),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: getResponsiveValue(16, 17, 18, 20),
    fontWeight: 'bold',
    color: '#374151',
  },
});

export default ViewAllBookingsScreen;