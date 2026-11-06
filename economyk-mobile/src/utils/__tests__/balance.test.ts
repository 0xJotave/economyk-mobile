import balance from "../balance";
import { transaction as t } from "@/test-support/transactions";

test("camada de compatibilidade retorna os campos públicos e valores esperados", () => {
  expect(balance([
    t({ type: "income", price: 500 }),
    t({ id: 2, month: "2026-01", type: "income", price: 1000 }),
    t({ id: 3, month: "2026-01", price: 200, isConfirmed: false }),
    t({ id: 4, month: "2026-01", type: "saving", price: 300 }),
  ], "2026-01")).toEqual({
    remainingAmount: 500, monthlyResult: 800, previousCarryover: 500,
    totalAvailable: 1300, unconfirmedCount: 1,
    unconfirmedItems: [{ id: 3, name: "Compra", price: 200 }],
  });
});

test("saldo vazio mantém contrato de compatibilidade", () => {
  expect(balance([], "2026-01")).toEqual({
    remainingAmount: 0, monthlyResult: 0, previousCarryover: 0,
    totalAvailable: 0, unconfirmedCount: 0, unconfirmedItems: [],
  });
});
