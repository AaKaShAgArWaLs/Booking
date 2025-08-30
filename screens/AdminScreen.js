import React, { useState } from "react";
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
} from "react-native";
import { colors } from "../styles/colors";
import { typography } from "../styles/typography";

const dummyBookings = [
  { id: "1", name: "Hall A", time: "8:45 - 10:45", status: "pending", reason: "" },
  { id: "2", name: "Hall B", time: "11:00 - 01:00", status: "approved", reason: "" },
  { id: "3", name: "Hall C", time: "01:00 - 03:45", status: "pending", reason: "" },
];

const initialHalls = [
  { id: "1", name: "Hall A", available: true },
  { id: "2", name: "Hall B", available: false },
  { id: "3", name: "Hall C", available: true },
];

const AdminScreen = () => {
  const [bookings, setBookings] = useState(dummyBookings);
  const [halls, setHalls] = useState(initialHalls);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Approve Booking
  const handleApprove = (id) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "approved", reason: "" } : b))
    );
    Alert.alert("✅ Booking Approved");
  };

  // Open Reject Modal
  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setRejectReason("");
    setModalVisible(true);
  };

  // Confirm Reject with Reason
  const confirmReject = () => {
    if (!rejectReason.trim()) {
      Alert.alert("⚠️ Please provide a reason");
      return;
    }
    setBookings((prev) =>
      prev.map((b) =>
        b.id === selectedBooking.id
          ? { ...b, status: "rejected", reason: rejectReason }
          : b
      )
    );
    setModalVisible(false);
    Alert.alert("❌ Booking Rejected", `Reason: ${rejectReason}`);
  };

  // Toggle Hall Availability
  const toggleHallAvailability = (id) => {
    setHalls((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, available: !h.available } : h
      )
    );
  };

  // Generate Reports
  const handleGenerateReports = () => {
    Alert.alert("Reports", "PDF/Excel reports will be generated here.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage bookings and hall settings</Text>
        </View>

        {/* View Bookings Section */}
        <Text style={styles.sectionTitle}>📋 Booking Requests</Text>
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                {item.name} - {item.time}
              </Text>
              <Text style={styles.status(item.status)}>{item.status}</Text>

              {item.reason ? (
                <Text style={styles.reason}>Reason: {item.reason}</Text>
              ) : null}

              {(item.status === "pending" || item.status === "approved") && (
                <View style={styles.actions}>
                  {item.status === "pending" && (
                    <TouchableOpacity
                      style={[styles.button, styles.approve]}
                      onPress={() => handleApprove(item.id)}
                    >
                      <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.button, styles.reject]}
                    onPress={() => openRejectModal(item)}
                  >
                    <Text style={styles.btnText}>
                      {item.status === "approved" ? "Urgent Reject" : "Reject"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />

        {/* Manage Hall Availability */}
        <Text style={styles.sectionTitle}>🏛 Hall Availability</Text>
        {halls.map((hall) => (
          <View key={hall.id} style={styles.hallRow}>
            <Text style={styles.hallText}>{hall.name}</Text>
            <Switch
              value={hall.available}
              onValueChange={() => toggleHallAvailability(hall.id)}
              thumbColor={hall.available ? "green" : "red"}
            />
          </View>
        ))}

        {/* Generate Reports */}
        <Text style={styles.sectionTitle}>📊 Reports</Text>
        <TouchableOpacity
          style={[styles.bigButton, { backgroundColor: colors.secondary }]}
          onPress={handleGenerateReports}
        >
          <Text style={styles.btnText}>Generate Reports</Text>
        </TouchableOpacity>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: "center",
  },
  sectionTitle: {
    ...typography.h2,
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    ...typography.body,
    color: colors.text,
    marginBottom: 5,
  },
  status: (status) => ({
    fontWeight: "bold",
    color:
      status === "approved"
        ? "green"
        : status === "rejected"
        ? "red"
        : "orange",
    marginBottom: 5,
  }),
  reason: {
    fontStyle: "italic",
    color: "red",
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  approve: {
    backgroundColor: "green",
  },
  reject: {
    backgroundColor: "red",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  bigButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  hallRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    marginBottom: 8,
  },
  hallText: {
    ...typography.body,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default AdminScreen;
