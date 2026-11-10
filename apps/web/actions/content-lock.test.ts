import { beforeEach, describe, expect, it, vi } from "vitest";

const set = vi.fn();
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ set })) }));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }));

import { unlockToken } from "@/lib/content-lock";
import { unlockContent } from "./content-lock";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("unlockContent", () => {
  beforeEach(() => {
    set.mockReset();
    revalidatePath.mockReset();
  });

  it("returns an error and sets no cookie on a wrong password", async () => {
    const state = await unlockContent({}, form({ password: "wrong", path: "/blog/x" }));
    expect(state.error).toBe("Wrong password");
    expect(set).not.toHaveBeenCalled();
  });

  it("sets an httpOnly 30-day cookie and revalidates the post", async () => {
    const state = await unlockContent({}, form({ password: "sakeoflover26!", path: "/blog/x" }));
    expect(state).toEqual({});
    expect(set).toHaveBeenCalledWith(
      "sbozh_unlock",
      unlockToken(),
      expect.objectContaining({ httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: "/" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/blog/x");
  });

  it("does not revalidate a non-path value", async () => {
    await unlockContent({}, form({ password: "sakeoflover26!", path: "https://evil" }));
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
