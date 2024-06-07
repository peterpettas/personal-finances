import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const pageAfter = searchParams.get('pageAfter');
  const pageBefore = searchParams.get('pageBefore');

  const accountCondition = accountId !== '' ? `accounts/${accountId}/transactions` : 'transactions';
  
  let url = `${accountCondition}?page[size]=100&filter[since]=${start}&filter[until]=${end}`;

  try {

    if (pageAfter) {
      url += `&page[after]=${pageAfter}`;
    }
    if (pageBefore) {
      url += `&page[before]=${pageBefore}`;
    }
	  const data = await fetchUpApi(url);
    const transactions = data.data;

    // Filter out unwanted transactions
    const filteredTransactions = transactions.filter(
      (transaction) =>
        transaction.attributes.description !== 'Round Up' &&
        !transaction.attributes.description.startsWith('Quick save transfer') &&
		!transaction.attributes.description.startsWith('Transfer')
    );

    return NextResponse.json({ 
      transactions: filteredTransactions,
      links: data.links
    });
  } catch (error) {
    return NextResponse.json(
      // debug
      { error: error.message },
      // { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
