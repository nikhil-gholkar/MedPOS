import { createTheme } from "@mui/material/styles";

/* Palette shared with the Tailwind tokens in index.css.
   Kept as literals because MUI cannot read CSS variables at theme build time. */
const ink = "#16211D";
const inkSoft = "#4E5D57";
const line = "#E5E9E7";
const lineStrong = "#D4DAD7";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0F766E",
      dark: "#0B5F59",
      light: "#E7F3F1",
      contrastText: "#FFFFFF",
    },
    success: { main: "#157F3D", light: "#E8F5EC" },
    warning: { main: "#B45309", light: "#FBF1E3" },
    error: { main: "#B42318", light: "#FAEBE9" },
    info: { main: "#175CD3", light: "#E8EFFA" },
    background: { default: "#F5F7F6", paper: "#FFFFFF" },
    text: { primary: ink, secondary: inkSoft },
    divider: line,
  },

  shape: {
    borderRadius: 6,
  },

  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: {
      fontSize: "1.375rem",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "-0.01em",
    },
    h2: { fontSize: "1.0625rem", fontWeight: 600, lineHeight: 1.4 },
    h3: { fontSize: "0.9375rem", fontWeight: 600, lineHeight: 1.45 },
    subtitle1: { fontSize: "0.875rem", fontWeight: 500 },
    subtitle2: { fontSize: "0.8125rem", fontWeight: 500 },
    body1: { fontSize: "0.875rem", lineHeight: 1.55 },
    body2: { fontSize: "0.8125rem", lineHeight: 1.55 },
    caption: { fontSize: "0.75rem", lineHeight: 1.5, color: inkSoft },
    overline: {
      fontSize: "0.6875rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#8A968F",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.8125rem",
      letterSpacing: 0,
    },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 36,
          paddingInline: 14,
          boxShadow: "none",
          whiteSpace: "nowrap",
          "&.MuiButton-containedPrimary:hover": { backgroundColor: "#0B5F59" },
          "&.MuiButton-containedError:hover": { backgroundColor: "#8F1C13" },
        },
        sizeSmall: { minHeight: 30, paddingInline: 10, fontSize: "0.75rem" },
        sizeLarge: { minHeight: 44, fontSize: "0.875rem" },
        contained: { "&:hover": { boxShadow: "none" } },
        outlined: {
          borderColor: lineStrong,
          color: ink,
          "&:hover": {
            borderColor: "#0F766E",
            backgroundColor: "#F1F7F6",
            color: "#0B5F59",
          },
        },
        text: { "&:hover": { backgroundColor: "#EEF2F0" } },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },

    MuiTextField: {
      defaultProps: { size: "small" },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: "0.875rem",
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: lineStrong },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#AEB9B4" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0F766E",
            borderWidth: 1.5,
          },
        },
        input: { padding: "10px 12px" },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 26,
          fontSize: "0.75rem",
          fontWeight: 500,
        },
        label: { paddingLeft: 10, paddingRight: 10 },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 38,
          paddingInline: 10,
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 32 },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: "0 20px 48px rgba(16, 32, 28, 0.18)",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#6B7873",
          backgroundColor: "#F8FAF9",
          borderBottom: `1px solid ${line}`,
          whiteSpace: "nowrap",
        },
        body: {
          fontSize: "0.8125rem",
          color: ink,
          borderBottom: "1px solid #EEF1EF",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, fontSize: "0.8125rem", fontWeight: 500 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 4,
          fontSize: "0.6875rem",
          backgroundColor: "#16211D",
        },
      },
    },
  },
});
