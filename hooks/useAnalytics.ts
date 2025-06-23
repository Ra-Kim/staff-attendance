import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/backend/firebase";
import { IAttendanceRecord, WorkingDays } from "@/types";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";

dayjs.extend(weekOfYear);

interface UseAnalyticsSummaryParams {
  businessId: string;
  startDate: Date;
  endDate: Date;
  workingDays: WorkingDays;
}

interface Summary {
  totalUsers: number;
  attendanceRate: number;
  punctualityRate: number;
  averageClockInTime: string;
}

interface AttendanceTrend {
  labels: string[];
  data: number[];
}

export const useAnalyticsSummary = ({
  businessId,
  startDate,
  endDate,
  workingDays,
}: UseAnalyticsSummaryParams) => {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrend>({
    labels: [],
    data: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const q = query(
        collection(db, "businesses", businessId, "attendance"),
        where("timeClockedIn", ">=", startDate),
        where("timeClockedIn", "<=", endDate)
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


      const uniqueUsers = new Set(records.map((r) => r.uid));
      const totalUsers = uniqueUsers.size;

      const attendedCount = records.length;
      const onTimeCount = records.filter((r) => r.onTime).length;
      const punctualityRate = totalUsers
        ? (onTimeCount / attendedCount) * 100
        : 0;
      const attendanceRate = totalUsers
        ? (attendedCount /
            (totalUsers * countWorkingDays(startDate, endDate, workingDays))) *
          100
        : 0;

      // Average clock-in time
      const validTimes = records.map((r) => dayjs(r.timeClockedIn));
      const avgTime = validTimes.length
        ? dayjs(
            new Date(
              (validTimes.reduce(
                (sum, t) => sum + t.hour() * 60 + t.minute(),
                0
              ) /
                validTimes.length) *
                60 *
                1000
            )
          ).format("hh:mm A")
        : "--";

      // Attendance trend per week
      const weeklyMap = new Map<string, IAttendanceRecord[]>();
      records.forEach((r) => {
        const weekNumber = dayjs(r.timeClockedIn).week();
        const week = `Week ${weekNumber}`;
        if (!weeklyMap.has(week)) weeklyMap.set(week, []);
        weeklyMap.get(week)!.push(r);
      });

      const labels: string[] = [];
      const data: number[] = [];

      weeklyMap.forEach((records, week) => {
        const total = records.length;
        const unique = new Set(records.map((r) => r.uid)).size;
        const days = countWorkingDaysInRange(records, workingDays);
        const rate = days && unique ? (total / (unique * days)) * 100 : 0;
        labels.push(week);
        data.push(Number(rate.toFixed(1)));
      });

      setSummary({
        totalUsers,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        punctualityRate: Number(punctualityRate.toFixed(1)),
        averageClockInTime: avgTime,
      });


      setAttendanceTrend({ labels, data });
      setLoading(false);
    };

    if (businessId) fetchData();
  }, [businessId, startDate, endDate, workingDays]);

  return { summary, attendanceTrend, loading };
};

function countWorkingDays(start: Date, end: Date, workingDays: WorkingDays) {
  let count = 0;
  let current = dayjs(start);
  const stop = dayjs(end);
  while (current.isBefore(stop) || current.isSame(stop, "day")) {
    const day = current.format("dddd").toLowerCase();
    if (workingDays[day as keyof WorkingDays]) count++;
    current = current.add(1, "day");
  }
  return count;
}

function countWorkingDaysInRange(
  records: IAttendanceRecord[],
  workingDays: WorkingDays
) {
  const uniqueDates = new Set(
    records.map((r) => dayjs(r.timeClockedIn).format("YYYY-MM-DD"))
  );
  return Array.from(uniqueDates).filter(
    (d) =>
      workingDays[dayjs(d).format("dddd").toLowerCase() as keyof WorkingDays]
  ).length;
}
