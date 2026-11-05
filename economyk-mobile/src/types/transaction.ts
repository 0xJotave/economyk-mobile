export type TransactionType = "expense" | "income" | "saving";

export type NewTransaction = Omit<Transaction, "id" | "month">;

export interface Transaction {
  id: number;
  name: string;
  category: string;
  type: TransactionType;
  price: number;
  month: string;
  isFixed: boolean;
  isConfirmed: boolean;

  // Parcelamentos
  installmentNumber?: number;
  totalInstallments?: number;
  installmentGroupId?: number;

  // Recorrências fixas
  fixedGroupId?: number;
}
