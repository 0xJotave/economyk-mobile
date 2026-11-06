import type { Transaction } from "@/types/transaction";

export function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1, name: "Compra", category: "Outros", type: "expense",
    price: 100, month: "2025-12", isFixed: false, isConfirmed: true,
    ...overrides,
  };
}
