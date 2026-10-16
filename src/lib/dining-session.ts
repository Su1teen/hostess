export const diningSessionChanged = "hostess:dining:session-changed";

// Carts contain product IDs only. Receipts and pending quotes belong to the old identity.
export function clearDiningSession() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith("hostess:dining:") || key === "hostess:dining:return") continue;
      try {
        const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
        sessionStorage.setItem(key, JSON.stringify({ cart: saved?.cart ?? {} }));
      } catch {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Storage may be unavailable in private browsing; still clear mounted views.
  } finally {
    window.dispatchEvent(new Event(diningSessionChanged));
  }
}
