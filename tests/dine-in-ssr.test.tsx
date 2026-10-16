import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { DiningPage } from "../src/components/hostess/DiningPage";
import { DiningReceipt, DiningAccount } from "../src/components/hostess/DiningAccount";
describe("QR SSR and receipts", () => {
  test("all 17 direct routes render without browser globals or seeded loyalty", () => {
    for (let n=1;n<=17;n++) {
      const html=renderToString(<DiningPage venue="xoxo" table={String(n).padStart(2,"0")} token={"a".repeat(43)} />);
      expect(html).toContain("Проверяем QR стола");
      expect(html).not.toContain("17480");
      expect(html).not.toContain("demo-");
    }
  });
  test("account does not serve a fake guest during SSR", () => {
    expect(renderToString(<DiningAccount />)).toContain("Загружаем кабинет");
  });
  test("receipt presents server totals and expiry without claiming bank confirmation", () => {
    const html=renderToString(<DiningReceipt order={{
      id:"order-1",orderNumber:"123",venueCode:"xoxo",tableCode:"03",createdAt:"2026-10-16T12:00:00Z",
      status:"new",paymentStatus:"assumed_paid",
      lines:[{productId:"p1",productName:"Напиток",quantity:3,unitPrice:1590,total:4770}],
      subtotal:4770,discount:1000,payable:3770,cashback:113,cashbackExpiresAt:"2026-10-30T12:00:00Z"
    }} />);
    expect(html).toContain("К оплате официанту");
    expect(html).toContain("Банковское подтверждение в Hostess не поступает");
    expect(html).toContain("113");expect(html).toContain("1000");
    expect(html).not.toContain("Оплата подтверждена");
  });
});
