import { ColumnDef } from "@tanstack/react-table";

export type TransactionType = {
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

export const columns: ColumnDef<TransactionType>[] = [
  {
    header: 'Description',
    accessorKey: 'attributes.description'
  },
  {
    header: 'Message',
    accessorKey: 'attributes.message'
  },
  {
    header: 'Date',
    accessorKey: 'attributes.createdAt',
    cell: ({ row }) => {
      const date = new Date(row.original.attributes.createdAt);
      return date.toLocaleDateString('en-GB');
    }
  },
  {
    header: 'Category',
    accessorKey: 'relationships.category.data.id'
  },
  {
    header: 'Amount',
    accessorKey: 'attributes.amount.value',
    cell: ({ row }) => {
      const amountValue = row.original.attributes.amount.value;
      const amount = parseFloat(amountValue);
      const formatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
      }).format(amount);

      return amount < 0 ? (
        `<span className="text-red-500">${formatted}</span>`
      ) : (
        `<span className="text-green-500">${formatted}</span>`
      );
    }
  }
];