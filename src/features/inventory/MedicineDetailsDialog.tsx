import { useEffect, useState } from "react";

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
  Divider,
} from "@mui/material";
import {
  Close,
  Edit,
  Delete,
  Save,
} from "@mui/icons-material";

import {
  deleteMedicine,
  updateMedicine,
} from "./inventoryService";

import type {
  Medicine,
  MedicineCategory,
} from "./inventoryTypes";

interface Props {
  open: boolean;
  medicine: Medicine | null;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

const categories: MedicineCategory[] = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Other",
];

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

export default function MedicineDetailsDialog({
  open,
  medicine,
  onClose,
  onUpdated,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({
    medicineName: "",
    genericName: "",
    manufacturer: "",
    category: "Tablet" as MedicineCategory,
    batchNumber: "",
    quantity: 0,
    purchasePrice: 0,
    sellingPrice: 0,
    expiryDate: "",
  });

  useEffect(() => {
    if (!medicine) return;
    setFormData({
      medicineName: medicine.medicineName,
      genericName: medicine.genericName,
      manufacturer: medicine.manufacturer,
      category: medicine.category,
      batchNumber: medicine.batchNumber,
      quantity: medicine.quantity,
      purchasePrice: medicine.purchasePrice,
      sellingPrice: medicine.sellingPrice,
      expiryDate: medicine.expiryDate,
    });
  }, [medicine]);

  if (!medicine) return null;

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
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
              {isEditing ? "Edit Medicine" : "Medicine Details"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isEditing
                ? "Update the medicine information below"
                : medicine.medicineName}
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
          <div className="mt-2 space-y-4">
            {!isEditing && (
              <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Category</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{medicine.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Stock</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{medicine.quantity} units</p>
                  </div>
                </div>
                <Divider sx={{ borderColor: "rgba(37,99,235,0.1)" }} />
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Selling Price</p>
                    <p className="mt-0.5 text-lg font-bold text-blue-700">₹{medicine.sellingPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-600">Profit/Unit</p>
                    <p className={`mt-0.5 text-lg font-bold ${medicine.sellingPrice - medicine.purchasePrice >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      ₹{medicine.sellingPrice - medicine.purchasePrice}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Medicine Name"
                fullWidth
                disabled={!isEditing}
                value={formData.medicineName}
                onChange={(e) => handleChange("medicineName", e.target.value)}
                sx={fieldSx}
              />
              <TextField
                label="Generic Name"
                fullWidth
                disabled={!isEditing}
                value={formData.genericName}
                onChange={(e) => handleChange("genericName", e.target.value)}
                sx={fieldSx}
              />
              <TextField
                label="Manufacturer"
                fullWidth
                disabled={!isEditing}
                value={formData.manufacturer}
                onChange={(e) => handleChange("manufacturer", e.target.value)}
                sx={fieldSx}
              />
              <TextField
                select
                label="Category"
                fullWidth
                disabled={!isEditing}
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                sx={fieldSx}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Batch Number"
                fullWidth
                disabled={!isEditing}
                value={formData.batchNumber}
                onChange={(e) => handleChange("batchNumber", e.target.value)}
                sx={fieldSx}
              />
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", Number(e.target.value))}
                sx={fieldSx}
              />
              <TextField
                label="Purchase Price"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.purchasePrice}
                onChange={(e) => handleChange("purchasePrice", Number(e.target.value))}
                sx={fieldSx}
              />
              <TextField
                label="Selling Price"
                type="number"
                fullWidth
                disabled={!isEditing}
                value={formData.sellingPrice}
                onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
                sx={fieldSx}
              />
            </div>

            <TextField
              type="date"
              label="Expiry Date"
              fullWidth
              disabled={!isEditing}
              value={formData.expiryDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(e) => handleChange("expiryDate", e.target.value)}
              sx={fieldSx}
            />
          </div>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #F1F5F9",
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
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#FECACA",
                  color: "#DC2626",
                  "&:hover": {
                    borderColor: "#FCA5A5",
                    backgroundColor: "#FEF2F2",
                  },
                }}
              >
                Delete
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="contained"
                  startIcon={<Edit />}
                  onClick={() => setIsEditing(true)}
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
                  Edit
                </Button>

                <Button
                  onClick={onClose}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    color: "#64748B",
                    fontWeight: 500,
                  }}
                >
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    medicineName: medicine.medicineName,
                    genericName: medicine.genericName,
                    manufacturer: medicine.manufacturer,
                    category: medicine.category,
                    batchNumber: medicine.batchNumber,
                    quantity: medicine.quantity,
                    purchasePrice: medicine.purchasePrice,
                    sellingPrice: medicine.sellingPrice,
                    expiryDate: medicine.expiryDate,
                  });
                }}
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
                startIcon={<Save />}
                onClick={handleUpdate}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.4)",
                  },
                }}
              >
                Save Changes
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: "16px" } },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <h2 className="text-lg font-semibold text-slate-900">Delete Medicine</h2>
        </DialogTitle>

        <DialogContent>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Delete sx={{ fontSize: 20, color: "#DC2626" }} />
            </div>
            <div>
              <DialogContentText sx={{ color: "#475569", fontWeight: 500 }}>
                Are you sure you want to delete this medicine?
              </DialogContentText>
              <p className="mt-1 text-sm text-slate-500">
                This action cannot be undone. The medicine "{medicine.medicineName}" will be permanently removed.
              </p>
            </div>
          </div>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setDeleteOpen(false)}
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
            startIcon={<Delete />}
            onClick={handleDelete}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
              background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
              "&:hover": {
                boxShadow: "0 6px 20px rgba(220, 38, 38, 0.4)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
