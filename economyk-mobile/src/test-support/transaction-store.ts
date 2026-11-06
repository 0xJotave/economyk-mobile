import type { Transaction } from "@/types/transaction";

type Closure = { fixedGroupId: number; fromMonth: string };
type Row = Partial<Transaction> & Partial<Closure>;
type Predicate = (row: Row) => boolean;
type Table = { key: "transactions" | "closures" };

export const schema = {
  transactions: { key: "transactions", id: "id", month: "month", fixedGroupId: "fixedGroupId", installmentGroupId: "installmentGroupId" },
  fixedGroupClosures: { key: "closures", fixedGroupId: "fixedGroupId" },
};

// Substitui somente a persistência e os predicados SQL. As regras dos serviços são reais.
export const operators = {
  eq: (column: keyof Row, value: unknown): Predicate => row => row[column] === value,
  gte: (column: keyof Row, value: string): Predicate => row => {
    const actual = row[column];
    return typeof actual === "string" && actual >= value;
  },
  and: (...conditions: Predicate[]): Predicate => row => conditions.every(condition => condition(row)),
  or: (...conditions: Predicate[]): Predicate => row => conditions.some(condition => condition(row)),
};

let rows: Record<Table["key"], Row[]> = { transactions: [], closures: [] };

interface MemoryExecutor {
  select(): { from(table: Table): { all(): Row[] } };
  insert(table: Table): { values(values: Row | Row[]): { run(): void } };
  delete(table: Table): { where(condition: Predicate): { run(): void } };
  update(table: Table): { set(data: Row): { where(condition: Predicate): { run(): void } } };
  transaction<T>(callback: (executor: MemoryExecutor) => T): T;
}

interface MemoryStore {
  seed(transactions?: Transaction[], closures?: Closure[]): void;
  transactions(): Transaction[];
  closures(): Closure[];
  db: MemoryExecutor;
}

export const store: MemoryStore = {
  seed(transactions: Transaction[] = [], closures: Closure[] = []) {
    rows = { transactions: transactions.map(row => ({ ...row })), closures: closures.map(row => ({ ...row })) };
  },
  transactions(): Transaction[] { return rows.transactions.map(row => ({ ...row })) as Transaction[]; },
  closures(): Closure[] { return rows.closures.map(row => ({ ...row })) as Closure[]; },
  db: {
    select() {
      return { from: (table: Table) => ({ all: () => rows[table.key].map(row => ({ ...row })) }) };
    },
    insert(table: Table) {
      return { values: (values: Row | Row[]) => ({ run: () => {
        rows[table.key].push(...(Array.isArray(values) ? values : [values]).map(row => ({ ...row })));
      } }) };
    },
    delete(table: Table) {
      return { where: (condition: Predicate) => ({ run: () => {
        rows[table.key] = rows[table.key].filter(row => !condition(row));
      } }) };
    },
    update(table: Table) {
      return { set: (data: Row) => ({ where: (condition: Predicate) => ({ run: () => {
        rows[table.key] = rows[table.key].map(row => condition(row) ? { ...row, ...data } : row);
      } }) }) };
    },
    transaction<T>(callback: (executor: MemoryExecutor) => T): T {
      const snapshot = { transactions: rows.transactions.map(row => ({ ...row })), closures: rows.closures.map(row => ({ ...row })) };
      try { return callback(store.db); }
      catch (error) { rows = snapshot; throw error; }
    },
  },
};
