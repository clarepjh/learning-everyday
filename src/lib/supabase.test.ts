import { describe, expect, it } from "vitest";
import { validateSupabaseConfig } from "./supabase";

describe("validateSupabaseConfig", () => {
  it("requires both project settings", () => {
    expect(validateSupabaseConfig(undefined, "publishable-key")).toContain(
      "not configured",
    );
    expect(validateSupabaseConfig("https://project.supabase.co", "")).toContain(
      "not configured",
    );
  });

  it("accepts HTTPS projects and local HTTP development", () => {
    expect(
      validateSupabaseConfig("https://project.supabase.co", "publishable-key"),
    ).toBeNull();
    expect(
      validateSupabaseConfig("http://localhost:54321", "publishable-key"),
    ).toBeNull();
  });

  it("rejects non-local HTTP and URLs containing credentials", () => {
    expect(
      validateSupabaseConfig("http://project.example", "publishable-key"),
    ).toContain("HTTPS");
    expect(
      validateSupabaseConfig(
        "https://user:password@project.supabase.co",
        "publishable-key",
      ),
    ).toContain("HTTPS");
  });
});
