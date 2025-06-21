import { useCallback, useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/backend/firebase";
import type { IAttendanceRecord } from "@/types";

type StatusFilter = "all" | "onTime" | "late";

export const useGeneralAttendanceReports = (businessId?: string) => {
  const [records, setRecords] = useState<IAttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<IAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchRecords = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, "businesses", businessId, "attendance"),
      where("timeClockedIn", ">=", Timestamp.fromDate(start)),
      where("timeClockedIn", "<=", Timestamp.fromDate(end))
    );

    const snapshot = await getDocs(q);
    const recs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        timeClockedIn:
          data.timeClockedIn instanceof Timestamp
            ? data.timeClockedIn.toDate()
            : new Date(data.timeClockedIn),
      } as IAttendanceRecord;
    });

    setRecords(recs);
    setLoading(false);
  }, [businessId, startDate, endDate]);

  const filterRecords = useCallback(() => {
    let filtered = records;

    if (searchQuery) {
      filtered = filtered.filter(
        (record) =>
          record.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) =>
        statusFilter === "onTime" ? record.onTime : !record.onTime
      );
    }

    setFilteredRecords(filtered);
  }, [records, searchQuery, statusFilter]);

  useEffect(() => {
    filterRecords();
  }, [records, searchQuery, statusFilter, filterRecords]);

  return {
    loading,
    records,
    filteredRecords,
    fetchRecords,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearFilters: () => {
      setSearchQuery("");
      setStatusFilter("all");
      setStartDate(new Date());
      setEndDate(new Date());
    },
  };
};
