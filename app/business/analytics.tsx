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
  Dimensions,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { usePerformanceLeaderboard } from "@/hooks/usePerformanceLeaderboard";
import { useLateArrivalReport } from "@/hooks/useLateArrivals";
import AppHeader from "@/components/AppHeader";
import { LineChart } from "react-native-chart-kit";
import dayjs from "dayjs";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";

const { width: screenWidth } = Dimensions.get("window");

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const SummaryCard = ({
  title,
  value,
  subtitle,
  color = "#000000",
}: SummaryCardProps) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryTitle}>{title}</Text>
    <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.summarySubtitle}>{subtitle}</Text>}
  </View>
);

const PerformerItem = ({
  name,
  score,
  rank,
}: {
  name: string;
  score: number;
  rank: number;
}) => (
  <View style={styles.performerItem}>
    <View style={styles.performerRank}>
      <Text style={styles.rankText}>#{rank}</Text>
    </View>
    <View style={styles.performerInfo}>
      <Text style={styles.performerName}>{name}</Text>
      <Text style={styles.performerScore}>{score.toFixed(1)}% score</Text>
    </View>
  </View>
);

const LateUserItem = ({
  name,
  lateCount,
}: {
  name: string;
  lateCount: number;
}) => (
  <View style={styles.lateUserItem}>
    <Text style={styles.lateUserName}>{name}</Text>
    <Text style={styles.lateUserCount}>{lateCount} late days</Text>
  </View>
);

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dateRange] = useState({
    startDate: dayjs().startOf("month").toDate(),
    endDate: new Date(),
  });

  const {
    bestPerformers,
    worstPerformers,
    isLoading: performanceLoading,
  } = usePerformanceLeaderboard(
    dateRange.startDate,
    dateRange.endDate,
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

  const { lateReports, isLoading: lateLoading } = useLateArrivalReport(
    dateRange.startDate,
    dateRange.endDate,
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

  const { summary, attendanceTrend, loading } = useAnalyticsSummary({
    businessId: user?.business?.businessId!,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    workingDays: user?.business?.workingDays || {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    },
  });

  const attendanceChartData = {
    labels: attendanceTrend.labels || ["Week 1", "Week 2"],
    datasets: [
      {
        data: attendanceTrend.data || [0, 0],
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#000000",
    },
  };

  // Calculate summary statistics
  const totalLateCount = lateReports.reduce(
    (sum, report) => sum + report.lateCount,
    0
  );

  const isLoading = performanceLoading || lateLoading || loading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => <AppHeader showBackButton={true} title="Analytics" />,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <AppHeader showBackButton={true} title="📊 Analytics" />
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>
              Business analytics and performance insights
            </Text>
          </View>

          {/* Attendance Trend Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Attendance Trend</Text>
            <View style={styles.chartContainer}>
              {attendanceTrend &&
                attendanceTrend.data &&
                attendanceTrend.labels && (
                  <LineChart
                    data={attendanceChartData}
                    width={screenWidth - 60}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                )}
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔹 Overview</Text>
            <View style={styles.summaryGrid}>
              <SummaryCard
                title="Total Users"
                value={summary?.totalUsers || 0}
              />
              <SummaryCard
                title="Avg. Attendance"
                value={`${(summary?.attendanceRate || 0)?.toFixed(1)}%`}
                color="#4CAF50"
              />
              <SummaryCard
                title="Avg. Punctuality"
                value={`${(summary?.punctualityRate || 0)?.toFixed(1)}%`}
                color="#2196F3"
              />
              <SummaryCard
                title="Late Count"
                value={totalLateCount}
                color="#F44336"
              />
            </View>
          </View>

          {/* Best Performers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 Best Performers</Text>
              <TouchableOpacity
                onPress={() => router.push("/business/reports/best")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.performersContainer}>
              {bestPerformers.slice(0, 3).map((performer, index) => (
                <PerformerItem
                  key={performer.uid}
                  name={performer.name}
                  score={performer.score}
                  rank={index + 1}
                />
              ))}
              {bestPerformers.length === 0 && (
                <Text style={styles.emptyText}>
                  No performance data available
                </Text>
              )}
            </View>
          </View>

          {/* Worst Performers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚠️ Needs Improvement</Text>
              <TouchableOpacity
                onPress={() => router.push("/business/reports/worst")}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.performersContainer}>
              {worstPerformers.slice(0, 3).map((performer, index) => (
                <PerformerItem
                  key={performer.uid}
                  name={performer.name}
                  score={performer.score}
                  rank={worstPerformers.length - index}
                />
              ))}
              {worstPerformers.length === 0 && (
                <Text style={styles.emptyText}>
                  All employees performing well! 🎉
                </Text>
              )}
            </View>
          </View>

          {/* Average Clock-in Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🕐 Average Clock-in Time</Text>
            <View style={styles.clockInContainer}>
              <Text style={styles.clockInTime}>
                {summary?.averageClockInTime || ""}
              </Text>
              <Text style={styles.clockInSubtext}>
                {`Based on this month's data`}
              </Text>
            </View>
          </View>

          {/* Users with Frequent Lateness */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>❌ Frequent Late Arrivals</Text>
              <TouchableOpacity
                onPress={() => router.push("/business/reports/late")}
              >
                <Text style={styles.viewAllText}>View Report</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.lateUsersContainer}>
              {lateReports.slice(0, 5).map((report) => (
                <LateUserItem
                  key={report.uid}
                  name={report.name}
                  lateCount={report.lateCount}
                />
              ))}
              {lateReports.length === 0 && (
                <Text style={styles.emptyText}>
                  No late arrivals this month! 🎉
                </Text>
              )}
            </View>
          </View>

          {/* Export / Full Reports */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📥 Export & Reports</Text>
            <View style={styles.exportContainer}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => router.push("/business/reports/late")}
              >
                <Text style={styles.exportButtonText}>📊 Full Late Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => router.push("/business/reports/best")}
              >
                <Text style={styles.exportButtonText}>
                  🏆 Performance Report
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 25,
    padding: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  section: {
    margin: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  chartContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  chart: {
    borderRadius: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  summaryTitle: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 5,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 10,
    color: "#999999",
  },
  performersContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  performerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  performerRank: {
    width: 30,
    alignItems: "center",
  },
  rankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  performerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  performerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  performerScore: {
    fontSize: 12,
    color: "#666666",
  },
  clockInContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  clockInTime: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  clockInSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  lateUsersContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
  },
  lateUserItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  lateUserName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    flex: 1,
  },
  lateUserCount: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "600",
  },
  exportContainer: {
    flexDirection: "row",
    gap: 10,
  },
  exportButton: {
    flex: 1,
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: "center",
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 10,
  },
});
