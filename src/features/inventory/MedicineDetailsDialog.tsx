import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  DialogContentText,
  IconButton,
} from "@mui/material";
import { Close, Edit, Delete, Save } from "@mui/icons-material";

import { deleteMedicine, updateMedicine } from "./inventoryService";
import { MEDICINE_CATEGORIES } from "./categoryMeta";

import type { Medicine, MedicineCategory } from "./inventoryTypes";

interface Props {
  open: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

type MedicineFormState = {
  medicineName: string;
  genericName: string;
  manufacturer: string;
  category: MedicineCategory;
  batchNumber: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
};

const buildFormState = (medicine: Medicine | null): MedicineFormState => ({
  medicineName: medicine?.medicineName ?? "",
  genericName: medicine?.genericName ?? "",
  manufacturer: medicine?.manufacturer ?? "",
  category: medicine?.category ?? "Tablet",
  batchNumber: medicine?.batchNumber ?? "",
  quantity: medicine?.quantity ?? 0,
  purchasePrice: medicine?.purchasePrice ?? 0,
  sellingPrice: medicine?.sellingPrice ?? 0,
  expiryDate: medicine?.expiryDate ?? "",
});

const TAG = "inline-flex items-center rounded-chip border px-1.5 py-0.5 text-[11px] font-medium";

const stockTag = (quantity: number) => {
  if (quantity <= 0) {
    return { label: "Out of stock", className: `${TAG} border-danger/25 bg-danger-soft text-danger` };
  }
  if (quantity <= 10) {
    return { label: "Low stock", className: `${TAG} border-warn/25 bg-warn-soft text-warn` };
  }
  return { label: "In stock", className: `${TAG} border-ok/25 bg-ok-soft text-ok` };
};

export default function MedicineDetailsDialog({ open, medicine, onClose, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // The parent keys this dialog by medicine id, so state initializes fresh per medicine.
  const [formData, setFormData] = useState<MedicineFormState>(() =>
    buildFormState(medicine)
  );

  if (!medicine) return null;

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData(buildFormState(medicine));
  };

  const handleUpdate = async () => {
    try {
      await updateMedicine(medicine.id, formData);
      await onUpdated();
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMedicine(medicine.id);
      await onUpdated();
      setDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const profit = medicine.sellingPrice - medicine.purchasePrice;
  const stock = stockTag(medicine.quantity);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            pb: 1.5,
            pt: 2.5,
            px: 3,
            borderBottom: "1px solid #E5E9E7",
          }}
        >
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-ink">
              {isEditing ? "Edit medicine" : medicine.medicineName}
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">
              {isEditing
                ? "Update the record — changes apply to future sales"
                : `${medicine.genericName} · ${medicine.manufacturer || "Unknown manufacturer"}`}
            </p>
          </div>
          <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ color: "#8A968F" }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 3 }}>
          <div className="mt-1 space-y-4">
            {!isEditing && (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-ctl border border-line bg-line sm:grid-cols-4">
                <div className="bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                    Stock
                  </p>
                  <p className="tnum mt-1 text-[15px] font-semibold text-ink">{medicine.quantity}</p>
                  <span className={`${stock.className} mt-1.5`}>{stock.label}</span>
                </div>
                <div className="bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                    Selling price
                  </p>
                  <p className="tnum mt-1 text-[15px] font-semibold text-ink">
                    ₹{medicine.sellingPrice.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-mute">per unit</p>
                </div>
                <div className="bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                    Profit/unit
                  </p>
                  <p
                    className={`tnum mt-1 text-[15px] font-semibold ${
                      profit >= 0 ? "text-ok" : "text-danger"
                    }`}
                  >
                    ₹{profit.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-mute">
                    Cost ₹{medicine.purchasePrice.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-mute">
                    Batch
                  </p>
                  <p className="tnum mt-1 text-[15px] font-semibold text-ink">
                    {medicine.batchNumber || "—"}
                  </p>
                  <p className="mt-1.5 text-[11px] text-ink-mute">
                    Exp{" "}
                    {new Date(medicine.expiryDate).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Medicine name"
                fullWidth
                disabled={!isEditing}
                value={formData.medicineName}
                onChange={(e) => handleChange("medicineName", e.target.value)}
              />
              <TextField
                label="Generic name"
                fullWidth
                disabled={!isEditing}
                value={formData.genericName}
                onChange={(e) => handleChange("genericName", e.target.value)}
              />
              <TextField
                label="Manufacturer"
                fullWidth
                disabled={!isEditing}
                value={formData.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
              />
              <TextField
                select
                label="Category"
                fullWidth
                disabled={!isEditing}
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {MEDICINE_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Batch number"
                fullWidth
                disabled={!isEditing}
                value={formData.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
              />
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", Number(e.target.value))}
              />
              <TextField
                label="Purchase price (₹)"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", Number(e.target.value))}
              />
              <TextField
                label="Selling price (₹)"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.sellingPrice}
                onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
              />
            </div>

            <TextField
              type="date"
              label="Expiry date"
              fullWidth
              disabled={!isEditing}
              value={formData.expiryDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
            />
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #E5E9E7",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {!isEditing ? (
            <>
              <Button
                color="error"
                variant="outlined"
                startIcon={<Delete />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>

              <div className="flex gap-2">
                <Button onClick={onClose}>Close</Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>

              <Button variant="contained" startIcon={<Save />} onClick={handleUpdate}>
                Save changes
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ pb: 1 }}>
          <h2 className="text-[16px] font-semibold text-ink">Delete medicine</h2>
        </DialogTitle>

        <DialogContent>
          <DialogContentText component="div" sx={{ color: "#4E5D57" }}>
            <p className="text-[13px] font-medium">
              Remove “{medicine.medicineName}” from the catalogue?
            </p>
            <p className="mt-1 text-[13px]">
              This cannot be undone. Past sales records are kept.
            </p>
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" startIcon={<Delete />} onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
