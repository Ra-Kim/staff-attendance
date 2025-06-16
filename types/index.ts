export interface IUser {
  uid: string;
  email: string;
  phone_number: string;
  isAdmin: boolean;
  createdAt: string | Date;
  businessId: string;
  business: IBusiness;
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
}
