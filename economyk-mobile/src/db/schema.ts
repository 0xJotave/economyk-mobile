import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(),
  price: integer("price").notNull(),
  month: text("month").notNull(),
  isFixed: integer("is_fixed", { mode: "boolean" }).notNull(),
  isConfirmed: integer("is_confirmed", { mode: "boolean" }).notNull(),

  installmentNumber: integer("installment_number"),
  totalInstallments: integer("total_installments"),
  installmentGroupId: integer("installment_group_id"),

  fixedGroupId: integer("fixed_group_id"),
});

export const categories = sqliteTable("categories", {
  name: text("name").primaryKey(),
});

// Registra a partir de qual mês uma recorrência foi encerrada.
export const fixedGroupClosures = sqliteTable("fixed_group_closures", {
  fixedGroupId: integer("fixed_group_id").primaryKey(),
  fromMonth: text("from_month").notNull(),
});

// Armazena o relatório de IA de cada mês.
export const financialReports = sqliteTable("financial_reports", {
  month: text("month").primaryKey(),
  report: text("report").notNull(),
  generatedAt: integer("generated_at").notNull(),
});
