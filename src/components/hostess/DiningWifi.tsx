import { useEffect, useMemo, useState } from "react";
import { Check, Copy, QrCode, Wifi } from "lucide-react";
import { diningApi, type GuestWifi } from "@/lib/dine-in-api";
import qrcodegen from "@/lib/vendor/qrcodegen";
import { Button } from "./system";

type Platform = "apple" | "android" | "other";
export const WIFI_PROFILE_URL = "/wifi/xoxo.mobileconfig";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; profiles install the same way on iPhone, iPad and Mac.
  if (/iPhone|iPad|iPod|Macintosh/.test(ua)) return "apple";
  return /Android/.test(ua) ? "android" : "other";
}

function WifiQr({ value }: { value: string }) {
  const path = useMemo(() => {
    const qr = qrcodegen.QrCode.encodeText(value, qrcodegen.QrCode.Ecc.MEDIUM);
    const parts: string[] = [];
    for (let y = 0; y < qr.size; y++)
      for (let x = 0; x < qr.size; x++)
        if (qr.getModule(x, y)) parts.push(`M${x + 4},${y + 4}h1v1h-1z`);
    return { d: parts.join(""), size: qr.size + 8 };
  }, [value]);
  return (
    <svg
      viewBox={`0 0 ${path.size} ${path.size}`}
      className="mx-auto size-52 rounded-2xl bg-white"
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR-код Wi-Fi"
    >
      <path d={path.d} fill="#111" />
    </svg>
  );
}

/**
 * Guest Wi-Fi on the table page. A browser cannot join a network by itself, so each device gets
 * the closest thing: an Apple configuration profile (iPhone, iPad, Mac join automatically after
 * installing it), copy buttons everywhere, and a Wi-Fi QR another phone's camera joins with.
 */
export function DiningWifi() {
  const [wifi, setWifi] = useState<GuestWifi | null>(null);
  const [platform, setPlatform] = useState<Platform>("other");
  const [copied, setCopied] = useState<"ssid" | "password" | null>(null);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    setPlatform(detectPlatform());
    const controller = new AbortController();
    diningApi
      .wifi(controller.signal)
      .then((result) => setWifi(result.wifi))
      .catch(() => {
        // Wi-Fi is a convenience: the page keeps working without it.
      });
    return () => controller.abort();
  }, []);
  if (!wifi) return null;
  const copy = async (field: "ssid" | "password") => {
    const value = field === "ssid" ? wifi.ssid : wifi.password;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Older in-app browsers: fall back to a hidden textarea.
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(field);
    window.setTimeout(() => setCopied((current) => (current === field ? null : current)), 2000);
  };
  const row = (field: "ssid" | "password", label: string, value: string) => (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-ink-3">{label}</p>
        {/* Spaces are part of the network name: keep them visible exactly as configured. */}
        <p className="mt-1 break-all font-medium [white-space:pre-wrap]">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copy(field)}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-stone px-4 text-sm"
        aria-label={`Скопировать: ${label.toLowerCase()}`}
      >
        {copied === field ? <Check size={15} /> : <Copy size={15} />}
        {copied === field ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
  return (
    <section
      className="mx-5 mb-5 rounded-[24px] border border-line bg-surface p-5"
      aria-label="Wi-Fi"
    >
      <p className="dining-eyebrow text-ink-2">
        <Wifi size={15} /> БЕСПЛАТНЫЙ WI-FI
      </p>
      <div className="mt-2 divide-y divide-line">
        {row("ssid", "СЕТЬ", wifi.ssid)}
        {wifi.security !== "nopass" && row("password", "ПАРОЛЬ", wifi.password)}
      </div>
      {platform === "apple" ? (
        <>
          <a
            href={WIFI_PROFILE_URL}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-medium text-white"
          >
            <Wifi size={17} /> Подключиться автоматически
          </a>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Разрешите загрузку профиля, затем откройте Настройки → «Профиль загружен» →
            «Установить». Дальше устройство подключится само. Если кнопка не сработала, откройте
            страницу в Safari.
          </p>
        </>
      ) : (
        <>
          {wifi.security !== "nopass" && (
            <Button block size="lg" className="mt-3" onClick={() => void copy("password")}>
              {copied === "password" ? <Check size={17} /> : <Copy size={17} />}
              {copied === "password" ? "Пароль скопирован" : "Скопировать пароль"}
            </Button>
          )}
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            {platform === "android"
              ? "Откройте Wi-Fi в настройках, выберите сеть и вставьте пароль. Android не разрешает сайтам подключать телефон к сети, поэтому быстрее всего — QR ниже: соседу достаточно навести камеру."
              : "Выберите сеть в списке Wi-Fi и вставьте пароль."}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={() => setShowQr(!showQr)}
        aria-expanded={showQr}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm text-ink-2 shadow-[inset_0_0_0_1px_var(--hs-line-strong)]"
      >
        <QrCode size={16} /> {showQr ? "Скрыть QR" : "QR для другого телефона"}
      </button>
      {showQr && (
        <div className="mt-4 text-center">
          <WifiQr value={wifi.qr} />
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            Наведите камеру другого телефона — он подключится к Wi-Fi сам, без ввода пароля.
          </p>
        </div>
      )}
    </section>
  );
}
