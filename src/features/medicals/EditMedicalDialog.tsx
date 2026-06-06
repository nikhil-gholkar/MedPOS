import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

import { useEffect, useState } from "react";

import type {
  Medical,
} from "./medicalTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  medical: Medical | null;
  onSubmit: (data: Medical) => void;
}

export default function EditMedicalDialog({
  open,
  onClose,
  medical,
  onSubmit,
}: Props) {
  const [formData, setFormData] =
    useState<Medical | null>(null);

  useEffect(() => {
    if (medical) {
      setFormData(medical);
    }
  }, [medical]);

  if (!formData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Edit Medical
      </DialogTitle>

      <DialogContent
        className="flex flex-col gap-4 pt-3"
      >
        <TextField
          label="Medical Name"
          value={formData.medicalName}
          onChange={(e) =>
            setFormData({
              ...formData,
              medicalName:
                e.target.value,
            })
          }
        />

        <TextField
          label="Owner Name"
          value={formData.ownerName}
          onChange={(e) =>
            setFormData({
              ...formData,
              ownerName:
                e.target.value,
            })
          }
        />

        <TextField
          label="Phone"
          value={formData.phone}
          onChange={(e) =>
            setFormData({
              ...formData,
              phone: e.target.value,
            })
          }
        />

        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
        />

        <TextField
          label="Address"
          value={formData.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              address:
                e.target.value,
            })
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={() =>
            onSubmit(formData)
          }
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}