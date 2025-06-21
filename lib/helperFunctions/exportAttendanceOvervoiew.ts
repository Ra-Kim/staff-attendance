import { OverviewData } from "@/hooks/useAttendanceOverview";

export const exportAttendanceOverview = (data: OverviewData, date: Date) => {
  const formattedDate = date.toISOString().split("T")[0];
  const csv = `Metric,Value
Date,${formattedDate}
Total Records,${data.totalRecords}
Total Users,${data.totalUsers}
Average Arrival Time,${data.averageArrivalTime}
Punctuality Rate,${data.punctualityRate}%
Attendance Rate,${data.attendanceRate}%
Performance Status,${data.performanceStatus}
`;

  const blob = new Blob([csv], { type: "text/csv" });
  return blob;
};
