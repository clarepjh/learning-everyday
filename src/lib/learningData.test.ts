import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    "insert",
    "select",
    "single",
    "eq",
    "order",
    "update",
    "delete",
  ]) {
    query[method] = vi.fn(() => query);
  }
  return {
    query,
    getUser: vi.fn(),
    from: vi.fn(() => query),
  };
});

vi.mock("./supabase", () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

import { createSubject } from "./learningData";

describe("learning data ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "authenticated-owner" } },
      error: null,
    });
  });

  it("assigns new subjects to the authenticated user", async () => {
    const subject = {
      id: "subject-1",
      user_id: "authenticated-owner",
      name: "Algorithms",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.query.single.mockResolvedValue({ data: subject, error: null });

    await expect(createSubject("  Algorithms ")).resolves.toEqual(subject);
    expect(mocks.query.insert).toHaveBeenCalledWith({
      user_id: "authenticated-owner",
      name: "Algorithms",
    });
  });

  it("does not submit blank subject names", async () => {
    await expect(createSubject("  ")).rejects.toThrow("cannot be blank");
    expect(mocks.query.insert).not.toHaveBeenCalled();
  });
});
