import { saveTransaction, removeTransaction } from "../transaction-management-service";
import { applyFixedTransactions } from "../fixed-transaction-service";
import { createInstallments } from "../installment-service";
import { transaction as t } from "@/test-support/transactions";
import { store } from "@/test-support/transaction-store";
import { calculateFinancialSummary as summary } from "@/utils/financial-summary";

jest.mock("@/db", () => ({ db: jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").store.db }));
jest.mock("@/db/schema", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").schema);
jest.mock("drizzle-orm", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").operators);


beforeEach(() => {
  store.seed();
  jest.spyOn(Date, "now").mockReturnValue(10000);
  jest.spyOn(Math, "random").mockReturnValue(0.5);
});

test.each([false, true])("converte fixa em %s (false: comum; true: parcelada), fecha grupo e preserva passado", async installment => {
  const past = t({ id: 10, isFixed: true, fixedGroupId: 10, month: "2025-11" });
  const current = { ...past, id: 11, month: "2025-12" };
  const future = { ...past, id: 12, month: "2026-01" };
  store.seed([past, current, future]);
  const result = await saveTransaction({ ...current, isFixed: false, totalInstallments: installment ? 3 : undefined }, current, current.month, []);
  expect(result).toEqual(store.transactions());
  expect(result[0]).toEqual(past);
  expect(result.slice(1)).toHaveLength(installment ? 3 : 1);
  expect(result.slice(1).every(item => !item.isFixed && item.fixedGroupId === undefined)).toBe(true);
  expect(store.closures()).toEqual([{ fixedGroupId: 10, fromMonth: "2025-12" }]);
  expect(applyFixedTransactions([], "2026-04")).toEqual([]);
  expect(summary(result, "2026-01").expenses).toBe(installment ? 100 : 0);
});

test("exclusão desde 3/10 atualiza retorno, persistência e saldo futuro", async () => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  const unrelated = t({ id: 99, month: "2026-02", price: 25 });
  store.seed([...installments, unrelated]);
  const result = await removeTransaction(installments[2], []);
  expect(result).toEqual([...installments.slice(0, 2), unrelated]);
  expect(result).toEqual(store.transactions());
  expect(summary(result, "2026-02").remainingAmount).toBe(-25);
});

test("edição parcelada em comum limpa metadados e não mantém parcelas futuras", async () => {
  const installments = createInstallments(t({ totalInstallments: 10 }), "2025-11");
  const result = await saveTransaction({ ...installments[2], totalInstallments: undefined, price: 75 }, installments[2], "2026-01", []);
  expect(result).toEqual(store.transactions());
  expect(result).toHaveLength(3);
  expect(result[2]).toMatchObject({ price: 75, installmentNumber: undefined, totalInstallments: undefined, installmentGroupId: undefined });
  expect(summary(result, "2026-02").expenses).toBe(0);
});

test("criação de fixa projeta mês seguinte uma única vez", async () => {
  const result = await saveTransaction(t({ isFixed: true }), null, "2025-12", []);
  expect(result.map(item => item.month)).toEqual(["2025-12", "2026-01"]);
  expect(result).toEqual(store.transactions());
  expect(applyFixedTransactions([], "2026-01")).toEqual([]);
});

test("remoção de fixa mantém mês anterior e impede projeção futura", async () => {
  const past = t({ id: 10, isFixed: true, fixedGroupId: 10, month: "2025-11" });
  const current = { ...past, id: 11, month: "2025-12" };
  store.seed([past, current, { ...current, id: 12, month: "2026-01" }]);
  expect(await removeTransaction(current, [])).toEqual([past]);
  expect(applyFixedTransactions([], "2026-01")).toEqual([]);
});

test("edição retroativa de receita comum reflete no carryover do mês seguinte", async () => {
  const income = t({ type: "income", price: 1000 });
  store.seed([income]);
  const result = await saveTransaction({ ...income, price: 250 }, income, income.month, []);
  expect(result).toEqual(store.transactions());
  expect(summary(result, "2026-01").previousCarryover).toBe(250);
});


test("criação comum e criação parcelada usam os dados persistidos", async () => {
  const common = await saveTransaction(t(), null, "2025-11", []);
  expect(common).toHaveLength(1);
  expect(common[0]).toMatchObject({ month: "2025-11", fixedGroupId: undefined });
  jest.spyOn(Date, "now").mockReturnValue(20000);
  const result = await saveTransaction(t({ totalInstallments: 2 }), null, "2025-12", []);
  expect(result).toHaveLength(3);
  expect(result).toEqual(store.transactions());
  expect(result.slice(1).map(item => item.month)).toEqual(["2025-12", "2026-01"]);
});

test("conversão de comum em parcelada substitui somente o item editado", async () => {
  const common = t({ id: 1 });
  const other = t({ id: 2, price: 50 });
  store.seed([common, other]);
  const result = await saveTransaction({ ...common, totalInstallments: 2 }, common, common.month, []);
  expect(result[0]).toEqual(other);
  expect(result.slice(1).map(item => item.installmentNumber)).toEqual([1, 2]);
  expect(result).toEqual(store.transactions());
});

test("conversão de parcelada em fixa limpa parcelas e propaga mês seguinte", async () => {
  const installments = createInstallments(t({ totalInstallments: 4 }), "2025-11");
  const result = await saveTransaction({ ...installments[2], isFixed: true, totalInstallments: undefined }, installments[2], "2026-01", []);
  expect(result).toEqual(store.transactions());
  expect(result.slice(0, 2)).toEqual(installments.slice(0, 2));
  expect(result.slice(2).map(item => item.month)).toEqual(["2026-01", "2026-02"]);
  expect(result.slice(2).every(item => item.isFixed && item.installmentGroupId === undefined && item.fixedGroupId === installments[2].id)).toBe(true);
});

test("edição de fixa preserva passado e substitui projeção futura", async () => {
  const past = t({ id: 10, isFixed: true, fixedGroupId: 10, month: "2025-11" });
  const current = { ...past, id: 11, month: "2025-12" };
  store.seed([past, current, { ...current, id: 12, month: "2026-01" }]);
  const result = await saveTransaction({ ...current, price: 250 }, current, current.month, []);
  expect(result).toEqual(store.transactions());
  expect(result[0]).toEqual(past);
  expect(result.slice(1).map(item => [item.month, item.price])).toEqual([["2025-12", 250], ["2026-01", 250]]);
});

test("exclusão comum preserva demais itens e edição comum preserva não editados", async () => {
  const first = t({ id: 1 });
  const second = t({ id: 2, price: 50 });
  store.seed([first, second]);
  const edited = await saveTransaction({ ...first, price: 75 }, first, first.month, []);
  expect(edited).toEqual([{ ...first, price: 75 }, second]);
  expect(await removeTransaction(edited[0], [])).toEqual([second]);
  expect(store.transactions()).toEqual([second]);
});
