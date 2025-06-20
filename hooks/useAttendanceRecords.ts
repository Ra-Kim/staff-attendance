import { useCallback, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/backend/firebase";
import type {
  AdminDayRecord,
  DayAttendanceStatus,
  IAttendanceRecord,
} from "@/types";

export const useAttendanceRecords = (businessId?: string) => {
  const [loading, setLoading] = useState(false);
  const [rawRecords, setRawRecords] = useState<IAttendanceRecord[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminDayRecord[]>([]);

  // Use ref to store the current businessId to avoid dependency issues
  const businessIdRef = useRef(businessId);
  businessIdRef.current = businessId;

  const fetchMonth = useCallback(async (year: number, month: number) => {
    const currentBusinessId = businessIdRef.current;
    if (!currentBusinessId) return;
    setLoading(true);

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const q = query(
      collection(db, "businesses", currentBusinessId, "attendance"),
      where("timeClockedIn", ">=", Timestamp.fromDate(start)),
      where("timeClockedIn", "<=", Timestamp.fromDate(end))
    );

    const snapshot = await getDocs(q);
    const recs = snapshot.docs.map((doc) => doc.data());

    const _recs = recs.map(
      (r) =>
        ({
          ...r,
          timeClockedIn:
            r.timeClockedIn instanceof Timestamp
              ? r.timeClockedIn.toDate()
              : new Date(r.timeClockedIn),
        } as IAttendanceRecord)
    );

    setRawRecords(_recs);

    // Build adminRecords (grouped by day)
    const grouped: { [date: string]: AdminDayRecord } = {};
    _recs.forEach((r) => {
      const date = r.timeClockedIn.toISOString().split("T")[0];

      if (!grouped[date])
        grouped[date] = {
          date,
          totalRecords: 0,
          onTimeCount: 0,
          lateCount: 0,
          records: [],
        };
      grouped[date].records.push({
        ...r,
        timeClockedIn: r.timeClockedIn,
      });
      grouped[date].totalRecords++;
      if (r.onTime) {
        grouped[date].onTimeCount++;
      } else {
        grouped[date].lateCount++;
      }
    });

    setAdminRecords(
      Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
    );
    setLoading(false);
  }, []);

  const getUserAttendance = useCallback(
    (uid: string): DayAttendanceStatus[] => {
      const map: { [date: string]: IAttendanceRecord } = {};
      rawRecords
        .filter((r) => r.uid === uid)
        .forEach((r) => (map[r.timeClockedIn.toISOString().split("T")[0]] = r));

      const daysInMonth = new Date(
        Number(rawRecords[0]?.timeClockedIn.getFullYear()),
        Number(rawRecords[0]?.timeClockedIn.getMonth()) + 1,
        0
      ).getDate();


      // Build calendar days
      const result: DayAttendanceStatus[] = [];
      const year = rawRecords[0]?.timeClockedIn.getFullYear();
      const month = rawRecords[0]?.timeClockedIn.getMonth();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = new Date(year!, month!, d).toISOString().split("T")[0];
        if (map[dateStr]) {
          const r = map[dateStr];
          result.push({
            date: dateStr,
            status: r.onTime ? "onTime" : "late",
            record: { ...r, timeClockedIn: r.timeClockedIn },
          });
        } else result.push({ date: dateStr, status: "absent" });
      }
      return result;
    },
    [rawRecords]
  );

  return { loading, adminRecords, getUserAttendance, fetchMonth, rawRecords };
};
