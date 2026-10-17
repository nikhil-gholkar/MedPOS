import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import { Close } from "@mui/icons-material";

import type {
  CreateSupplierPayload,
  Supplier,
} from "./supplierTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  /** null / undefined → create mode. */
  supplier?: Supplier | null;
  onSubmit: (payload: CreateSupplierPayload) => Promise<void>;
  saving?: boolean;
  /** Failure message shown inside the dialog (dialog stays open for retry). */
  error?: string | null;
}

interface FormState {
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const emptyForm: FormState = {
  supplierName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

const toForm = (supplier?: Supplier | null): FormState =>
  supplier
    ? {
        supplierName: supplier.supplierName ?? "",
        contactPerson: supplier.contactPerson ?? "",
        phone: supplier.phone ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
        notes: supplier.notes ?? "",
      }
    : emptyForm;

/**
 * One dialog for both create and edit (parent passes the supplier when
 * editing). The form reseeds from the incoming supplier every time the
 * dialog opens, so a closed half-filled create form never resurfaces.
 */
export default function SupplierFormDialog({
  open,
  onClose,
  supplier,
  onSubmit,
  saving = false,
  error = null,
}: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(supplier));

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- form reseeds whenever the dialog opens
    setForm(toForm(supplier));
  }, [open, supplier]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    form.supplierName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    !saving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Parent closes the dialog on success and shows `error` on failure.
    void onSubmit({
      supplierName: form.supplierName.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    });
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
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-ink">
            {supplier ? "Edit supplier" : "Add supplier"}
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-soft">
            {supplier
              ? supplier.supplierName
              : "Vendor details for purchases and calls"}
          </p>
        </div>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Close"
          sx={{ color: "#8A968F" }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        <div className="mt-1 grid gap-4 md:grid-cols-2">
          <TextField
            label="Supplier name"
            value={form.supplierName}
            onChange={(e) => handleChange("supplierName", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Contact person"
            value={form.contactPerson}
            onChange={(e) => handleChange("contactPerson", e.target.value)}
            fullWidth
          />

          <TextField
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            fullWidth
            required
            helperText="Used by the Call button"
          />

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
          />

          <TextField
            label="Address"
            value={form.address}
            onChange={(e) => handleChange("address", e.target.value)}
            fullWidth
            sx={{ md: { gridColumn: "span 2" } }}
          />

          <TextField
            label="Notes"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            fullWidth
            multiline
            minRows={2}
            sx={{ md: { gridColumn: "span 2" } }}
          />
        </div>

        {error && (
          <Alert severity="error" sx={{ mt: 2, alignItems: "flex-start" }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {saving
            ? "Saving…"
            : supplier
              ? "Save changes"
              : "Add supplier"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}