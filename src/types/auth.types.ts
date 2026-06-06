export type UserRole =
  | "superadmin"
  | "medical";

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  medicalId?: string;
}

export interface UserDocument
  extends AuthUser {
  password: string;
  isActive: boolean;
}