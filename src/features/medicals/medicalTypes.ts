export interface Medical {
  id: string;
  medicalName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateMedicalPayload {
  medicalName: string;
  ownerName: string;
  phone: string;
  /** Login identity — also the Firebase Auth account email. Required. */
  email: string;
  address: string;
  /** Used to create the Firebase Auth account; never persisted to Firestore. */
  password: string;
}

export interface UpdateMedicalPayload {
  id: string;
  medicalName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
}