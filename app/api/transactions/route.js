import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';

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

    const data = await fetchUpApi(url);
    let transactions = data.data;

    // Filter out unwanted transactions
    const filteredTransactions = transactions.filter(
      (transaction) =>
        transaction.attributes.description !== 'Round Up' &&
        !transaction.attributes.description.startsWith('Quick save transfer') &&
        !transaction.attributes.description.startsWith('Transfer')
    );

    // If categoryId is provided, filter transactions by category
    if (categoryId) {
      const categoryFilteredTransactions = filteredTransactions.filter(transaction => {
        if (transaction.relationships?.category?.data?.id === categoryId) {
          return true;
        }
        // Sometimes the category is in the attributes instead of relationships
        if (transaction.attributes?.category?.id === categoryId) {
          return true;
        }
        return false;
      });
      
      return NextResponse.json({ 
        transactions: categoryFilteredTransactions,
        links: data.links
      });
    }

    return NextResponse.json({ 
      transactions: filteredTransactions,
      links: data.links
    });
  } catch (error) {
    return NextResponse.json(
      // debug
      { error: error.message },
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
