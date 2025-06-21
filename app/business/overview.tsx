"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import AppHeader from "@/components/AppHeader";
import { useAttendanceOverview } from "@/hooks/useAttendanceOverview";
import { useAuth } from "@/contexts/AuthContext";

// Mock data for demonstration

export default function OverviewScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { user } = useAuth();
  const { overviewData, loading } = useAttendanceOverview(
    user?.businessId,
    selectedDate
  );

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Here you would typically fetch new data based on the selected date
      // fetchOverviewData(selectedDate)
    }
  };

  const getPunctualityColor = (rate: number) => {
    if (rate >= 90) return "#4CAF50";
    if (rate >= 75) return "#FF9800";
    return "#F44336";
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "#4CAF50";
    if (rate >= 75) return "#FF9800";
    return "#F44336";
  };

  if (overviewData === null) return;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <AppHeader showBackButton={true} />,
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Business Overview</Text>
            <Text style={styles.subtitle}>
              Daily attendance insights and metrics
            </Text>
          </View>

          {/* Date Filter */}
          <View style={styles.dateFilterContainer}>
            <Text style={styles.dateFilterLabel}>Viewing data for:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(selectedDate)}
              </Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {loading ? (
            <View style={{ alignItems: "center", marginVertical: 20 }}>
              <ActivityIndicator size={60} />
            </View>
          ) : (
            <>
              {/* Metrics Cards */}
              <View style={styles.metricsContainer}>
                {/* Total Records */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricIcon}>📊</Text>
                    <Text style={styles.metricTitle}>Total Records</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {overviewData.totalRecords}
                  </Text>
                  <Text style={styles.metricSubtext}>
                    Attendance entries today
                  </Text>
                </View>

                {/* Total Users */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricIcon}>👥</Text>
                    <Text style={styles.metricTitle}>Total Users</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {overviewData.totalUsers}
                  </Text>
                  <Text style={styles.metricSubtext}>Registered employees</Text>
                </View>

                {/* Average Arrival Time */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricIcon}>⏰</Text>
                    <Text style={styles.metricTitle}>Average Arrival</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {overviewData.averageArrivalTime}
                  </Text>
                  <Text style={styles.metricSubtext}>
                    Average check-in time
                  </Text>
                </View>

                {/* Punctuality Rate */}
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricIcon}>🎯</Text>
                    <Text style={styles.metricTitle}>Punctuality Rate</Text>
                  </View>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color: getPunctualityColor(
                          overviewData.punctualityRate
                        ),
                      },
                    ]}
                  >
                    {overviewData.punctualityRate}%
                  </Text>
                  <Text style={styles.metricSubtext}>On-time arrivals</Text>
                </View>
              </View>

              {/* Summary Cards */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Quick Insights</Text>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryIcon}>📈</Text>
                    <Text style={styles.summaryCardTitle}>Attendance Rate</Text>
                  </View>
                  <View style={styles.summaryContent}>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: getAttendanceColor(
                            Number.parseFloat(
                              String(overviewData?.attendanceRate)
                            )
                          ),
                        },
                      ]}
                    >
                      {overviewData?.attendanceRate}%
                    </Text>
                    <Text style={styles.summaryDescription}>
                      {overviewData.totalRecords} out of{" "}
                      {overviewData.totalUsers} employees checked in
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <Text style={styles.summaryIcon}>⚡</Text>
                    <Text style={styles.summaryCardTitle}>
                      Performance Status
                    </Text>
                  </View>
                  <View style={styles.summaryContent}>
                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color:
                            overviewData.punctualityRate >= 85
                              ? "#4CAF50"
                              : "#FF9800",
                        },
                      ]}
                    >
                      {overviewData.punctualityRate >= 85
                        ? "Good"
                        : "Needs Attention"}
                    </Text>
                    <Text style={styles.summaryDescription}>
                      {overviewData.punctualityRate >= 85
                        ? "Team punctuality is meeting expectations"
                        : "Consider reviewing attendance policies"}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 25,
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
  dateFilterContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  dateFilterLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  dateButtonIcon: {
    fontSize: 18,
  },
  metricsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  metricCard: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666666",
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  metricSubtext: {
    fontSize: 12,
    color: "#999999",
  },
  summaryContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  summaryContent: {
    paddingLeft: 26,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  summaryDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
});
