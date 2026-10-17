import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export interface FormData {
  medicalName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  password: string;
}

const emptyForm: FormData = {
  medicalName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  password: "",
};

export default function MedicalFormDialog({ open, onClose, onSubmit }: Props) {
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData(emptyForm);
  };

  return (
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
        <div>
          <h2 className="text-[16px] font-semibold text-ink">Add medical store</h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            Register a pharmacy and create its login credentials
          </p>
        </div>
        <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ color: "#8A968F" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <TextField
            label="Store name"
            value={formData.medicalName}
            onChange={(e) => handleChange("medicalName", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Owner name"
            value={formData.ownerName}
            onChange={(e) => handleChange("ownerName", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            fullWidth
          />

          <TextField
            label="Login email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
            required
            autoComplete="off"
            helperText="The store signs in with this address"
          />

          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
            sx={{ md: { gridColumn: "span 2" } }}
          />

          <TextField
            label="Login password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            fullWidth
            required
            autoComplete="new-password"
          />
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            !formData.medicalName ||
            !formData.ownerName ||
            !formData.email ||
            !formData.password
          }
        >
          Create store
        </Button>
      </DialogActions>
    </Dialog>
  );
}
