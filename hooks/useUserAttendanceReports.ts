"use client";

import { useMemo } from "react";
import {  UserReport, WorkingDays } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { getUserReports } from "@/lib/helperFunctions/getUserReports";


export function useUserReports(
  startDate: Date,
  endDate: Date,
  businessId: string,
  searchQuery: string,
  workingDays: WorkingDays,
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
    queryKey: ["userReports", startDate, endDate, businessId],
    queryFn: () => getUserReports(startDate, endDate, businessId, workingDays),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

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
