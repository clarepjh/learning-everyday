function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;

  if (isRecord(error) && typeof error.message === "string" && error.message.trim()) {
    const code = typeof error.code === "string" ? error.code : null;
    return code ? `${error.message} (${code})` : error.message;
  }

  return null;
}

export function getSafeErrorDiagnostics(error: unknown) {
  if (!isRecord(error)) return { type: typeof error };
  return {
    type: "object",
    name: typeof error.name === "string" ? error.name : undefined,
    code: typeof error.code === "string" ? error.code : undefined,
    status: typeof error.status === "number" ? error.status : undefined,
    keys: Object.keys(error).slice(0, 20),
  };
}
