import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

import { Provider } from "react-redux";
import { store } from "./app/store";

import { ThemeProvider } from "@mui/material/styles";

import { theme } from "./theme/muiTheme";

import { initializeAuth } from "./features/auth/authInitializer";

initializeAuth();

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </Provider>
);