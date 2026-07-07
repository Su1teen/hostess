import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

/**
 * Типы доступных тем — соответствуют ключам категорий.
 * "default" — базовая минималистичная тема.
 */
export type ThemeName = "default" | "food" | "medicine" | "auto" | "beauty" | "concerts";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "default",
  setTheme: () => {},
});

/**
 * Маппинг ключей категорий в имена тем.
 * Позволяет преобразовать произвольный string из data в валидный ThemeName.
 */
export function categoryToTheme(category: string): ThemeName {
  const map: Record<string, ThemeName> = {
    food: "food",
    medicine: "medicine",
    auto: "auto",
    beauty: "beauty",
    concerts: "concerts",
  };
  return map[category] ?? "default";
}

/**
 * ThemeProvider — управляет текущей цветовой темой приложения.
 * Устанавливает data-theme атрибут на контейнер для CSS-переменных.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>("default");

  // Устанавливаем data-theme на <html> для глобальных CSS-переменных.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook для получения и изменения текущей темы.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
