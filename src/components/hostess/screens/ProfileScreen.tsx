import { DiningAccount } from "../DiningAccount";
import { BusinessProfileScreen } from "./BusinessProfileScreen";

export function ProfileScreen({
  onLogout,
  variant = "guest",
}: {
  onSplitBill?: () => void;
  onLogout: () => void;
  variant?: "guest" | "business";
}) {
  if (variant === "business") return <BusinessProfileScreen onLogout={onLogout} />;
  return (
    <div className="no-scrollbar h-full overflow-y-auto overscroll-none bg-canvas px-5 pb-nav pt-safe">
      <p className="t-micro py-5">HOSTESS · Личный кабинет</p>
      <DiningAccount />
      <a href="/guest" className="mt-5 flex min-h-12 items-center text-sm underline">
        Мои бронирования
      </a>
      <button onClick={onLogout} className="min-h-12 text-sm text-ink-2">
        Вернуться к выбору интерфейса
      </button>
    </div>
  );
}
