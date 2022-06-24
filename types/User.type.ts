export interface User {
  _id: string;
  fullname: string;
  isActive: boolean;
  isAvailable: boolean;
  lastLogin: number;
  role: string;
  userId: number;
}
