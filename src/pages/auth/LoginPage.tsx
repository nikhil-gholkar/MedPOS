import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Button,
  Paper,
  TextField,
} from "@mui/material";

import { loginUser } from "../../features/auth/authService";

import { useAppDispatch } from "../../hooks/reduxHooks";

import { loginSuccess } from "../../features/auth/authSlice";
import { saveUser } from "../../utils/authStorage";

export default function LoginPage() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const user = await loginUser(
        username,
        password
      );

      dispatch(loginSuccess(user));

     saveUser(user);

      if (user.role === "superadmin") {
        navigate("/superadmin");
      }

      if (user.role === "medical") {
        navigate("/medical");
      }
    } catch (error) {
      alert("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Paper className="w-[400px] p-6">
        <h1 className="mb-6 text-center text-2xl font-bold">
          MedPOS Login
        </h1>

        <div className="flex flex-col gap-4">
          <TextField
            label="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            fullWidth
          />

          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading
              ? "Logging In..."
              : "Login"}
          </Button>
        </div>
      </Paper>
    </div>
  );
}