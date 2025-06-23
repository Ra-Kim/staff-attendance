export interface IUser {
  uid: string;
  email: string;
  phone_number: string;
  isAdmin: boolean;
  createdAt: string;
  businessId: string;
  business: IBusiness;
}

export interface IUserBody extends IUser {
  expectedArrivalTime?: string;
  firstName: string;
  lastName: string;
  title?: string;
  status?: "active" | "inactive";
  profilePicture?: string;
}

export interface WorkingDays {
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
}
export interface IBusiness {
  address: string;
  adminId: string;
  businessId: string;
  business_name: string;
  business_type: string;
  createdAt: string;
  email: string;
  phone_number: string;
  expectedArrivalTime?: string;
  bufferEnabled: boolean;
  bufferMinutes: number;
  workingDays: WorkingDays;
}



export interface UserFormData {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone_number: string;
  expectedArrivalTime: string;
  isAdmin: boolean;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface IAttendanceRecord {
  email: string;
  expectedTime: string;
  firstName: string;
  lastName: string;
  location: string | null; // null if not provided
  onTime: boolean; // true if clocked in on time, false if late
  phoneNumber: string; // phone number of the user
  scannedBy: "USER" | "ADMIN"; // who scanned the QR code
  scannedById: string; // uid of the user who scanned the QR code
  timeClockedIn: Date;
  uid: string; // uid of the user who clocked in
}

export interface DayAttendanceStatus {
  date: string;
  status: "onTime" | "late" | "absent";
  record?: IAttendanceRecord;
}

export interface AdminDayRecord {
  date: string;
  totalRecords: number;
  onTimeCount: number;
  lateCount: number;
  records: IAttendanceRecord[];
}


export interface UserReport {
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