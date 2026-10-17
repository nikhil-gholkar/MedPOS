export interface Supplier {
  id: string;
  /** Owning tenant — required by firestore.rules on every write. */
  medicalId: string;
  supplierName: string;
  contactPerson: string;
  /** Dialler number — the Call action uses this. */
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierPayload {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface UpdateSupplierPayload
  extends Partial<CreateSupplierPayload> {
  id: string;
}