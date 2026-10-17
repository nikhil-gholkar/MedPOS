export type UserRole =
  | "superadmin"
  | "medical";

export interface AuthUser {
  /** Firebase Auth UID — same value as the users/{id} document ID. */
  id: string;
  /** Display name in the UI (email local-part, or legacy username). */
  username: string;
  email?: string;
  role: UserRole;
  medicalId?: string;
}

/**
 * users/{uid} profile document.
 * NOTE: never contains credentials — passwords live in Firebase Auth only,
 * and firestore.rules reject any write that includes a `password` field.
 */
export interface UserDocument {
  email?: string;
  /** Legacy field from pre-migration documents; display fallback only. */
  username?: string;
  role: UserRole;
  medicalId?: string;
  isActive: boolean;
  createdAt?: string;
}