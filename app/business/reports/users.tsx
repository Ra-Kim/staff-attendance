"use client";

import { useState } from "react";
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
  Modal,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useUserReports } from "@/hooks/useUserAttendanceReports"; // Adjust import path as needed
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";

interface UserReport {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  expectedTime: string;
  averageArrivalTime: string;
  punctualityRate: number;
  attendanceRate: number;
  overallRating: "Excellent" | "Good" | "Fair" | "Poor";
  totalRecords: number;
  onTimeRecords: number;
  lateRecords: number;
  workingDays: number;
}

export default function UserReportsScreen() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date;
  });
  const { user } = useAuth();
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<
    "all" | "Excellent" | "Good" | "Fair" | "Poor"
  >("all");
  const [sortBy, setSortBy] = useState<
    "name" | "punctuality" | "attendance" | "rating"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedUser, setSelectedUser] = useState<UserReport | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Use the custom hook
  const {
    reports: filteredReports,
    isLoading,
    isFetching,
    refetch,
    getCSV,
  } = useUserReports(
    startDate,
    endDate,
    user?.businessId || "",
    searchQuery,
    user?.business?.workingDays || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
    ratingFilter,
    sortBy,
    sortOrder
  );

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

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "#4CAF50";
      case "Good":
        return "#8BC34A";
      case "Fair":
        return "#FF9800";
      case "Poor":
        return "#F44336";
      default:
        return "#999999";
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "#4CAF50";
    if (percentage >= 75) return "#8BC34A";
    if (percentage >= 60) return "#FF9800";
    return "#F44336";
  };

  const exportData = () => {
    const csvData = getCSV;
    Alert.alert(
      "Export User Reports",
      `Exporting ${filteredReports.length} user reports\n\nIn a real app, this would download a CSV file.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Export", onPress: () => console.log("CSV Data:", csvData) },
      ]
    );
  };

  const clearFilters = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(new Date());
    setSearchQuery("");
    setRatingFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  // Loading UI Component
  const renderLoadingOverlay = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading user reports...</Text>
      </View>
    </View>
  );

  // Skeleton loader for table rows
  const renderSkeletonRow = () => (
    <View style={styles.skeletonRow}>
      <View style={styles.nameColumn}>
        <View style={[styles.skeleton, styles.skeletonName]} />
        <View style={[styles.skeleton, styles.skeletonEmail]} />
      </View>
      <View style={styles.timeColumn}>
        <View style={[styles.skeleton, styles.skeletonTime]} />
        <View style={[styles.skeleton, styles.skeletonTime]} />
      </View>
      <View style={styles.ratesColumn}>
        <View style={[styles.skeleton, styles.skeletonRate]} />
        <View style={[styles.skeleton, styles.skeletonRate]} />
      </View>
      <View style={styles.ratingColumn}>
        <View style={[styles.skeleton, styles.skeletonRating]} />
      </View>
    </View>
  );

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <TouchableOpacity
        style={styles.nameColumn}
        onPress={() => handleSort("name")}
        disabled={isLoading}
      >
        <Text style={styles.tableHeaderText}>
          Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
        </Text>
      </TouchableOpacity>
      <View style={styles.timeColumn}>
        <Text style={styles.tableHeaderText}>Times</Text>
      </View>
      <TouchableOpacity
        style={styles.ratesColumn}
        onPress={() => handleSort("punctuality")}
        disabled={isLoading}
      >
        <Text style={styles.tableHeaderText}>
          Punctuality{" "}
          {sortBy === "punctuality" && (sortOrder === "asc" ? "↑" : "↓")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.ratingColumn}
        onPress={() => handleSort("rating")}
        disabled={isLoading}
      >
        <Text style={styles.tableHeaderText}>
          Rating {sortBy === "rating" && (sortOrder === "asc" ? "↑" : "↓")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTableRow = ({ item }: { item: UserReport }) => (
    <TouchableOpacity
      style={styles.tableRow}
      onPress={() => {
        setSelectedUser(item);
        setShowUserModal(true);
      }}
      disabled={isLoading}
    >
      <View style={styles.nameColumn}>
        <Text style={styles.nameText}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.emailText}>{item.email}</Text>
      </View>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>Exp: {item.expectedTime}</Text>
        <Text style={styles.avgTimeText}>Avg: {item.averageArrivalTime}</Text>
      </View>
      <View style={styles.ratesColumn}>
        <Text
          style={[
            styles.rateText,
            { color: getPercentageColor(item.punctualityRate) },
          ]}
        >
          {item.punctualityRate}%
        </Text>
        <Text
          style={[
            styles.rateSubText,
            { color: getPercentageColor(item.attendanceRate) },
          ]}
        >
          Att: {item.attendanceRate}%
        </Text>
      </View>
      <View style={styles.ratingColumn}>
        <View
          style={[
            styles.ratingBadge,
            { backgroundColor: getRatingColor(item.overallRating) },
          ]}
        >
          <Text style={styles.ratingText}>{item.overallRating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUserModal = () => {
    if (!selectedUser) return null;

    return (
      <Modal visible={showUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUser.firstName} {selectedUser.lastName}
              </Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalEmail}>{selectedUser.email}</Text>

            <View style={styles.modalStatsContainer}>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValue}>
                  {selectedUser.totalRecords}
                </Text>
                <Text style={styles.modalStatLabel}>Total Records</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValue}>
                  {selectedUser.onTimeRecords}
                </Text>
                <Text style={styles.modalStatLabel}>On Time</Text>
              </View>
              <View style={styles.modalStatCard}>
                <Text style={styles.modalStatValue}>
                  {selectedUser.lateRecords}
                </Text>
                <Text style={styles.modalStatLabel}>Late</Text>
              </View>
            </View>

            <View style={styles.modalDetailsContainer}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Expected Time:</Text>
                <Text style={styles.modalDetailValue}>
                  {selectedUser.expectedTime}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Average Arrival:</Text>
                <Text style={styles.modalDetailValue}>
                  {selectedUser.averageArrivalTime}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Punctuality Rate:</Text>
                <Text
                  style={[
                    styles.modalDetailValue,
                    { color: getPercentageColor(selectedUser.punctualityRate) },
                  ]}
                >
                  {selectedUser.punctualityRate}%
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Attendance Rate:</Text>
                <Text
                  style={[
                    styles.modalDetailValue,
                    { color: getPercentageColor(selectedUser.attendanceRate) },
                  ]}
                >
                  {selectedUser.attendanceRate}%
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Overall Rating:</Text>
                <View
                  style={[
                    styles.modalRatingBadge,
                    {
                      backgroundColor: getRatingColor(
                        selectedUser.overallRating
                      ),
                    },
                  ]}
                >
                  <Text style={styles.modalRatingText}>
                    {selectedUser.overallRating}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>User Reports</Text>
            {isFetching && (
              <ActivityIndicator
                size="small"
                color="#666666"
                style={styles.headerLoader}
              />
            )}
            {isFetching && renderLoadingOverlay()}
          </View>
          <Text style={styles.subtitle}>
            Individual employee attendance analysis
          </Text>
        </View>

        {/* Filters Section */}
        <View
          style={[
            styles.filtersContainer,
            isLoading && styles.disabledContainer,
          ]}
        >
          <Text style={styles.filtersTitle}>Filters & Sorting</Text>

          {/* Date Range */}
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>From:</Text>
              <TouchableOpacity
                style={[styles.dateButton, isLoading && styles.disabledButton]}
                onPress={() => setShowStartDatePicker(true)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    isLoading && styles.disabledText,
                  ]}
                >
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputContainer}>
              <Text style={styles.dateLabel}>To:</Text>
              <TouchableOpacity
                style={[styles.dateButton, isLoading && styles.disabledButton]}
                onPress={() => setShowEndDatePicker(true)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    isLoading && styles.disabledText,
                  ]}
                >
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <TextInput
            style={[styles.searchInput, isLoading && styles.disabledInput]}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!isLoading}
          />

          {/* Rating Filter */}
          <View style={styles.ratingFilterContainer}>
            {(["all", "Excellent", "Good", "Fair", "Poor"] as const).map(
              (rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingFilterButton,
                    ratingFilter === rating && styles.activeRatingFilter,
                    isLoading && styles.disabledButton,
                  ]}
                  onPress={() => setRatingFilter(rating)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.ratingFilterText,
                      ratingFilter === rating && styles.activeRatingFilterText,
                      isLoading && styles.disabledText,
                    ]}
                  >
                    {rating === "all" ? "All" : rating}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.clearButton, isLoading && styles.disabledButton]}
              onPress={clearFilters}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.clearButtonText,
                  isLoading && styles.disabledText,
                ]}
              >
                Clear Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.refreshButton, isLoading && styles.disabledButton]}
              onPress={handleRefresh}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.refreshButtonText,
                  isLoading && styles.disabledText,
                ]}
              >
                Refresh
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, isLoading && styles.disabledButton]}
              onPress={exportData}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.exportButtonText,
                  isLoading && styles.disabledText,
                ]}
              >
                Export ({filteredReports.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            {isLoading
              ? "Loading..."
              : `Showing ${filteredReports.length} users`}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          {isLoading ? (
            <View>
              {Array.from({ length: 5 }).map((_, index) => (
                <View key={index}>{renderSkeletonRow()}</View>
              ))}
            </View>
          ) : (
            <FlatList
              data={filteredReports}
              renderItem={renderTableRow}
              keyExtractor={(item) => item.uid}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your filters
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* User Detail Modal */}
        {renderUserModal()}

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
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginRight: 10,
  },
  headerLoader: {
    marginLeft: 10,
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
  disabledContainer: {
    opacity: 0.7,
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
  disabledButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
  disabledText: {
    color: "#CCCCCC",
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
  disabledInput: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
    color: "#CCCCCC",
  },
  ratingFilterContainer: {
    flexDirection: "row",
    marginBottom: 15,
    flexWrap: "wrap",
  },
  ratingFilterButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  activeRatingFilter: {
    backgroundColor: "#000000",
  },
  ratingFilterText: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  activeRatingFilterText: {
    color: "#FFFFFF",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    flex: 0.32,
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
  refreshButton: {
    flex: 0.32,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  refreshButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  exportButton: {
    flex: 0.32,
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
  // Skeleton loader styles
  skeletonRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E0E0E0",
  },
  skeleton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
  skeletonName: {
    height: 16,
    width: "80%",
    marginBottom: 4,
  },
  skeletonEmail: {
    height: 14,
    width: "60%",
  },
  skeletonTime: {
    height: 12,
    width: "70%",
    marginBottom: 4,
  },
  skeletonRate: {
    height: 14,
    width: "50%",
    marginBottom: 4,
  },
  skeletonRating: {
    height: 20,
    width: 60,
    borderRadius: 12,
  },
  // Loading overlay styles
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContent: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  nameColumn: {
    flex: 2.5,
    paddingRight: 10,
  },
  timeColumn: {
    flex: 1.5,
    paddingRight: 10,
  },
  ratesColumn: {
    flex: 1.5,
    paddingRight: 10,
    alignItems: "center",
  },
  ratingColumn: {
    flex: 1,
    alignItems: "center",
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
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 2,
  },
  avgTimeText: {
    fontSize: 12,
    color: "#666666",
  },
  rateText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  rateSubText: {
    fontSize: 12,
    fontWeight: "500",
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "bold",
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
    marginBottom: 10,
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
  modalEmail: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
  },
  modalStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalStatCard: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  modalStatLabel: {
    fontSize: 12,
    color: "#666666",
  },
  modalDetailsContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 15,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  modalDetailValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "bold",
  },
  modalRatingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  modalRatingText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
