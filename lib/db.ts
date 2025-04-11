import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, serial, varchar, doublePrecision, date } from 'drizzle-orm/pg-core';
import { eq, ilike } from 'drizzle-orm';

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

export type SelectBill = typeof bills.$inferSelect;

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
