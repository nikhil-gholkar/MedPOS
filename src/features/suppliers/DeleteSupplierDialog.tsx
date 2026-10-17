import {
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import type { Supplier } from "./supplierTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onConfirm: (supplier: Supplier) => void;
  /** True while the deletion request is in flight. */
  deleting?: boolean;
  /** Failure message shown inside the dialog (keeps it open for a retry). */
  error?: string | null;
}

export default function DeleteSupplierDialog({
  open,
  onClose,
  supplier,
  onConfirm,
  deleting = false,
  error = null,
}: Props) {
  if (!supplier) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          pb: 1.5,
          pt: 2.5,
          px: 3,
          borderBottom: "1px solid #E5E9E7",
        }}
      >
        <WarningAmberRoundedIcon sx={{ color: "#B42318", mt: 0.25 }} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold text-ink">
            Delete supplier?
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-soft">
            {supplier.supplierName}
            {supplier.contactPerson ? ` · ${supplier.contactPerson}` : ""}
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
        <p className="text-[13px] leading-relaxed text-ink-soft">
          The supplier record and its contact details are removed
          permanently. Inventory, sales and past purchases are not affected.
        </p>

        {error && (
          <Alert severity="error" sx={{ mt: 2, alignItems: "flex-start" }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: "1px solid #E5E9E7" }}>
        <Button onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => onConfirm(supplier)}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete supplier"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}