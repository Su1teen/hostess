import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bento-box карточка: единый premium-контейнер для логических блоков.
 * Крупный радиус, мягкая тень / тонкая рамка, консистентный паддинг.
 * Используется в Профиле, Каталоге и элементах Автомойки (Task 7).
 */
export function BentoCard({
  children,
  className,
  padded = true,
  as: Tag = "div",
  type,
  ...props
}: {
  children: ReactNode;
  className?: string;
  /** Отключить внутренний паддинг (для карточек с картинкой во всю ширину). */
  padded?: boolean;
  as?: "div" | "section" | "button";
  type?: "button" | "submit";
} & React.HTMLAttributes<HTMLElement>) {
  const buttonProps = Tag === "button" ? { type: type ?? "button" } : undefined;

  return (
    <Tag
      className={cn(
        "rounded-[24px] border border-border/60 bg-card shadow-soft",
        padded && "p-4",
        className,
      )}
      {...props}
      {...buttonProps}
    >
      {children}
    </Tag>
  );
}

/**
 * Заголовок секции внутри/над Bento-блоком.
 */
export function BentoHeader({
  title,
  icon,
  action,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}
