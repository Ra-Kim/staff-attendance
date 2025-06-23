import { db } from "@/backend/firebase";
import { IAttendanceRecord, UserReport, WorkingDays } from "@/types";
import { collection, getDocs, query, where } from "firebase/firestore";

export const getUserReports = async (
  startDate: Date,
  endDate: Date,
  businessId: string,
  workingDays: WorkingDays
): Promise<UserReport[]> => {
  const isWorkingDay = (date: Date, workingDays: WorkingDays) => {
    const weekday = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase(); // "monday"
    return workingDays[weekday as keyof WorkingDays];
  };

  const getRating = (
    punctuality: number,
    attendance: number
  ): UserReport["overallRating"] => {
    const score = punctuality * 0.6 + attendance * 0.4; // Can tweak to 50/50 or 70/30

    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    return "Poor";
  };

  const getWorkingDaysInRange = (
    start: Date,
    end: Date,
    workingDays: WorkingDays
  ): number => {
    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (isWorkingDay(current, workingDays)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const q = query(
    collection(db, "businesses", businessId, "attendance"),
    where("timeClockedIn", ">=", startDate),
    where("timeClockedIn", "<=", endDate)
  );

  const snapshot = await getDocs(q);
  const records: IAttendanceRecord[] = snapshot.docs
    .map((doc) => ({
      ...(doc.data() as any),
      timeClockedIn: doc.data().timeClockedIn.toDate(),
    }))
    .filter((record) => isWorkingDay(record.timeClockedIn, workingDays));

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
    const actualWorkingDays = getWorkingDaysInRange(
      startDate,
      endDate,
      workingDays
    );

    const attendanceRate = (totalRecords / actualWorkingDays) * 100;

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
      overallRating: getRating(punctualityRate, attendanceRate),
      totalRecords,
      onTimeRecords,
      lateRecords,
      workingDays: actualWorkingDays,
    };
  });
};
