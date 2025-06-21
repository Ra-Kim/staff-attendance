"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { IAttendanceRecord } from "@/types";
import { useGeneralAttendanceReports } from "@/hooks/useGeneralAttendanceReports";
import { useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";

export default function GeneralReportsScreen() {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { user } = useAuth();
  const {
    loading,
    records,
    filteredRecords,
    fetchRecords,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearFilters,
  } = useGeneralAttendanceReports(user?.businessId); // or wherever your businessId comes from

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const exportData = () => {
    // In a real app, this would generate and download a CSV/Excel file
    const csvData = generateCSV();
    Alert.alert(
      "Export Data",
      `Exporting ${filteredRecords.length} records\n\nIn a real app, this would download a CSV file.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => console.log("CSV Data:", csvData) },
      ]
    );
  };

  const generateCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Expected Time",
      "Clock In Time",
      "Status",
      "Location",
      "Scanned By",
      "Date",
    ];

    const csvRows = [
      headers.join(","),
      ...filteredRecords.map((record) =>
        [
          `"${record.firstName} ${record.lastName}"`,
          record.email,
          record.phoneNumber,
          record.expectedTime,
          formatTime(record.timeClockedIn),
          record.onTime ? "On Time" : "Late",
          record.location || "Not specified",
          record.scannedBy,
          formatDate(record.timeClockedIn),
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
      <Text style={[styles.tableHeaderText, styles.timeColumn]}>Time</Text>
      <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
      <Text style={[styles.tableHeaderText, styles.locationColumn]}>
        Location
      </Text>
    </View>
  );

  const renderTableRow = ({ item }: { item: IAttendanceRecord }) => (
    <View style={styles.tableRow}>
      <View style={styles.nameColumn}>
        <Text style={styles.nameText}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.emailText}>{item.email}</Text>
      </View>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{formatTime(item.timeClockedIn)}</Text>
        <Text style={styles.expectedText}>Expected: {item.expectedTime}</Text>
      </View>
      <View style={styles.statusColumn}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.onTime ? "#4CAF50" : "#FF9800" },
          ]}
        >
          <Text style={styles.statusText}>
            {item.onTime ? "On Time" : "Late"}
          </Text>
        </View>
      </View>
      <View style={styles.locationColumn}>
        <Text style={styles.locationText}>
          {item.location || "Not specified"}
        </Text>
        <Text style={styles.scannedByText}>By: {item.scannedBy}</Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <AppHeader title="Reports" showBackButton={true} />,
        }}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>General Reports</Text>
          <Text style={styles.subtitle}>
            View and export all attendance records
          </Text>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>

          {/* Date Range */}
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Status Filter */}
          <View style={styles.statusFilterContainer}>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "all" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("all")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "all" && styles.activeStatusFilterText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "onTime" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("onTime")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "onTime" && styles.activeStatusFilterText,
                ]}
              >
                On Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusFilterButton,
                statusFilter === "late" && styles.activeStatusFilter,
              ]}
              onPress={() => setStatusFilter("late")}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === "late" && styles.activeStatusFilterText,
                ]}
              >
                Late
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={exportData}>
              <Text style={styles.exportButtonText}>
                Export ({filteredRecords.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#0000ff"
            style={{ marginTop: 20 }}
          />
        ) : (
          <>
            {/* Results Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Showing {filteredRecords.length} of {records.length} records
              </Text>
            </View>

            {/* Table */}
            <View style={styles.tableContainer}>
              {renderTableHeader()}
              <FlatList
                data={records}
                renderItem={renderTableRow}
                keyExtractor={(item) =>
                  `${item.uid}-${item.timeClockedIn.getTime()}`
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No records found</Text>
                    <Text style={styles.emptySubtext}>
                      Try adjusting your filters
                    </Text>
                  </View>
                }
              />
            </View>
          </>
        )}
        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            testID="startDateTimePicker"
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onStartDateChange}
            maximumDate={new Date()}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            testID="endDateTimePicker"
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onEndDateChange}
            maximumDate={new Date()}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 20,
    paddingTop: 20,
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
  filtersContainer: {
    backgroundColor: "#F8F8F8",
    margin: 20,
    marginTop: 0,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  dateRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  dateInputContainer: {
    flex: 0.48,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 5,
  },
  dateButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  statusFilterContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  statusFilterButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    marginHorizontal: 2,
  },
  activeStatusFilter: {
    backgroundColor: "#000000",
  },
  statusFilterText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  activeStatusFilterText: {
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    flex: 0.48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  exportButton: {
    flex: 0.48,
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  exportButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  summaryText: {
    fontSize: 14,
    color: "#666666",
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E0E0E0",
  },
  nameColumn: {
    flex: 2.5,
    paddingRight: 10,
  },
  timeColumn: {
    flex: 1.5,
    paddingRight: 10,
  },
  statusColumn: {
    flex: 1,
    paddingRight: 10,
    alignItems: "center",
  },
  locationColumn: {
    flex: 1.5,
  },
  nameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 12,
    color: "#666666",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  expectedText: {
    fontSize: 12,
    color: "#666666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  locationText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  scannedByText: {
    fontSize: 12,
    color: "#666666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999999",
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#CCCCCC",
  },
});
