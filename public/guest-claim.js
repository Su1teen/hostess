(() => {
  const token =
    new URLSearchParams(location.hash.slice(1)).get("token") ||
    new URLSearchParams(location.search).get("token");
  history.replaceState(null, "", "/auth/claim");
  const button = document.getElementById("claim"),
    status = document.getElementById("status");
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    button.disabled = true;
    status.textContent = "Запросите новую ссылку в WhatsApp.";
    return;
  }
  button.addEventListener("click", async () => {
    button.disabled = true;
    status.textContent = "Открываем кабинет…";
    try {
      const response = await fetch("/api/guest/v1/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "same-origin",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error?.message || "Ссылка недоступна. Запросите новую в WhatsApp.");
      location.replace("/guest");
    } catch (error) {
      status.textContent = error.message || "Не удалось открыть кабинет";
      button.disabled = false;
    }
  });
})();
