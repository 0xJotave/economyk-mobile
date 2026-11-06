import { createInstallments, updateInstallments, deleteInstallments } from "../installment-service";
import { transaction as t } from "@/test-support/transactions";
import { store } from "@/test-support/transaction-store";
import { calculateFinancialSummary as summary } from "@/utils/financial-summary";

jest.mock("@/db", () => ({ db: jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").store.db }));
jest.mock("@/db/schema", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").schema);
jest.mock("drizzle-orm", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").operators);


beforeEach(() => {
  store.seed();
  jest.spyOn(Date, "now").mockReturnValue(1000);
});

test("cria dez parcelas com numeração, grupo e meses corretos na virada do ano", () => {
  const result = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  expect(result.map(item => item.month)).toEqual([
    "2025-11", "2025-12", "2026-01", "2026-02", "2026-03",
    "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
  ]);
  expect(result.map(item => item.installmentNumber)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(result.every(item => item.totalInstallments === 10 && item.installmentGroupId === 1000 && item.fixedGroupId === undefined)).toBe(true);
  expect(store.transactions()).toEqual(result);
  expect(summary(result, "2026-08").expenses).toBe(100);
  expect(summary(result, "2026-09").expenses).toBe(0);
});

test("exclui da 3/10 em diante preservando anteriores e outros grupos", () => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  const unrelated = t({ id: 50, installmentGroupId: 50, month: "2026-03", price: 75 });
  store.seed([...installments, unrelated]);
  expect(summary(store.transactions(), "2026-03").expenses).toBe(175);
  deleteInstallments(installments[2]);
  expect(store.transactions()).toEqual([...installments.slice(0, 2), unrelated]);
  expect(summary(store.transactions(), "2026-01").expenses).toBe(0);
  expect(summary(store.transactions(), "2026-03").expenses).toBe(75);
});

test("edita valor e total desde a 3ª parcela sem reescrever o histórico", () => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  const changed = updateInstallments(t({ totalInstallments: 5, price: 250 }), installments[2]);
  expect(changed.map(item => [item.month, item.installmentNumber])).toEqual([
    ["2026-01", 3], ["2026-02", 4], ["2026-03", 5],
  ]);
  expect(store.transactions()).toEqual([...installments.slice(0, 2), ...changed]);
  expect(summary(store.transactions(), "2026-03").remainingAmount).toBe(-250);
  expect(summary(store.transactions(), "2026-04").expenses).toBe(0);
});

test.each([undefined, 1])("converte parcelada em comum e limpa todos os metadados (total %s)", total => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  const changed = updateInstallments({ ...installments[2], totalInstallments: total, isFixed: false }, installments[2]);
  expect(changed).toHaveLength(1);
  expect(changed[0]).toMatchObject({ installmentNumber: undefined, totalInstallments: undefined, installmentGroupId: undefined, fixedGroupId: undefined });
  expect(store.transactions()).toEqual([...installments.slice(0, 2), ...changed]);
});

test("conversão de parcela para fixa recebe um grupo de recorrência", () => {
  const installments = createInstallments(t({ totalInstallments: 4 }), "2025-11");
  const [changed] = updateInstallments({ ...installments[2], totalInstallments: 1, isFixed: true }, installments[2]);
  expect(changed).toMatchObject({ isFixed: true, fixedGroupId: installments[2].id, installmentGroupId: undefined });
});

test("rejeita total menor que a parcela atual sem alterar persistência", () => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  expect(() => updateInstallments(t({ totalInstallments: 2 }), installments[2])).toThrow("O total de parcelas deve ser pelo menos 3.");
  expect(store.transactions()).toEqual(installments);
});
