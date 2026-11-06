import { applyFixedTransactions, updateFixedTransaction, deleteFixedTransaction } from "../fixed-transaction-service";
import { transaction as t } from "@/test-support/transactions";
import { store } from "@/test-support/transaction-store";

jest.mock("@/db", () => ({ db: jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").store.db }));
jest.mock("@/db/schema", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").schema);
jest.mock("drizzle-orm", () => jest.requireActual<typeof import("@/test-support/transaction-store")>("@/test-support/transaction-store").operators);


beforeEach(() => {
  store.seed();
  jest.spyOn(Date, "now").mockReturnValue(10000);
  jest.spyOn(Math, "random").mockReturnValue(0.5);
});

const fixed = (month: string, id = 10) => t({ id, month, isFixed: true, fixedGroupId: 10 });

test("recupera ocorrência persistida mais recente, mesmo com lista recebida desatualizada", () => {
  store.seed([fixed("2025-09"), { ...fixed("2025-12", 11), price: 250 }]);
  const result = applyFixedTransactions([], "2026-04");
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ price: 250, month: "2026-04", fixedGroupId: 10, isConfirmed: false });
  expect(applyFixedTransactions([], "2026-04")).toEqual([]);
  expect(store.transactions()).toHaveLength(3);
});

test("cancelamento desde X remove X e futuros sem ressuscitar grupo ao saltar meses", () => {
  const historical = fixed("2025-11");
  const current = fixed("2025-12", 11);
  const other = t({ id: 30, fixedGroupId: 30, isFixed: true, month: "2026-01" });
  store.seed([historical, current, fixed("2026-01", 12), other]);
  deleteFixedTransaction(current);
  expect(store.transactions()).toEqual([historical, other]);
  expect(store.closures()).toEqual([{ fixedGroupId: 10, fromMonth: "2025-12" }]);
  expect(applyFixedTransactions([], "2026-04").map(item => item.fixedGroupId)).toEqual([30]);
});

test("conversão em comum fecha grupo e preserva passado", () => {
  const current = fixed("2025-12", 11);
  store.seed([fixed("2025-11"), current, fixed("2026-01", 12)]);
  const changed = updateFixedTransaction({ ...current, isFixed: false }, current);
  expect(changed.fixedGroupId).toBeUndefined();
  expect(store.transactions()).toEqual([fixed("2025-11"), changed]);
  expect(applyFixedTransactions([], "2026-01")).toEqual([]);
});

test("alteração mantendo fixa reabre grupo e usa novo valor nas projeções", () => {
  const current = fixed("2025-12", 11);
  store.seed([fixed("2025-11"), current], [{ fixedGroupId: 10, fromMonth: "2025-12" }]);
  updateFixedTransaction({ ...current, price: 350 }, current);
  expect(store.closures()).toEqual([]);
  expect(applyFixedTransactions([], "2026-03")[0].price).toBe(350);
  expect(store.transactions()[0]).toEqual(fixed("2025-11"));
});

test("fixa legada sem grupo usa ID como grupo ao encerrar", () => {
  const legacy = t({ id: 77, isFixed: true });
  store.seed([legacy]);
  deleteFixedTransaction(legacy);
  expect(store.transactions()).toEqual([]);
  expect(store.closures()).toEqual([{ fixedGroupId: 77, fromMonth: "2025-12" }]);
});
