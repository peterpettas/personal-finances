"use client";

import React, { useEffect, useState } from 'react';
import Transaction from '../../components/Transaction';
import { fetchUpApi } from '../../lib/api';
import { columns, TransactionType, APITransactionType } from './columns';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

type AccountType = {
  id: string;
  attributes: {
    displayName: string;
    balance: {
      value: string;
    };
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
  const [account, setAccount] = useState<AccountType[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [paginationLinks, setPaginationLinks] = useState({ next: null, prev: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const fetchAccountId = async () => {
    const response = await fetch('/api/accounts');
    if (!response.ok) {
      console.error('Failed to fetch transactions');
      return;
    }
    const data = await response.json();
    setAccount(data.accounts);
  }

  const fetchTransactions = async (month: Date, accountId: string, pageAfter?: string | null, pageBefore?: string | null ) => {
    setLoading(true);
    const { start, end } = getStartAndEndOfMonth(month);
    const account = accountId;
    let url = `/api/transactions?accountId=${account}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    if (pageAfter) {
      url += `&pageAfter=${pageAfter}`;
    }
    if (pageBefore) {
      url += `&pageBefore=${pageBefore}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch transactions');
      setLoading(false);
      return;
    }
    const data = await response.json();
    const mappedData: TransactionType[] = data.transactions.map((transaction: APITransactionType) => ({
        id: transaction.id,
        description: transaction.attributes.description,
        message: transaction.attributes.message,
        amount: transaction.attributes.amount.value,
        createdAt: transaction.attributes.createdAt,
        category:
          transaction.relationships.category?.data?.id ?? 'Uncategorized'
      })
    );
    console.log('Fetched transactions:', mappedData);
    setTransactions(mappedData);
    setPaginationLinks(data.links);
    if (!totalPages && data.meta?.totalCount) {
      setTotalPages(Math.ceil(data.meta.totalCount / 100));
    }
    setLoading(false);
  };

   useEffect(() => {
     fetchAccountId();
     console.log(account);
   }, []);

  useEffect(() => {
    fetchTransactions(selectedMonth, selectedAccount);
    setCurrentPage(1);
  }, [selectedMonth, selectedAccount]);

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)));
  }

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)));
  }

  const handleNextPage = () => {
    if (paginationLinks.next) {
      const pageAfter = new URL(paginationLinks.next).searchParams.get(
        'page[after]'
      );
      fetchTransactions(selectedMonth, selectedAccount, pageAfter, null);
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (paginationLinks.prev) {
      const pageBefore = new URL(paginationLinks.prev).searchParams.get(
        'page[before]'
      );
      fetchTransactions(selectedMonth, selectedAccount, null, pageBefore);
      setCurrentPage(currentPage - 1);
    }
  };

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-5">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Select onValueChange={(value: any) => setSelectedAccount(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Select Account</SelectLabel>
              {account.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.attributes.displayName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
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
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter transactions..."
              value={
                (table.getColumn('description')?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) =>
                table
                  .getColumn('description')
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
