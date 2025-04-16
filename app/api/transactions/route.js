import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';
import { createTransaction, db, deleteTransaction } from '../../../lib/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { transactions } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  const categoryId = searchParams.get('categoryId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const pageAfter = searchParams.get('pageAfter');
  const pageBefore = searchParams.get('pageBefore');

  const urlConsructor = accountId ? `accounts/${accountId}/transactions` : 'transactions';
  const startAndEnd = start && end ? `&filter[since]=${encodeURIComponent(start)}&filter[until]=${encodeURIComponent(end)}` : '';
  
  let url = `${urlConsructor}?page[size]=100${startAndEnd}`;

  try {
    if (pageAfter) {
      url += `&page[after]=${encodeURIComponent(pageAfter)}`;
    }
    if (pageBefore) {
      url += `&page[before]=${encodeURIComponent(pageBefore)}`;
    }

    // Fetch bank API transactions
    const data = await fetchUpApi(url);
    let transactionsApi = data.data;
    // Filter out unwanted transactions
    const filteredTransactions = transactionsApi.filter(
      (transaction) =>
        transaction.attributes.description !== 'Round Up' &&
        !transaction.attributes.description.startsWith('Quick save transfer') &&
        !transaction.attributes.description.startsWith('Transfer')
    );

    // Fetch local DB transactions
    let dbWhere = [];
    if (accountId) dbWhere.push(eq(transactions.accountId, accountId));
    if (categoryId) dbWhere.push(eq(transactions.category, categoryId));
    if (start && end)
      dbWhere.push(
        and(
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end)
        )
      );
    let dbTransactions = await db
      .select()
      .from(transactions)
      .where(dbWhere.length ? and(...dbWhere) : undefined)
      .execute();

    // Map DB transactions to API-like format
    const mappedDbTransactions = dbTransactions.map((t) => ({
      id: `local-${t.id}`,
      attributes: {
        description: t.description,
        message: t.message,
        amount: { value: t.amount?.toString?.() ?? '0' },
        createdAt: t.createdAt
      },
      relationships: {
        category: { data: { id: t.category || 'Uncategorized' }, links: null }
      },
      source: 'local'
    }));

    // Merge and sort by date descending
    const allTransactions = [...mappedDbTransactions, ...filteredTransactions];
    allTransactions.sort(
      (a, b) =>
        new Date(b.attributes.createdAt).getTime() -
        new Date(a.attributes.createdAt).getTime()
    );

       // If categoryId is provided, filter transactions by category
    if (categoryId) {
      const categoryFilteredTransactions = allTransactions.filter(
        (transaction) => {
          if (transaction.relationships?.category?.data?.id === categoryId) {
            return true;
          }
          // Check if the transaction is a local transaction
          if (transaction.categoryId === categoryId) {
            return true;
          }
          // Sometimes the category is in the attributes instead of relationships
          if (transaction.attributes?.category?.id === categoryId) {
            return true;
          }
          return false;
        }
      );

      return NextResponse.json({
        transactions: categoryFilteredTransactions,
        links: data.links
      });
    }

    return NextResponse.json({
      transactions: allTransactions,
      links: data.links
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    // Expecting: { accountId, description, message, amount, createdAt, category }
    const { accountId, description, message, amount, createdAt, category } = body;
    if (!accountId || !description || !amount || !createdAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const transaction = await createTransaction({
      accountId,
      description,
      message: message || '',
      amount: parseFloat(amount),
      createdAt,
      category: category || '',
      // categoryId: categoryId || ''
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    // Only allow deleting local transactions (id format: local-123)
    if (!id.startsWith('local-')) {
      return NextResponse.json({ error: 'Cannot delete bank transactions' }, { status: 403 });
    }
    const localId = parseInt(id.replace('local-', ''), 10);
    await deleteTransaction(localId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
