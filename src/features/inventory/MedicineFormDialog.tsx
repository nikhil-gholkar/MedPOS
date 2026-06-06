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

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateMedicinePayload
  ) => void | Promise<void>;
}

const categories: MedicineCategory[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Other",
];

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

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#F8FAFC",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#2563EB" },
};

export default function MedicineFormDialog({
  open,
  onClose,
  onSubmit,
}: Props) {
  const [formData, setFormData] =
    useState<CreateMedicinePayload>(initialForm);

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
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: { sx: { borderRadius: "20px", overflow: "hidden" } },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
          pt: 2.5,
          px: 3,
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Add New Medicine
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Fill in the details below to add a medicine
          </p>
        </div>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#94A3B8",
            "&:hover": { backgroundColor: "#F1F5F9" },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <TextField
            label="Medicine Name"
            value={formData.medicineName}
            onChange={(e) => handleChange("medicineName", e.target.value)}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            label="Generic Name"
            value={formData.genericName}
            onChange={(e) => handleChange("genericName", e.target.value)}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            label="Manufacturer"
            value={formData.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            select
            label="Category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            fullWidth
            sx={fieldSx}
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Batch Number"
            value={formData.batchNumber}
            onChange={(e) => handleChange("batchNumber", e.target.value)}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            type="number"
            label="Quantity"
            value={formData.quantity}
            onChange={(e) => handleChange("quantity", Number(e.target.value))}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            type="number"
            label="Purchase Price"
            value={formData.purchasePrice}
            onChange={(e) => handleChange("purchasePrice", Number(e.target.value))}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            type="number"
            label="Selling Price"
            value={formData.sellingPrice}
            onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
            fullWidth
            sx={fieldSx}
          />

          <TextField
            type="date"
            label="Expiry Date"
            slotProps={{
              inputLabel: { shrink: true },
            }}
            value={formData.expiryDate}
            onChange={(e) => handleChange("expiryDate", e.target.value)}
            fullWidth
            sx={{ ...fieldSx, gridColumn: "span 2" }}
          />
        </div>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          borderTop: "1px solid #F1F5F9",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            color: "#64748B",
            fontWeight: 500,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            "&:hover": {
              boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
            },
          }}
        >
          Add Medicine
        </Button>
      </DialogActions>
    </Dialog>
  );
}
