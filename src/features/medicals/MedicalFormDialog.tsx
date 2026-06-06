import { useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

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
  username: string;
  password: string;
}

export default function MedicalFormDialog({
  open,
  onClose,
  onSubmit,
}: Props) {
  const [formData, setFormData] =
    useState<FormData>({
      medicalName: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      username: "",
      password: "",
    });

  const handleChange = (
    field: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);

    setFormData({
      medicalName: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      username: "",
      password: "",
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        Add Medical
      </DialogTitle>

      <DialogContent
        className="flex flex-col gap-4 pt-3"
      >
        <TextField
          label="Medical Name"
          value={formData.medicalName}
          onChange={(e) =>
            handleChange(
              "medicalName",
              e.target.value
            )
          }
        />

        <TextField
          label="Owner Name"
          value={formData.ownerName}
          onChange={(e) =>
            handleChange(
              "ownerName",
              e.target.value
            )
          }
        />

        <TextField
          label="Phone"
          value={formData.phone}
          onChange={(e) =>
            handleChange(
              "phone",
              e.target.value
            )
          }
        />

        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) =>
            handleChange(
              "email",
              e.target.value
            )
          }
        />

        <TextField
          label="Address"
          value={formData.address}
          onChange={(e) =>
            handleChange(
              "address",
              e.target.value
            )
          }
        />

        <TextField
          label="Username"
          value={formData.username}
          onChange={(e) =>
            handleChange(
              "username",
              e.target.value
            )
          }
        />

        <TextField
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            handleChange(
              "password",
              e.target.value
            )
          }
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}