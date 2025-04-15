import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, varchar, doublePrecision, date, timestamp } from 'drizzle-orm/pg-core';
import { eq, ilike, and, gte, lte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const db = drizzle(
  neon(process.env.POSTGRES_URL!, {
    fetchOptions: {
      cache: 'no-store'
    }
  })
);

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }),
  username: varchar('username', { length: 50 }),
  email: varchar('email', { length: 50 })
});

const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  description: varchar('description', { length: 255 }),
  amount: doublePrecision('amount'),
  duedate: date('duedate'),
  paid: varchar('paid', { length: 50 }),
  payfromaccount: varchar('payfromaccount', { length: 50 }),
  categoryId: varchar('categoryId', { length: 50 }),
  subcategoryId: varchar('subcategoryId', { length: 50 }),
  notes: varchar('notes', { length: 255 }),
  createdat: date('createdat').defaultNow(),
  updatedat: date('updatedat').defaultNow()
});

const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 })
});

const subcategories = pgTable('subcategories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }),
  categoryid: varchar('categoryid', { length: 50 })
});

const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  categoryId: varchar('categoryId', { length: 50 }),
  amount: doublePrecision('amount'),
  month: varchar('month', { length: 50 }),
  createdat: varchar('createdat', { length: 50 }).default(sql`CURRENT_TIMESTAMP`),
  updatedat: varchar('updatedat', { length: 50 }).default(sql`CURRENT_TIMESTAMP`)
});

export type SelectBill = typeof bills.$inferSelect;
export type SelectBudget = typeof budgets.$inferSelect;

export async function getBills(): Promise<SelectBill[]> {
  return db.select().from(bills).execute();
}

export async function getBillById(id: number): Promise<SelectBill | null> {
  const bill = await db.select().from(bills).where(eq(bills.id, id)).execute();
  return bill[0] || null;
}

export async function createBill(bill: Omit<SelectBill, 'id'>): Promise<SelectBill> {
  const [createdBill] = await db.insert(bills).values(bill).returning().execute();
  return createdBill;
}

export async function updateBillById(id: number, bill: Partial<Omit<SelectBill, 'id'>>): Promise<SelectBill> {
  const [updatedBill] = await db.update(bills).set({ ...bill, updatedat: new Date().toISOString() }).where(eq(bills.id, id)).returning().execute();
  return updatedBill;
}

export async function deleteBillById(id: number) {
  await db.delete(bills).where(eq(bills.id, id)).execute();
}

export async function getBudgetForCategory(categoryId: string, month: Date): Promise<SelectBudget | null> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();
  
  const budget = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.categoryId, categoryId),
        gte(budgets.month, startOfMonth),
        lte(budgets.month, endOfMonth)
      )
    )
    .execute();
  
  return budget[0] || null;
}

export async function getBudgetsForMonth(month: Date): Promise<SelectBudget[]> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();
  
  return db
    .select()
    .from(budgets)
    .where(
      and(
        gte(budgets.month, startOfMonth),
        lte(budgets.month, endOfMonth)
      )
    )
    .execute();
}

export async function createOrUpdateBudget(
  categoryId: string,
  amount: number,
  month: Date
): Promise<SelectBudget> {
  const monthStr = month.toISOString().slice(0, 7); // Format as YYYY-MM
  
  // First try to update existing budget
  const updateResult = await db.execute<SelectBudget>(
    sql`
      UPDATE budgets 
      SET amount = ${amount},
          updatedat = CURRENT_TIMESTAMP
      WHERE "categoryId" = ${categoryId} 
      AND month = ${monthStr}
      RETURNING *;
    `
  );
  
  // If no rows were updated, insert new budget
  if (updateResult.rows.length === 0) {
    const insertResult = await db.execute<SelectBudget>(
      sql`
        INSERT INTO budgets ("categoryId", amount, month)
        VALUES (${categoryId}, ${amount}, ${monthStr})
        RETURNING *;
      `
    );
    return insertResult.rows[0];
  }
  
  return updateResult.rows[0];
}

export type SelectUser = typeof users.$inferSelect;

export async function getUsers(
  search: string,
  offset: number
): Promise<{
  users: SelectUser[];
  newOffset: number | null;
}> {
  // Always search the full table, not per page
  if (search) {
    return {
      users: await db
        .select()
        .from(users)
        .where(ilike(users.name, `%${search}%`))
        .limit(1000),
      newOffset: null
    };
  }

  if (offset === null) {
    return { users: [], newOffset: null };
  }

  const moreUsers = await db.select().from(users).limit(20).offset(offset);
  const newOffset = moreUsers.length >= 20 ? offset + 20 : null;
  return { users: moreUsers, newOffset };
}

export async function deleteUserById(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

export async function executeMigration() {
  await db.execute(sql`
    ALTER TABLE budgets ADD CONSTRAINT IF NOT EXISTS budgets_categoryid_month_key UNIQUE ("categoryId", month);
  `);
}
