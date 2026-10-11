import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import { useState } from "react";

import type { Medical } from "./medicalTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  medical: Medical | null;
  onSubmit: (data: Medical) => void;
}

export default function EditMedicalDialog({ open, onClose, medical, onSubmit }: Props) {
  // The parent keys this dialog by store id, so state initializes fresh per store.
  const [formData, setFormData] = useState<Medical | null>(medical);

  if (!formData) return null;

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
        <div className="min-w-0">
          <h2 className="truncate text-[16px] font-semibold text-ink">Edit store</h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-soft">
            {medical?.medicalName} · owned by {medical?.ownerName}
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
            onChange={(e) => setFormData({ ...formData, medicalName: e.target.value })}
            fullWidth
            required
          />

          <TextField
            label="Owner name"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            fullWidth
            required
          />

          <TextField
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />

          <TextField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
          />

          <TextField
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
            sx={{ md: { gridColumn: "span 2" } }}
          />
        </div>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(formData)}
          disabled={!formData.medicalName || !formData.ownerName}
        >
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
