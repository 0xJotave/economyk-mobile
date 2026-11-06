import { calculateFixedTransactions as project } from "../fixed";
import { transaction as t } from "@/test-support/transactions";

afterEach(() => jest.restoreAllMocks());

test("salto de meses recupera a ocorrência mais recente por grupo sem depender da ordem", () => {
  jest.spyOn(Date, "now").mockReturnValue(1000);
  jest.spyOn(Math, "random").mockReturnValueOnce(0.5).mockReturnValueOnce(0.6);
  const recent = t({ id: 2, isFixed: true, fixedGroupId: 10, price: 250 });
  const items = [recent, t({ isFixed: true, fixedGroupId: 10, month: "2025-08" }),
    t({ id: 3, isFixed: true, fixedGroupId: 20, month: "2025-06" }),
    t({ id: 4, isFixed: true, fixedGroupId: 30, month: "2026-06" })];
  const snapshot = items.map(item => ({ ...item }));
  expect(project(items, "2026-04")).toEqual([
    { ...recent, id: 51000, month: "2026-04", isConfirmed: false },
    { ...items[2], id: 61000, month: "2026-04", isConfirmed: false },
  ]);
  expect(items).toEqual(snapshot);
});

test("grupo já presente no mês não duplica, mesmo se ocorrência atual não for fixa", () => {
  const items = [t({ isFixed: true, fixedGroupId: 10 }),
    t({ id: 2, month: "2026-01", fixedGroupId: 10 })];
  expect(project(items, "2026-01")).toEqual([]);
});

test.each([['2025-12', 1], ['2026-01', 0], ['2026-02', 0]] as const)(
  "encerramento desde janeiro: projeção em %s tem %s ocorrências",
  (month, count) => {
    expect(project([t({ isFixed: true, fixedGroupId: 10, month: "2025-11" })], month,
      [{ fixedGroupId: 10, fromMonth: "2026-01" }])).toHaveLength(count);
  },
);

test("encerramento de um grupo preserva os demais", () => {
  expect(project([t({ isFixed: true, fixedGroupId: 10 }),
    t({ id: 2, isFixed: true, fixedGroupId: 20 })], "2026-01",
  [{ fixedGroupId: 10, fromMonth: "2025-12" }]).map(item => item.fixedGroupId)).toEqual([20]);
});

test("ignora comuns, parceladas sem recorrência e fixas sem grupo", () => {
  expect(project([t(), t({ id: 2, isFixed: true }),
    t({ id: 3, installmentGroupId: 30, installmentNumber: 1, totalInstallments: 10 })], "2026-01")).toEqual([]);
  expect(project([], "2026-01")).toEqual([]);
});
