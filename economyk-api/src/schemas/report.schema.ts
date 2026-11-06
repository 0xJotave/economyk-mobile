import { z } from "zod";

export const reportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),

  totalIncome: z.number().int().nonnegative(),
  totalExpenses: z.number().int().nonnegative(),
  totalSavings: z.number().int().nonnegative(),
  previousCarryover: z.number().int().nonnegative().optional(),

  expensesByCategory: z.array(
    z.object({
      category: z.string().min(1).max(50),
      amount: z.number().int().nonnegative(),
    }),
  ),
});

export type ReportInput = z.infer<typeof reportSchema>;
