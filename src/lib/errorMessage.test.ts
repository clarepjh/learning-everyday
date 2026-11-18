import { describe, expect, it } from "vitest";
import { getErrorMessage, getSafeErrorDiagnostics } from "./errorMessage";

describe("error diagnostics", () => {
  it("uses native Error messages", () => {
    expect(getErrorMessage(new Error("Database unavailable"))).toBe(
      "Database unavailable",
    );
  });

  it("preserves messages from structured API errors", () => {
    expect(
      getErrorMessage({ message: "relation does not exist", code: "42P01" }),
    ).toBe("relation does not exist (42P01)");
  });

  it("handles string errors and provides safe metadata for unknown values", () => {
    expect(getErrorMessage("Request failed")).toBe("Request failed");
    const secretLookingValue = { code: "E_UNKNOWN", token: "never-log-me" };
    expect(getErrorMessage(secretLookingValue)).toBeNull();
    expect(getSafeErrorDiagnostics(secretLookingValue)).toEqual({
      type: "object",
      name: undefined,
      code: "E_UNKNOWN",
      status: undefined,
      keys: ["code", "token"],
    });
  });
});
