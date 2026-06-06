export interface CartItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  sellingPrice: number;
  quantity: number;
  maxQuantity: number;
}

export interface SaleItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  batchNumber: string;
  sellingPrice: number;
  purchasePrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleTransaction {
  id: string;
  medicalId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "other";
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface CreateSalePayload {
  medicalId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "upi" | "other";
  customerName?: string;
  customerPhone?: string;
}
