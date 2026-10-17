import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/guest-claim.js", import.meta.url), "utf8");
const token = "a".repeat(43);
function page(hash: string, search = "", saved: string | null = null, responseOk = true) {
  const state = {
    listener: null as null | (() => Promise<void>),
    calls: [] as RequestInit[],
    redirect: "",
    erased: "",
    cleared: false,
  };
  const button = {
    disabled: false,
    addEventListener: (_event: string, callback: () => Promise<void>) => {
      state.listener = callback;
    },
  };
  const status = { textContent: "" };
  runInNewContext(source, {
    location: {
      hash,
      search,
      replace: (value: string) => {
        state.redirect = value;
      },
    },
    history: {
      replaceState: (_state: unknown, _title: string, value: string) => {
        state.erased = value;
      },
    },
    document: { getElementById: (id: string) => (id === "claim" ? button : status) },
    sessionStorage: {
      getItem: () => saved,
      removeItem: () => {
        state.cleared = true;
      },
    },
    AbortSignal,
    fetch: async (_url: string, init: RequestInit) => {
      state.calls.push(init);
      return { ok: responseOk, json: async () => ({}) };
    },
  });
  return { state, button, status };
}
describe("fragment-only guest claim", () => {
  test.each([
    ["", `?token=${token}`],
    [`#token=${token}`, "?token=other"],
    [`#token=${token}&token=${token}`, ""],
    [`#token=${token}&redirect=https://evil.test`, ""],
    ["#token=short", ""],
    [`#token=${token}!`, ""],
  ])("rejects unsafe token transport %s %s without consumption", (hash, search) => {
    const p = page(hash, search);
    expect(p.button.disabled).toBe(true);
    expect(p.state.listener).toBeNull();
    expect(p.state.erased).toBe("/auth/claim");
    expect(p.state.calls).toHaveLength(0);
  });
  test("crawler/page load is inert; explicit click posts the fragment once", async () => {
    const p = page(`#token=${token}`);
    expect(p.state.calls).toHaveLength(0);
    expect(p.state.erased).toBe("/auth/claim");
    await p.state.listener!();
    expect(JSON.parse(String(p.state.calls[0].body))).toEqual({ token });
    expect(p.state.calls[0].credentials).toBe("same-origin");
    expect(p.state.calls[0].cache).toBe("no-store");
    expect(p.state.calls[0].signal).toBeInstanceOf(AbortSignal);
    expect(p.state.redirect).toBe("/guest");
  });
  test.each(["https://evil.test/", "//evil.test", "/guest?redirect=evil", "/v/xoxo/t/18/" + token])(
    "rejects an unsafe stored return destination %s",
    async (saved) => {
      const p = page(`#token=${token}`, "", saved);
      await p.state.listener!();
      expect(p.state.redirect).toBe("/guest");
      expect(p.state.cleared).toBe(true);
    },
  );
  test("returns to a verified-format QR path and consumes the one-shot hint", async () => {
    const saved = "/v/xoxo/t/03/" + token;
    const p = page(`#token=${token}`, "", saved);
    await p.state.listener!();
    expect(p.state.redirect).toBe(saved);
    expect(p.state.cleared).toBe(true);
  });
  test("failed claim cannot enter account and permits an explicit retry", async () => {
    const p = page(`#token=${token}`, "", null, false);
    await p.state.listener!();
    expect(p.state.redirect).toBe("");
    expect(p.button.disabled).toBe(false);
    expect(p.status.textContent).toContain("Ссылка недоступна");
  });
});
