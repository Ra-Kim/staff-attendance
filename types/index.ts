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
  bufferEnabled: boolean
  bufferMinutes: number;
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
