import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import AppLogo from "../../components/ui/AppLogo";

import { loginUser } from "../../features/auth/authService";

import { useAppDispatch } from "../../hooks/reduxHooks";

import { loginSuccess } from "../../features/auth/authSlice";
import { saveUser } from "../../utils/authStorage";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = username.trim().length > 0 && password.length > 0 && !loading;

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);

    try {
      const user = await loginUser(username.trim(), password);

      dispatch(loginSuccess(user));
      saveUser(user);

      navigate(user.role === "superadmin" ? "/superadmin" : "/medical", {
        replace: true,
      });
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel — states what the product is, no marketing theatre */}
      <div className="hidden w-[42%] max-w-[480px] flex-col justify-between bg-[#0E1F1B] p-10 lg:flex">
        <AppLogo inverted />

        <div className="max-w-[340px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            Pharmacy operations
          </p>
          <h2 className="mt-3 text-[26px] font-semibold leading-snug tracking-tight text-white">
            Point of sale, stock control and sales reporting in one workspace.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Search a medicine, complete a sale, and keep batch and expiry records
            current — from the counter, all day.
          </p>
        </div>

        <p className="text-xs text-white/35">MedPOS · Medical ERP</p>
      </div>

      {/* Sign-in form */}
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <AppLogo />
          </div>

          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-[13px] text-ink-soft">
            Use your store credentials to access the workspace.
          </p>

          {error && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ mt: 3, alignItems: "center" }}
            >
              {error}
            </Alert>
          )}

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleLogin}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoFocus
              autoComplete="username"
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!canSubmit}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-mute">
            MedPOS · Pharmacy point of sale
          </p>
        </div>
      </div>
    </div>
  );
}
