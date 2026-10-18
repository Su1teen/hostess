import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { menuSchema } from "../src/lib/dine-in-api";
import { productImage, productFallbackImage, safeImageSource } from "../src/lib/product-images";

describe("XOXO menu photography", () => {
  test("QR dining accepts same-origin menu photographs", () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: "ok",
      currentRound: null,
      products: [
        {
          id: "1",
          name: "Absolut",
          price: 1000,
          isAvailable: true,
          imageUrl: "/image/xoxo-exchange/absolut.jpeg",
        },
      ],
    };
    expect(menuSchema.safeParse(payload).success).toBe(true);
    expect(
      menuSchema.safeParse({
        ...payload,
        products: [{ ...payload.products[0], imageUrl: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
  });
  test("names and exchange slugs resolve to the supplied brand photos", () => {
    for (const name of [
      "Absolut",
      "Миллер",
      "Miller · 500 мл",
      "Bacardi Carta Blanca",
      "Bacardi Black",
      "Ballantine’s",
      "Beefeater",
      "Bud",
      "Chivas",
      "Corona Extra",
      "Немецкое · 3 л",
      "Hoegaarden",
      "Jägermeister",
      "Jameson",
      "Monkey Shoulder",
      "Nemiroff",
      "Oakheart",
      "Red Bull Vodka",
      "Tsingtao",
    ]) {
      const image = productImage(
        { name, category: "Крепкий алкоголь", imageUrl: "https://invalid.example/broken.jpg" },
        true,
      );
      expect(image.startsWith("/image/xoxo-exchange/")).toBe(true);
      expect(existsSync(`public${decodeURI(image)}`)).toBe(true);
    }
  });
  test("the light Bacardi bottle is never shown as Bacardi Black", () => {
    expect(
      productFallbackImage({ name: "Bacardi Black", category: "Крепкий алкоголь" }, true),
    ).toContain("amber-serving");
    expect(
      productFallbackImage({ name: "Хортица Айс", category: "Крепкий алкоголь" }, true),
    ).toContain("vodka-serving");
  });
  test("local images work and executable/protocol-relative URLs are rejected", () => {
    expect(safeImageSource("/image/photo.jpg")).toBe("/image/photo.jpg");
    for (const value of [
      "javascript:alert(1)",
      "//other.example/image.jpg",
      "data:image/svg+xml,x",
      "/\\other.example/x",
    ])
      expect(safeImageSource(value)).toBeUndefined();
    expect(productImage({ name: "Фирменный бургер", imageUrl: "/food/burger.jpg" }, false)).toBe(
      "/food/burger.jpg",
    );
  });
  test("non-alcoholic categories and wine keep appropriate imagery", () => {
    expect(productFallbackImage({ name: "Borjomi", category: "Вода" }, false)).not.toContain(
      "vodka",
    );
    expect(productFallbackImage({ name: "Красное", category: "Вино" }, false)).not.toContain(
      "bar-sharing",
    );
  });
});
