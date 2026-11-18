import { getErrorMessage, getSafeErrorDiagnostics } from "../lib/errorMessage";

export function messageOf(error: unknown) {
  const message = getErrorMessage(error);
  if (message) return message;
  console.error("Learning Everyday action failed without a readable message.", {
    error: getSafeErrorDiagnostics(error),
  });
  return "The operation failed without a readable error message. See browser console for safe diagnostics.";
}
