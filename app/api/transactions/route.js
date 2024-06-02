import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  
  try {
    const data = await fetchUpApi(
      `accounts/0c91829f-5552-4e9e-beaf-7550382f566b/transactions?page[size]=50&filter[since]=${start}&filter[until]=${end}`
    );
    const transactions = data.data;

    // Filter out unwanted transactions
    const filteredTransactions = transactions.filter(
      (transaction) =>
        transaction.attributes.description !== 'Round Up' &&
        !transaction.attributes.description.startsWith('Quick save transfer') &&
		!transaction.attributes.description.startsWith('Transfer')
    );

    return NextResponse.json({ transactions: filteredTransactions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
