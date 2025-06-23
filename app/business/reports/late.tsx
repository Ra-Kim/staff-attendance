"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useLateArrivalReport } from "@/hooks/useLateArrivals";
import AppHeader from "@/components/AppHeader";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

interface TableRowProps {
  name: string;
  email: string;
  lateCount: number;
  totalRecords: number;
  lateRate: number;
  isHeader?: boolean;
}

const TableRow = ({
  name,
  email,
  lateCount,
  totalRecords,
  lateRate,
  isHeader = false,
}: TableRowProps) => {
  const getLateRateColor = (rate: number) => {
    if (rate >= 30) return "#F44336"; // Red - Critical
    if (rate >= 20) return "#FF9800"; // Orange - High
    if (rate >= 10) return "#FFC107"; // Yellow - Medium
    return "#4CAF50"; // Green - Low
  };

  if (isHeader) {
    return (
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={[styles.tableCell, styles.nameCell, styles.headerText]}>
          Employee
        </Text>
        <Text style={[styles.tableCell, styles.countCell, styles.headerText]}>
          Late Days
        </Text>
        <Text style={[styles.tableCell, styles.totalCell, styles.headerText]}>
          Total Days
        </Text>
        <Text style={[styles.tableCell, styles.rateCell, styles.headerText]}>
          Late Rate
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tableRow}>
      <View style={[styles.tableCell, styles.nameCell]}>
        <Text style={styles.employeeName}>{name}</Text>
        <Text style={styles.employeeEmail}>{email}</Text>
      </View>
      <Text style={[styles.tableCell, styles.countCell, styles.cellText]}>
        {lateCount}
      </Text>
      <Text style={[styles.tableCell, styles.totalCell, styles.cellText]}>
        {totalRecords}
      </Text>
      <View style={[styles.tableCell, styles.rateCell]}>
        <Text style={[styles.cellText, { color: getLateRateColor(lateRate) }]}>
          {lateRate.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
};

export default function LateArrivalsScreen() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(dayjs().startOf("month").toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { lateReports, isLoading, refetch } = useLateArrivalReport(
    startDate,
    endDate,
    user?.business?.businessId || "",
    user?.business?.workingDays || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    }
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format("MMM DD, YYYY");
  };

  const generateCSVContent = () => {
    const headers = [
      "Employee Name",
      "Email",
      "Late Days",
      "Total Days",
      "Late Rate (%)",
      "Period",
    ];
    const period = `${formatDate(startDate)} - ${formatDate(endDate)}`;

    const csvRows = [
      headers.join(","),
      ...lateReports.map((report) =>
        [
          `"${report.name}"`,
          `"${report.email}"`,
          report.lateCount,
          report.totalRecords,
          report.lateRate.toFixed(1),
          `"${period}"`,
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = generateCSVContent();
      const fileName = `late_arrivals_${dayjs(startDate).format(
        "YYYY-MM-DD"
      )}_to_${dayjs(endDate).format("YYYY-MM-DD")}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export Late Arrivals Report",
        });
      } else {
        Alert.alert("Export Complete", `File saved as ${fileName}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "Unable to export the report. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const shareReport = async () => {
    try {
      const reportSummary = `Late Arrival Report (${formatDate(
        startDate
      )} - ${formatDate(endDate)})

Total Employees with Late Arrivals: ${lateReports.length}

Top 5 Late Arrivals:
${lateReports
  .slice(0, 5)
  .map(
    (r, i) =>
      `${i + 1}. ${r.name}: ${r.lateCount} late days (${r.lateRate.toFixed(
        1
      )}%)`
  )
  .join("\n")}

Generated by ${user?.business?.business_name || "TheDot Attendance"}`;

      await Share.share({
        message: reportSummary,
        title: "Late Arrival Report",
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const getTotalStats = () => {
    const totalEmployees = lateReports.length;
    const totalLateDays = lateReports.reduce(
      (sum, report) => sum + report.lateCount,
      0
    );
    const averageLateRate =
      totalEmployees > 0
        ? lateReports.reduce((sum, report) => sum + report.lateRate, 0) /
          totalEmployees
        : 0;

    return { totalEmployees, totalLateDays, averageLateRate };
  };

  const stats = getTotalStats();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <AppHeader showBackButton={true} title="Late Arrivals Report" />
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Date Range Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Report Period</Text>
          <View style={styles.dateRangeContainer}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                From: {formatDate(startDate)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                To: {formatDate(endDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Stats */}
        {!isLoading && lateReports.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalEmployees}</Text>
              <Text style={styles.statLabel}>Employees with Late Arrivals</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalLateDays}</Text>
              <Text style={styles.statLabel}>Total Late Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.averageLateRate.toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Average Late Rate</Text>
            </View>
          </View>
        )}

        {/* Export Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={exportToCSV}
            disabled={isExporting || lateReports.length === 0}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>📊 Export CSV</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={shareReport}
            disabled={lateReports.length === 0}
          >
            <Text style={styles.actionButtonText}>📤 Share Report</Text>
          </TouchableOpacity>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>
                Loading late arrival data...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.tableScrollView}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              {lateReports.length > 0 ? (
                <>
                  <TableRow
                    name=""
                    email=""
                    lateCount={0}
                    totalRecords={0}
                    lateRate={0}
                    isHeader={true}
                  />
                  {lateReports.map((report) => (
                    <TableRow
                      key={report.uid}
                      name={report.name}
                      email={report.email}
                      lateCount={report.lateCount}
                      totalRecords={report.totalRecords}
                      lateRate={report.lateRate}
                    />
                  ))}
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>🎉 No Late Arrivals!</Text>
                  <Text style={styles.emptySubtext}>
                    All employees arrived on time during this period. Great job
                    team!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

        {/* Footer Note */}
        {lateReports.length > 0 && (
          <View style={styles.footerNote}>
            <Text style={styles.footerText}>
              💡 This report can be used for payroll deductions, performance
              reviews, or disciplinary actions as per company policy.
            </Text>
          </View>
        )}

        {/* Date Pickers */}
        <DateTimePickerModal
          isVisible={showStartDatePicker}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setShowStartDatePicker(false);
          }}
          onCancel={() => setShowStartDatePicker(false)}
          date={startDate}
          maximumDate={endDate}
        />

        <DateTimePickerModal
          isVisible={showEndDatePicker}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
          date={endDate}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  filterContainer: {
    backgroundColor: "#F8F8F8",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
  },
  dateRangeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  exportButton: {
    backgroundColor: "#000000",
  },
  shareButton: {
    backgroundColor: "#666666",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  tableContainer: {
    flex: 1,
  },
  tableScrollView: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#F8F8F8",
    borderBottomWidth: 2,
    borderBottomColor: "#CCCCCC",
  },
  tableCell: {
    justifyContent: "center",
  },
  nameCell: {
    flex: 2,
  },
  countCell: {
    flex: 1,
    alignItems: "center",
  },
  totalCell: {
    flex: 1,
    alignItems: "center",
  },
  rateCell: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  employeeEmail: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },
  cellText: {
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footerNote: {
    backgroundColor: "#FFF3CD",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    fontSize: 12,
    color: "#856404",
    textAlign: "center",
    lineHeight: 16,
  },
});
