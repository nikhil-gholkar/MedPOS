import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB",
    },

    success: {
      main: "#16A34A",
    },

    warning: {
      main: "#F59E0B",
    },

    error: {
      main: "#DC2626",
    },

    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },
  },

  shape: {
    borderRadius: 14,
  },

  typography: {
    fontFamily: [
      "Inter",
      "sans-serif",
    ].join(","),
  },
});