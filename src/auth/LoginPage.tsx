import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";
import { useAuth } from "./AuthProvider";

export default function LoginPage() {
  const { signIn, configurationError, initializationError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to sign in. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box className="login-page">
      <Paper variant="outlined" className="login-card">
        <Box className="login-brand">
          <Box className="brand-mark">
            <LocalLibraryOutlinedIcon fontSize="small" />
          </Box>
          <Typography variant="h2">Learning Everyday</Typography>
        </Box>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Sign in to your private learning space.
        </Typography>
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          {configurationError && <Alert severity="error">{configurationError}</Alert>}
          {initializationError && <Alert severity="error">{initializationError}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            type="email"
            label="Email"
            autoComplete="username"
            required
            fullWidth
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || Boolean(configurationError)}
            fullWidth
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
          </Button>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Account access is private. Public registration is not available.
        </Typography>
      </Paper>
    </Box>
  );
}
