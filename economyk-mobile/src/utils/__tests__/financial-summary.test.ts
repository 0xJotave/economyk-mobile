import { calculateFinancialSummary as summary } from "../financial-summary";
import { transaction as t } from "@/test-support/transactions";

describe("resumo financeiro", () => {
  test("mês totalmente vazio", () => {
    expect(summary([], "2026-01")).toEqual({
      monthTransactions: [], income: 0, expenses: 0, savings: 0,
      remainingAmount: 0, monthlyResult: 0, previousCarryover: 0,
      totalAvailable: 0, unconfirmedCount: 0, unconfirmedItems: [],
    });
  });

  test.each([[1000, 400, 600], [400, 400, 0], [200, 400, 0]])(
    "receita anterior %s, despesa %s: sobra %s",
    (income, expense, expected) => {
      const result = summary([
        t({ type: "income", price: income }), t({ id: 2, price: expense }),
        t({ id: 3, month: "2026-01", type: "income", price: 200 }),
      ], "2026-01");
      expect(result.previousCarryover).toBe(expected);
      expect(result.totalAvailable).toBe(200 + expected);
    },
  );

  test("Caixinha abate a sobra livre de M-1", () => {
    expect(summary([
      t({ type: "income", price: 1000 }), t({ id: 2, price: 300 }),
      t({ id: 3, type: "saving", price: 250 }),
    ], "2026-01").previousCarryover).toBe(450);
  });

  test("Caixinha maior que a sobra anterior impede propagação", () => {
    expect(summary([
      t({ type: "income", price: 100 }),
      t({ id: 2, type: "saving", price: 150 }),
    ], "2026-01").previousCarryover).toBe(0);
  });

  test("soma de vários centavos mantém resultado dentro da precisão de duas casas", () => {
    const items = Array.from({ length: 100 }, (_, index) => t({
      id: index, type: "income", price: 0.01,
    }));
    expect(summary(items, "2025-12").income).toBeCloseTo(1, 10);
    expect(summary(items, "2026-01").previousCarryover).toBeCloseTo(1, 10);
  });

  test("edição retroativa recalcula M sem cache", () => {
    const items = [t({ type: "income", price: 1000 }), t({ id: 2, price: 200 })];
    expect(summary(items, "2026-01").previousCarryover).toBe(800);
    const edited = items.map(item => item.id === 2 ? { ...item, price: 900 } : item);
    expect(summary(edited, "2026-01").previousCarryover).toBe(100);
    expect(items[1].price).toBe(200);
  });

  test("regra atual: cadeia Nov → Dez → Jan considera somente o resultado próprio de M-1", () => {
    const items = [
      t({ month: "2025-11", type: "income", price: 1000 }),
      t({ id: 2, price: 300 }), t({ id: 3, month: "2026-01", price: 200 }),
    ];
    expect(summary(items, "2025-12")).toMatchObject({ previousCarryover: 1000, totalAvailable: 700 });
    expect(summary(items, "2026-01")).toMatchObject({ previousCarryover: 0, totalAvailable: -200 });
  });

  test.todo("Decisão de negócio: consumo acumulado Nov → Dez → Jan daria 700 e 500; a regra atual não acumula");

  test("separa receita, despesa, Caixinha e pendências apenas do mês consultado", () => {
    const items = [
      t({ type: "income", price: 1000 }),
      t({ id: 2, price: 200, isConfirmed: false }),
      t({ id: 3, type: "saving", price: 300, isConfirmed: false }),
      t({ id: 4, month: "2026-02", price: 999, isConfirmed: false }),
    ];
    expect(summary(items, "2025-12")).toEqual({
      monthTransactions: items.slice(0, 3), income: 1000, expenses: 200, savings: 300,
      remainingAmount: 500, monthlyResult: 800, previousCarryover: 0, totalAvailable: 800,
      unconfirmedCount: 2, unconfirmedItems: [
        { id: 2, name: "Compra", price: 200 }, { id: 3, name: "Compra", price: 300 },
      ],
    });
  });

  test("meses distantes e futuros não alimentam a sobra", () => {
    expect(summary([
      t({ month: "2025-10", type: "income", price: 1000 }),
      t({ month: "2026-02", type: "income", price: 1000 }),
    ], "2026-01").totalAvailable).toBe(0);
  });

  test("mês vazio pode receber sobra do mês anterior", () => {
    expect(summary([t({ type: "income", price: 70 })], "2026-01"))
      .toMatchObject({ income: 0, remainingAmount: 0, previousCarryover: 70, totalAvailable: 70 });
  });

  test("centavos e floats mantêm precisão monetária de duas casas", () => {
    const result = summary([
      t({ type: "income", price: 0.1 }), t({ id: 2, type: "income", price: 0.2 }),
      t({ id: 3, price: 0.3 }),
      t({ id: 4, month: "2026-01", type: "income", price: 10.15 }),
      t({ id: 5, month: "2026-01", price: 0.1 }),
      t({ id: 6, month: "2026-01", type: "saving", price: 0.2 }),
    ], "2026-01");
    expect(result.previousCarryover).toBeCloseTo(0, 10);
    expect(result.remainingAmount).toBeCloseTo(9.85, 10);
    expect(result.monthlyResult).toBeCloseTo(10.05, 10);
    expect(result.totalAvailable).toBeCloseTo(10.05, 10);
  });
});
