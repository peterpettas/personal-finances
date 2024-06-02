"use client";

import Transaction from '../../components/Transaction';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';

type TransactionType = {
  id: string;
  attributes: {
    description: string;
    message: string;
    amount: {
      value: string;
    };
    createdAt: string;
  };
  relationships: {
    category: {
      data: {
        id: string;
      }
      links: {
        self: string;
      } | null;
    } | null;
  };
};


const getStartAndEndOfMonth = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const TransactionsPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async (month: Date) => {
    setLoading(true);
    const { start, end } = getStartAndEndOfMonth(month);
    const response = await fetch(`/api/transactions?start=${start}&end=${end}`);
    if (!response.ok) {
      console.error('Failed to fetch transactions');
      setLoading(false);
      return;
    }
    const data = await response.json();
    setTransactions(data.transactions);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions(selectedMonth);
  }, [selectedMonth]);

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)));
  }

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg bg-gray-100 text-gray-600"
        >
          Previous Month
        </button>
        <h2 className="text-lg font-semibold">
          {selectedMonth.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric'
          })}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg bg-gray-100 text-gray-600"
        >
          Next Month
        </button>
      </div>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="border shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <Transaction
                  key={transaction.id}
                  id={transaction.id}
                  description={transaction.attributes.description}
                  message={transaction.attributes.message}
                  amount={transaction.attributes.amount.value}
                  category={
                    transaction.relationships.category?.data?.id ?? null
                  }
                  date={transaction.attributes.createdAt}
                />
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Something</TableCell>
                <TableCell className="text-right">$0</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
