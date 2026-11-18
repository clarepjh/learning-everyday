import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./auth/AuthProvider";
import LoginPage from "./auth/LoginPage";
import { LearningWorkspace } from "./LearningWorkspace";

export default function App() {
  const { session, loading } = useAuth();
  if (loading) {
    return <Box className="center-state full-page"><CircularProgress aria-label="Checking your session" /></Box>;
  }
  return session ? <LearningWorkspace /> : <LoginPage />;
}
