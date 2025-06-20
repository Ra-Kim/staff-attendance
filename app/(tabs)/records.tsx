"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import type { DayAttendanceStatus, AdminDayRecord } from "@/types";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";
import { Calendar } from "react-native-calendars";

export default function RecordsScreen() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [selectedDayData, setSelectedDayData] =
    useState<DayAttendanceStatus | null>(null);
  const [expandedDay, setExpandedDay] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { loading, adminRecords, getUserAttendance, fetchMonth, rawRecords } =
    useAttendanceRecords(user?.businessId);
  const [filteredRecords, setFilteredRecords] =
    useState<AdminDayRecord[]>(adminRecords);

  useEffect(() => {
    // Fetch records for the current month
    fetchMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, fetchMonth]);

  useEffect(() => {
    if (user?.isAdmin) {
      const filtered = adminRecords.filter(
        (day) =>
          day.date.includes(searchQuery) ||
          day.records.some(
            (record) =>
              record.firstName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              record.lastName
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              record.email.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredRecords(filtered);
    }
  }, [searchQuery, user?.isAdmin, adminRecords]);

  const [userHistory, setUserHistory] = useState<DayAttendanceStatus[]>([]);

  useEffect(() => {
    if (user && !user?.isAdmin) {
      const result = getUserAttendance(user.uid);
      setUserHistory(result);
    }
  }, [user, getUserAttendance, rawRecords]);

  useEffect(() => {
    const marks: any = {};
    if (user?.isAdmin) return;
    userHistory?.forEach(({ date, status }) => {
      marks[date] = {
        customStyles: {
          container: {
            backgroundColor:
              status === "onTime"
                ? "#4CAF50"
                : status === "late"
                ? "#d71111"
                : "#F5F5F5",
          },
          text: {
            color: status === "absent" ? "#999999" : "#FFFFFF",
            fontWeight: "bold",
          },
        },
      };
    });
    setMarkedDates(marks);
  }, [userHistory, user?.isAdmin]);

  if (!user) return;
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Attendance Records</Text>
          <Text style={styles.subtitle}>
            {user.isAdmin
              ? "Manage all attendance records"
              : "Track your attendance history"}
          </Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDatePress = (dayData: DayAttendanceStatus) => {
    setSelectedDayData(dayData);
    // setSelectedDate(dayData.date);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderAttendanceModal = () => {
    if (!selectedDayData) return null;

    return (
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDate}>
              {formatDate(selectedDayData.date)}
            </Text>

            {selectedDayData.status === "absent" ? (
              <View style={styles.absentContainer}>
                <Text style={styles.absentText}>No attendance record</Text>
                <Text style={styles.absentSubtext}>
                  You were marked absent on this day
                </Text>
              </View>
            ) : (
              selectedDayData.record && (
                <View style={styles.recordDetails}>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: selectedDayData.record.onTime
                            ? "#4CAF50"
                            : "#d71111",
                        },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {selectedDayData.record.onTime ? "On Time" : "Late"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expected Time:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDayData.record.expectedTime}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Clocked In:</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(selectedDayData.record.timeClockedIn)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDayData.record.location || "Not specified"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scanned By:</Text>
                    <Text style={styles.detailValue}>
                      {selectedDayData.record.scannedBy}
                    </Text>
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderAdminView = () => {
    return (
      <View style={styles.adminContainer}>
        <Text style={styles.sectionTitle}>Attendance Records</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or date..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.dayRecordContainer}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() =>
                  setExpandedDay(expandedDay === item.date ? "" : item.date)
                }
              >
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayHeaderDate}>
                    {formatDate(item.date)}
                  </Text>
                  <Text style={styles.dayHeaderStats}>
                    {item.totalRecords} total • {item.onTimeCount} on time •{" "}
                    {item.lateCount} late
                  </Text>
                </View>
                <Text style={styles.expandIcon}>
                  {expandedDay === item.date ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {expandedDay === item.date && (
                <View style={styles.recordsList}>
                  {item.records.map((record, index) => (
                    <View key={index} style={styles.recordItem}>
                      <View style={styles.recordHeader}>
                        <Text style={styles.recordName}>
                          {record.firstName} {record.lastName}
                        </Text>
                        <View
                          style={[
                            styles.recordStatusBadge,
                            {
                              backgroundColor: record.onTime
                                ? "#4CAF50"
                                : "#FF9800",
                            },
                          ]}
                        >
                          <Text style={styles.recordStatusText}>
                            {record.onTime ? "On Time" : "Late"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.recordEmail}>{record.email}</Text>
                      <View style={styles.recordDetails}>
                        <Text style={styles.recordDetailText}>
                          Expected: {record.expectedTime} • Clocked:{" "}
                          {formatTime(record.timeClockedIn)}
                        </Text>
                        <Text style={styles.recordDetailText}>
                          Location: {record.location || "Not specified"} •
                          Scanned by: {record.scannedBy}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Records</Text>
        <Text style={styles.subtitle}>
          {user?.isAdmin
            ? "Manage all attendance records"
            : "Track your attendance history"}
        </Text>
      </View>

      {user?.isAdmin ? (
        renderAdminView()
      ) : (
        <>
          <Calendar
            current={currentMonth.toISOString().split("T")[0]}
            markingType="custom"
            markedDates={markedDates}
            onMonthChange={(m: any) =>
              setCurrentMonth(new Date(m.year, m.month, 1))
            }
            onDayPress={(d: any) => {
              const day = userHistory?.find((x) => x.date === d.dateString);
              if (day) handleDatePress(day);
            }}
            theme={{
              arrowColor: "#000",
              textDayFontWeight: "500",
              todayTextColor: "#00adf5",
            }}
          />
           <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Attendance Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, styles.onTimeCard]}>
                <Text style={styles.summaryNumber}>{userHistory.filter((d) => d.status === "onTime").length}</Text>
                <Text style={styles.summaryLabel}>On Time</Text>
              </View>
              <View style={[styles.summaryCard, styles.lateCard]}>
                <Text style={styles.summaryNumber}>{userHistory.filter((d) => d.status === "late").length}</Text>
                <Text style={styles.summaryLabel}>Late</Text>
              </View>
              <View style={[styles.summaryCard, styles.absentCard]}>
                <Text style={styles.summaryNumber}>{userHistory.filter((d) => d.status === "absent").length}</Text>
                <Text style={styles.summaryLabel}>Absent</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {renderAttendanceModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    // padding: 20,
  },
  header: {
    marginBottom: 30,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  calendarContainer: {
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: "#666666",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDay: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarDayText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  calendarDayMonth: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  closeButton: {
    fontSize: 24,
    color: "#666666",
  },
  modalDate: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
    textAlign: "center",
  },
  absentContainer: {
    alignItems: "center",
    padding: 20,
  },
  absentText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999999",
    marginBottom: 5,
  },
  absentSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  recordDetails: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 10,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "bold",
  },
  adminContainer: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  dayRecordContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayHeaderDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  dayHeaderStats: {
    fontSize: 14,
    color: "#666666",
  },
  expandIcon: {
    fontSize: 16,
    color: "#666666",
  },
  recordsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  recordName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  recordStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  recordEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  recordDetailText: {
    fontSize: 12,
    color: "#999999",
    marginBottom: 2,
  },
  summaryContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
    textAlign: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  onTimeCard: {
    backgroundColor: "#E8F5E8",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  lateCard: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FF9800",
  },
  absentCard: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
});
