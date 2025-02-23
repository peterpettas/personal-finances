import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type APITransactionType = {
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
      };
      links: {
        self: string;
      } | null;
    } | null;
  };
};

export type TransactionType = {
  id: string;
  description: string;
  message: string;
  amount: string;
  createdAt: string;
  category: string;
  links: {
    self: string;
  } | null;
};

export type BillType = {
  id: string;
  description: string;
  amount: string;
  duedate: string;
  paid: string;
  payfromaccount: string;
  category: string;
  subcategory: string;
  notes: string;
};

export const billColumns: ColumnDef<BillType>[] = [
  {
    header: 'Description',
    accessorKey: 'description'
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => {
      const dateValue = row.original.duedate;
      const date = new Date(dateValue);
      return date.toLocaleDateString('en-GB');
    }
  },
  {
    accessorKey: 'amount',
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = row.original.amount;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AUD'
      }).format(parseFloat(amount));
      return <div className="text-right font-medium">{formatted}</div>;
    }
  },
  {
    accessorKey: 'paid',
    header: 'Paid'
  },
  {
    accessorKey: 'payfromaccount',
    header: 'Pay from account'
  },
  {
    accessorKey: 'category',
    header: 'Category'
  },
  {
    accessorKey: 'subcategory',
    header: 'Sub-Category'
  },
  {
    accessorKey: 'notes',
    header: 'Notes'
  }
];

export const columns: ColumnDef<TransactionType>[] = [
  {
    header: 'Description',
    accessorKey: 'description'
  },
  {
    header: 'Message',
    accessorKey: 'message'
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    accessorKey: 'createdAt',
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleDateString('en-GB');
    }
  },
  {
    header: 'Category',
    accessorKey: 'category',
	cell: ({ row }) => {
	  const category = row.original.category;
	  const formatted = category.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
	  return formatted;
	}
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    cell: ({ row }) => {
      const amountValue = row.original.amount;
      const amount = parseFloat(amountValue);
      const formatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
      }).format(amount);

      return (
        <span className={amount < 0 ? 'text-red-500' : 'text-green-500'}>
          {formatted.replace(/-/g, '')}
        </span>
      );
    }
  }
];