export type MedicineCategory =
  | "Tablet"
  | "Capsule"
  | "Syrup"
  | "Injection"
  | "Other";

export interface Medicine {
  id: string;

  medicalId: string;

  medicineName: string;

  genericName: string;

  manufacturer: string;

  category: MedicineCategory;

  batchNumber: string;

  quantity: number;

  purchasePrice: number;

  sellingPrice: number;

  expiryDate: string;

  supplierId?: string;

  createdAt: string;

  updatedAt: string;
}

export interface CreateMedicinePayload {
  medicineName: string;

  genericName: string;

  manufacturer: string;

  category: MedicineCategory;

  batchNumber: string;

  quantity: number;

  purchasePrice: number;

  sellingPrice: number;

  expiryDate: string;

  supplierId?: string;
}