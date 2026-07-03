import type { Dish, Restaurant } from "@/data/hostess";

export type Screen = "map" | "catalog" | "ai" | "calendar" | "profile";

export type PreorderItem = { dish: Dish; qty: number };

export type BookingPayload = {
  restaurant: Restaurant;
  table: number | null;
  day: string;
  time: string;
  guests: number;
  preorder: PreorderItem[];
};
