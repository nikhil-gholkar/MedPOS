import MenuIcon from "@mui/icons-material/Menu";

import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";

interface Props {
  title: string;
  onMenuClick: () => void;
}

/** Today's date in short form — pharmacy counters work day-by-day. */
const todayLabel = new Date().toLocaleDateString("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function AppHeader({ title, onMenuClick }: Props) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: "#FFFFFF", borderBottom: "1px solid #E5E9E7" }}
    >
      <Toolbar
        variant="dense"
        sx={{
          minHeight: "52px !important",
          px: { xs: 1.5, md: 2.5 },
          gap: 1.5,
        }}
      >
        <IconButton
          size="small"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          sx={{ display: { xs: "inline-flex", md: "none" } }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>

        <div className="flex-1" />

        <Typography
          component="span"
          variant="caption"
          sx={{ display: { xs: "none", md: "block" }, color: "text.secondary" }}
          className="tnum"
        >
          {todayLabel}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
