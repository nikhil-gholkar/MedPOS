import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import type {
  CreateMedicinePayload,
  MedicineCategory,
} from "./inventoryTypes";
import { MEDICINE_CATEGORIES } from "./categoryMeta";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMedicinePayload) => void | Promise<void>;
}

const initialForm: CreateMedicinePayload = {
  medicineName: "",
  genericName: "",
  manufacturer: "",
  category: "Tablet",
  batchNumber: "",
  quantity: 0,
  purchasePrice: 0,
  sellingPrice: 0,
  expiryDate: "",
  supplierId: "",
};

export default function MedicineFormDialog({ open, onClose, onSubmit }: Props) {
  const [formData, setFormData] = useState<CreateMedicinePayload>(initialForm);

  const handleChange = (
    field: keyof CreateMedicinePayload,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
    setFormData(initialForm);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
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
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Add medicine</h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Stock, pricing and batch details for a new catalogue item
          </p>
        </div>
        <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ color: "#8A968F" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <TextField
            label="Medicine name"
            value={formData.medicineName}
            onChange={(e) => handleChange("medicineName", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Generic name"
            value={formData.genericName}
            onChange={(e) => handleChange("genericName", e.target.value)}
            fullWidth
          />

          <TextField
            label="Manufacturer"
            value={formData.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            fullWidth
          >
            {MEDICINE_CATEGORIES.map((category: MedicineCategory) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Batch number"
            value={formData.batchNumber}
            onChange={(e) => handleChange("batchNumber", e.target.value)}
            fullWidth
          />

          <TextField
            type="number"
            label="Quantity"
            value={formData.quantity}
            onChange={(e) => handleChange("quantity", Number(e.target.value))}
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            type="number"
            label="Purchase price (₹)"
            value={formData.purchasePrice}
            onChange={(e) => handleChange("purchasePrice", Number(e.target.value))}
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            type="number"
            label="Selling price (₹)"
            value={formData.sellingPrice}
            onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
            fullWidth
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            type="date"
            label="Expiry date"
            slotProps={{
              inputLabel: { shrink: true },
            }}
            value={formData.expiryDate}
            onChange={(e) => handleChange("expiryDate", e.target.value)}
            fullWidth
            sx={{ md: { gridColumn: "span 2" } }}
          />
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Add medicine
        </Button>
      </DialogActions>
    </Dialog>
  );
}
