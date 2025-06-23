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
} from "react-native";
import { Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePerformanceLeaderboard,
  type Performer,
} from "@/hooks/usePerformanceLeaderboard";
import AppHeader from "@/components/AppHeader";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";

const PerformerCard = ({
  performer,
  rank,
}: {
  performer: Performer;
  rank: number;
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#4CAF50"; // Green
    if (score >= 80) return "#FF9800"; // Orange
    if (score >= 70) return "#FFC107"; // Yellow
    return "#F44336"; // Red
  };

  return (
    <View style={styles.performerCard}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{getRankIcon(rank)}</Text>
      </View>

      <View style={styles.performerInfo}>
        <Text style={styles.performerName}>{performer.name}</Text>
        <Text style={styles.performerEmail}>{performer.email}</Text>

        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Attendance</Text>
            <Text style={styles.metricValue}>
              {performer.attendanceRate.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Punctuality</Text>
            <Text style={styles.metricValue}>
              {performer.punctualityRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text
          style={[styles.scoreText, { color: getScoreColor(performer.score) }]}
        >
          {performer.score.toFixed(1)}
        </Text>
        <Text style={styles.scoreLabel}>Score</Text>
      </View>
    </View>
  );
};

export default function BestPerformersScreen() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(dayjs().startOf("month").toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { bestPerformers, isLoading, refetch } = usePerformanceLeaderboard(
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <AppHeader showBackButton={true} title="Best Performers" />
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        {/* Date Range Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Date Range</Text>
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

        {/* Leaderboard */}
        <View style={styles.leaderboardContainer}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>🏆 Top Performers</Text>
            <Text style={styles.leaderboardSubtitle}>
              Based on attendance (40%) and punctuality (60%)
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>
                Loading performance data...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.performersList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            >
              {bestPerformers.length > 0 ? (
                bestPerformers.map((performer, index) => (
                  <PerformerCard
                    key={performer.uid}
                    performer={performer}
                    rank={index + 1}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No performance data available
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting the date range or check if employees have
                    attendance records
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>

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
  leaderboardContainer: {
    flex: 1,
    padding: 20,
  },
  leaderboardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
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
  performersList: {
    flex: 1,
  },
  performerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  performerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  performerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  performerEmail: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  metricsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  metric: {
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: "#999999",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scoreLabel: {
    fontSize: 10,
    color: "#999999",
    marginTop: 2,
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
    color: "#666666",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999999",
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
