import MenuIcon from "@mui/icons-material/Menu";

import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from "@mui/material";

interface Props {
  title: string;
  onMenuClick: () => void;
}

export default function AppHeader({
  title,
  onMenuClick,
}: Props) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom:
          "1px solid #E5E7EB",
      }}
    >
      <Toolbar>

        <IconButton
          onClick={onMenuClick}
          sx={{
            display: {
              xs: "flex",
              md: "none",
            },
          }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>

      </Toolbar>
    </AppBar>
  );
}