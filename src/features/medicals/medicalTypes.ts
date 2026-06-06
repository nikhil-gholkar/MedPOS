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
  email: string;
  address: string;
  username: string;
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