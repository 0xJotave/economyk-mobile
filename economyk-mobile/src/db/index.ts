import { drizzle } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";
import * as schema from "./schema";

const expoDb = SQLite.openDatabaseSync("economyk2.db");

expoDb.execSync(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL,
    month TEXT NOT NULL,
    is_fixed INTEGER NOT NULL,
    is_confirmed INTEGER NOT NULL,
    installment_number INTEGER,
    total_installments INTEGER,
    installment_group_id INTEGER,
    fixed_group_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS categories (
    name TEXT PRIMARY KEY NOT NULL
  );

  CREATE TABLE IF NOT EXISTS fixed_group_closures (
    fixed_group_id INTEGER PRIMARY KEY NOT NULL,
    from_month TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS financial_reports (
    month TEXT PRIMARY KEY NOT NULL,
    report TEXT NOT NULL,
    generated_at INTEGER NOT NULL
  );

  INSERT OR IGNORE INTO categories (name) VALUES
    ('Contas'),
    ('Alimentação'),
    ('Auto Cuidado'),
    ('Trabalho'),
    ('Investimentos');
`);

// Migrações de versões anteriores.
const migrations = [
  "ALTER TABLE transactions ADD COLUMN installment_number INTEGER;",
  "ALTER TABLE transactions ADD COLUMN installment_group_id INTEGER;",
  "ALTER TABLE transactions ADD COLUMN total_installments INTEGER;",
  "ALTER TABLE transactions ADD COLUMN fixed_group_id INTEGER;",
];

for (const migration of migrations) {
  try {
    expoDb.execSync(migration);
  } catch {
    // A coluna já existe.
  }
}

// Migração das antigas recorrências fixas.
expoDb.execSync(`
  UPDATE transactions
  SET fixed_group_id = (
    SELECT MIN(t2.id)
    FROM transactions t2
    WHERE t2.name = transactions.name
      AND t2.is_fixed = 1
  )
  WHERE is_fixed = 1
    AND fixed_group_id IS NULL;
`);

export const db = drizzle(expoDb, { schema });
