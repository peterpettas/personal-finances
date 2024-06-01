import { fetchUpApi } from '../../lib/api';
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

const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const endDate = new Date();

const formattedStartDate = startDate.toISOString();
const formattedEndDate = endDate.toISOString();

const TransactionsPage = async () => {
  const data = await fetchUpApi(
    `transactions?page[size]=50&filter[since]=${formattedStartDate}&filter[until]=${formattedEndDate}`
  );
  const transactions: TransactionType[] = data.data;

  const filteredTransactions = transactions.filter(transaction =>
    transaction.attributes.description !== 'Round Up' &&
    !transaction.attributes.description.startsWith('Quick save transfer')
  )

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Recent Transactions</h1>
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
            {filteredTransactions.map((transaction) => (
              <Transaction
                key={transaction.id}
                id={transaction.id}
                description={transaction.attributes.description}
                message={transaction.attributes.message}
                amount={transaction.attributes.amount.value}
                category={transaction.relationships.category?.data?.id ?? null}
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
    </div>
  );
};

export default TransactionsPage;
