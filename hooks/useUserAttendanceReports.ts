"use client";

import { useMemo } from "react";
import { IAttendanceRecord } from "@/types";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/backend/firebase";
import { useQuery } from "@tanstack/react-query";

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

const getRating = (punctuality: number): UserReport["overallRating"] => {
  if (punctuality >= 90) return "Excellent";
  if (punctuality >= 75) return "Good";
  if (punctuality >= 60) return "Fair";
  return "Poor";
};

const getUserReports = async (
  startDate: Date,
  endDate: Date,
  businessId: string
): Promise<UserReport[]> => {
  const q = query(
    collection(db, "businesses", businessId, "attendance"),
    where("timeClockedIn", ">=", startDate),
    where("timeClockedIn", "<=", endDate)
  );

  const snapshot = await getDocs(q);
  const records: IAttendanceRecord[] = snapshot.docs.map((doc) => ({
    ...(doc.data() as any),
    timeClockedIn: doc.data().timeClockedIn.toDate(),
  }));

  console.log(records);

  const grouped = records.reduce<Record<string, IAttendanceRecord[]>>(
    (acc, record) => {
      if (!acc[record.uid]) acc[record.uid] = [];
      acc[record.uid].push(record);
      return acc;
    },
    {}
  );

  return Object.entries(grouped).map(([uid, userRecords]) => {
    const totalRecords = userRecords.length;
    const onTimeRecords = userRecords.filter((r) => r.onTime).length;
    const lateRecords = totalRecords - onTimeRecords;

    const punctualityRate = (onTimeRecords / totalRecords) * 100;
    const attendanceRate = (totalRecords / 20) * 100; // Assume 20 working days as baseline

    const averageArrivalTimestamp =
      userRecords.reduce(
        (acc, r) => acc + new Date(r.timeClockedIn).getTime(),
        0
      ) / totalRecords;
    const averageArrivalTime = new Date(averageArrivalTimestamp)
      .toTimeString()
      .substring(0, 5);

    const { firstName, lastName, email, expectedTime } = userRecords[0];

    return {
      uid,
      firstName,
      lastName,
      email,
      expectedTime,
      averageArrivalTime,
      punctualityRate: Math.round(punctualityRate * 10) / 10,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      overallRating: getRating(punctualityRate),
      totalRecords,
      onTimeRecords,
      lateRecords,
      workingDays: 20,
    };
  });
};

export function useUserReports(
  startDate: Date,
  endDate: Date,
  businessId: string,
  searchQuery: string,
  ratingFilter: "all" | UserReport["overallRating"],
  sortBy: "name" | "punctuality" | "attendance" | "rating",
  sortOrder: "asc" | "desc"
) {
  const {
    data: reports = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["userReports", startDate, endDate,businessId],
    queryFn: () => getUserReports(startDate, endDate, businessId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log(reports);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    if (searchQuery) {
      result = result.filter(
        (r) =>
          r.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ratingFilter !== "all") {
      result = result.filter((r) => r.overallRating === ratingFilter);
    }

    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "punctuality":
          aValue = a.punctualityRate;
          bValue = b.punctualityRate;
          break;
        case "attendance":
          aValue = a.attendanceRate;
          bValue = b.attendanceRate;
          break;
        case "rating": {
          const ratingOrder = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };
          aValue = ratingOrder[a.overallRating];
          bValue = ratingOrder[b.overallRating];
          break;
        }
      }

      if (sortOrder === "asc")
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      else return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

    return result;
  }, [reports, searchQuery, ratingFilter, sortBy, sortOrder]);

  const getCSV = useMemo(() => {
    const headers = [
      "Name",
      "Email",
      "Expected Time",
      "Average Arrival",
      "Punctuality Rate",
      "Attendance Rate",
      "Overall Rating",
      "Total Records",
      "On Time",
      "Late",
      "Working Days",
    ];

    const rows = filteredReports.map((r) => [
      `${r.firstName} ${r.lastName}`,
      r.email,
      r.expectedTime,
      r.averageArrivalTime,
      `${r.punctualityRate}%`,
      `${r.attendanceRate}%`,
      r.overallRating,
      r.totalRecords,
      r.onTimeRecords,
      r.lateRecords,
      r.workingDays,
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }, [filteredReports]);

  return {
    reports: filteredReports,
    filteredReports,
    isLoading,
    isFetching,
    refetch,
    getCSV,
  };
}
