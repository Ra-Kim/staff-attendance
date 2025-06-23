import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { WorkingDays } from "@/types";
import { getUserReports } from "@/lib/helperFunctions/getUserReports";

export interface Performer {
  uid: string;
  name: string;
  email: string;
  attendanceRate: number;
  punctualityRate: number;
  score: number;
}

export function usePerformanceLeaderboard(
  startDate: Date,
  endDate: Date,
  businessId: string,
  workingDays: WorkingDays
) {
  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ["performanceLeaderboard", startDate, endDate, businessId],
    queryFn: () => getUserReports(startDate, endDate, businessId, workingDays),
    staleTime: 1000 * 60 * 5,
  });

  const { bestPerformers, worstPerformers } = useMemo(() => {
    const performers: Performer[] = reports.map((r) => ({
      uid: r.uid,
      name: `${r.firstName} ${r.lastName}`,
      email: r.email,
      attendanceRate: r.attendanceRate,
      punctualityRate: r.punctualityRate,
      score: r.punctualityRate * 0.6 + r.attendanceRate * 0.4,
    }));

    const sorted = [...performers].sort((a, b) => b.score - a.score);

    return {
      bestPerformers: sorted.slice(0, 10),
      worstPerformers: sorted.slice(-10).reverse(),
    };
  }, [reports]);

  return {
    bestPerformers,
    worstPerformers,
    isLoading,
    refetch,
  };
}
