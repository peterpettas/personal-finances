import React from 'react';
import {
  TableCell,
  TableRow
} from '@/components/ui/table';

type TransactionProps = {
  id: string;
  description: string;
  message: string;
  amount: string;
  date: string;
  category: string | null;
};

const Transaction: React.FC<TransactionProps> = ({
  id,
  description,
  message,
  amount,
  date,
  category
}) => (
  <TableRow id={id}>
    <TableCell className="text-base font-bold">{description}</TableCell>
    <TableCell className="text-sm">{message}</TableCell>
    <TableCell className="text-gray-600">
      {new Date(date).toLocaleDateString('en-GB')}
    </TableCell>
    <TableCell className="capitalize">
      {category?.replace(/-/g, ' ')}
    </TableCell>
    <TableCell className={amount.startsWith('-') ? 'text-red-500' : 'text-green-500'}>
      {amount}
    </TableCell>
  </TableRow>
);

export default Transaction;
