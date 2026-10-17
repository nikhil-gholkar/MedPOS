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

import type { Medical } from "./medicalTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  medical: Medical | null;
  onConfirm: (medical: Medical) => void;
  /** True while the deletion request is in flight. */
  deleting?: boolean;
  /** Failure message shown inside the dialog (keeps it open for a retry). */
  error?: string | null;
}

/**
 * Destructive confirmation — spells out the blast radius (login, stock and
 * sales history all go) because none of it can be recovered afterwards.
 */
export default function DeleteMedicalDialog({
  open,
  onClose,
  medical,
  onConfirm,
  deleting = false,
  error = null,
}: Props) {
  if (!medical) return null;

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
            Delete store permanently?
          </h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-soft">
            {medical.medicalName} · {medical.ownerName}
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
          This removes, without recovery:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-ink-soft">
          <li>
            the store record and{" "}
            <span className="font-semibold text-ink">
              its login (owner can no longer sign in)
            </span>
          </li>
          <li>all inventory and current stock levels</li>
          <li>all sales history and reports for this store</li>
        </ul>
        <p className="mt-3 text-[13px] font-semibold text-[#B42318]">
          This action cannot be undone.
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
          onClick={() => onConfirm(medical)}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete store"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}