import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/backend/firebase";
import type { IAttendanceRecord } from "@/types";

export interface OverviewData {
  totalRecords: number;
  totalUsers: number;
  averageArrivalTime: string;
  punctualityRate: number;
  attendanceRate: number;
  performanceStatus: "Good" | "Needs Attention";
}

export const useAttendanceOverview = (businessId?: string, date?: Date) => {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId || !date) return;

    const fetchOverview = async () => {
      setLoading(true);
      try {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const q = query(
          collection(db, "businesses", businessId, "attendance"),
          where("timeClockedIn", ">=", Timestamp.fromDate(start)),
          where("timeClockedIn", "<=", Timestamp.fromDate(end))
        );

        const snapshot = await getDocs(q);
        const records: IAttendanceRecord[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            timeClockedIn:
              data.timeClockedIn.toDate?.() ?? new Date(data.timeClockedIn),
          } as IAttendanceRecord;
        });

        const totalRecords = records.length;
        const usersSet = new Set(records.map((r) => r.uid));
        const totalUsers = usersSet.size;

        // Compute average arrival time
        const totalMinutes = records.reduce((sum, r) => {
          const t = r.timeClockedIn;
          return sum + t.getHours() * 60 + t.getMinutes();
        }, 0);
        const averageMinutes = totalRecords
          ? Math.floor(totalMinutes / totalRecords)
          : 0;
        const avgHour = Math.floor(averageMinutes / 60);
        const avgMin = averageMinutes % 60;
        const averageArrivalTime = `${String(avgHour).padStart(
          2,
          "0"
        )}:${String(avgMin).padStart(2, "0")} ${avgHour < 12 ? "AM" : "PM"}`;

        // Compute punctuality rate
        const onTimeCount = records.filter((r) => r.onTime).length;
        const punctualityRate = totalRecords
          ? parseFloat(((onTimeCount / totalRecords) * 100).toFixed(1))
          : 0;

        const attendanceRate = totalUsers
          ? parseFloat(((totalRecords / totalUsers) * 100).toFixed(1))
          : 0;

        const performanceStatus: OverviewData["performanceStatus"] =
          punctualityRate >= 85 ? "Good" : "Needs Attention";

        setOverviewData({
          totalRecords,
          totalUsers,
          averageArrivalTime,
          punctualityRate,
          attendanceRate,
          performanceStatus
        });
      } catch (err) {
        console.error("Error fetching attendance overview:", err);
        setOverviewData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [businessId, date]);

  return { overviewData, loading };
};
