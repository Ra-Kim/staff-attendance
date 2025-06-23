import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUserReports } from "@/lib/helperFunctions/getUserReports";
import { WorkingDays } from "@/types";

interface LateUserReport {
  uid: string;
  name: string;
  email: string;
  lateCount: number;
  totalRecords: number;
  lateRate: number; // percentage
}

export function useLateArrivalReport(
  startDate: Date,
  endDate: Date,
  businessId: string,
  workingDays: WorkingDays
) {
  const {
    data: reports = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lateArrivalReport", startDate, endDate, businessId],
    queryFn: () => getUserReports(startDate, endDate, businessId, workingDays),
    staleTime: 1000 * 60 * 5,
  });

  const lateReports = useMemo<LateUserReport[]>(() => {
    return reports
      .map((r) => {
        const lateCount = r.lateRecords;
        const total = r.totalRecords;
        const rate = total > 0 ? (lateCount / total) * 100 : 0;

        return {
          uid: r.uid,
          name: `${r.firstName} ${r.lastName}`,
          email: r.email,
          lateCount,
          totalRecords: total,
          lateRate: Math.round(rate * 10) / 10,
        };
      })
      .filter((user) => user.lateCount > 0) // Only those who were late
      .sort((a, b) => b.lateCount - a.lateCount); // Most frequent latecomers first
  }, [reports]);

  return {
    lateReports,
    isLoading,
    refetch,
  };
}
