import { IconButton, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

interface Props {
  username: string;
  role: string;
  onLogout: () => void;
}

const roleLabel: Record<string, string> = {
  superadmin: "Platform admin",
  medical: "Pharmacy",
};

export default function UserProfileCard({ username, role, onLogout }: Props) {
  return (
    <div className="mt-auto border-t border-line px-3 py-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl bg-primary-soft text-xs font-semibold text-primary">
          {username.charAt(0).toUpperCase()}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-ink">
            {username}
          </p>
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute">
            {roleLabel[role] ?? role}
          </p>
        </div>

        <Tooltip title="Sign out">
          <IconButton
            size="small"
            onClick={onLogout}
            aria-label="Sign out"
            sx={{ color: "#8A968F", "&:hover": { color: "#B42318", backgroundColor: "#FAEBE9" } }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
