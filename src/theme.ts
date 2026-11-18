import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#fd1d86",
      dark: "#fd1d86",
      light: "#ffd1e7",
      contrastText: "#1d1d1d",
    },
    secondary: { main: "#c7b5e6", contrastText: "#1d1d1d" },
    background: { default: "#faf6fd", paper: "#ffffff" },
    text: { primary: "#1d1d1d", secondary: "#1d1d1d" },
    divider: "#e5d7ed",
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em" },
    h2: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em" },
    h3: { fontSize: "1.1rem", fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 650 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40 },
        containedPrimary: { "&:hover": { backgroundColor: "#ff4d9f" } },
        textPrimary: { color: "#1d1d1d" },
        outlinedPrimary: { color: "#1d1d1d" },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { "&.Mui-focused": { color: "#1d1d1d" } } },
    },
    MuiTab: {
      styleOverrides: { root: { "&.Mui-selected": { color: "#1d1d1d" } } },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
  },
});
