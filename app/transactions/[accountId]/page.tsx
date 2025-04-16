"use client";

import React, { useEffect, useState } from 'react';
import Transaction from '../../../components/Transaction';
import { fetchUpApi } from '../../../lib/api';
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, MoreVerticalIcon, PlusIcon } from "lucide-react"
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
import { Header } from '@/components/Header';
import { useParams } from 'next/navigation';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ChevronsUpDown, Check } from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

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
  const [loading, setLoading] = useState(true);
  const [paginationLinks, setPaginationLinks] = useState({
    next: null,
    prev: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { accountId } = useParams();

  // Add state for new transaction form
  const [form, setForm] = useState({
    description: '',
    message: '',
    amount: '',
    createdAt: new Date().toISOString().slice(0, 16), // ISO string for datetime-local
    category: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<
      { id: string; name: string }[]
    >([]);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

    useEffect(() => {
      async function fetchCategories() {
        try {
          const res = await fetch('/api/categories');
          const data = await res.json();
          // Flatten all child categories from all groups
          const cats = (data.categoryGroups || [])
            .flatMap((group: any) => group.categories)
            .map((cat: any) => ({ id: cat.id, name: cat.name }));
          setCategories(cats);
        } catch (e) {
          setCategories([]);
        }
      }
      fetchCategories();
    }, []);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accountId?.toString() || '',
          ...form
        })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add transaction');
      } else {
        setForm({ description: '', message: '', amount: '', createdAt: new Date().toISOString().slice(0, 16), category: '' });
        if (accountId) fetchTransactions(selectedMonth, accountId);
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  // Add delete handler for manual transactions
  const handleDelete = async (id: string) => {
    // if (!window.confirm('Delete this transaction?')) return;
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete transaction');
      } else {
        if (accountId) fetchTransactions(selectedMonth, accountId);
      }
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  // Add state for popover confirmation
  const [deletePopoverId, setDeletePopoverId] = useState<string | null>(null);

  const setPaginationState = (updater: any) => {
    const newPagination =
      typeof updater === 'function'
        ? updater({ pageIndex: currentPage - 1, pageSize: 10 })
        : updater;
    setCurrentPage(newPagination.pageIndex + 1);
  };

  const fetchTransactions = async (
    month: Date,
    accountId: string | string[],
    pageAfter?: string | null,
    pageBefore?: string | null
  ) => {
    setLoading(true);
    setTransactions([]);
    const { start, end } = getStartAndEndOfMonth(month);

    let url = `/api/transactions?accountId=${accountId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
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
    const mappedData: TransactionType[] = data.transactions.map(
      (transaction: APITransactionType) => ({
        id: transaction.id,
        description: transaction.attributes.description,
        message: transaction.attributes.message,
        amount: transaction.attributes.amount.value,
        createdAt: transaction.attributes.createdAt,
        category:
          transaction.relationships.category?.data?.id ?? 'Uncategorized'
      })
    );

    setTransactions(mappedData);
    setPaginationLinks(data.links);
    if (!totalPages && data.meta?.totalCount) {
      setTotalPages(Math.ceil(data.meta.totalCount / 100));
    }
    setLoading(false);
  };

  useEffect(() => {
    setTransactions([]);
    if (accountId) {
      fetchTransactions(selectedMonth, accountId);
    }
    setCurrentPage(1);
  }, [selectedMonth, accountId]);

  const handlePreviousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1))
    );
  };

  const handleNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1))
    );
  };

  const handleNextPage = () => {
    if (paginationLinks.next) {
      const pageAfter = new URL(paginationLinks.next).searchParams.get(
        'page[after]'
      );
      setTransactions([]);
      fetchTransactions(selectedMonth, accountId, pageAfter, null);
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (paginationLinks.prev) {
      const pageBefore = new URL(paginationLinks.prev).searchParams.get(
        'page[before]'
      );
      setTransactions([]);
      fetchTransactions(selectedMonth, accountId, null, pageBefore);
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  const table = useReactTable({
    data: transactions,
    columns,
    pageCount: totalPages,
    onPaginationChange: (updater) => {
      setPaginationState(updater);
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: { pageIndex: currentPage - 1, pageSize: 100 },
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  });

  return (
    <>
      <Header title="Transactions">
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Add Transaction Dialog Trigger */}
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mb-2" size="icon" variant="outline">
                  <PlusIcon />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                  <DialogDescription>
                    Quickly add a new transaction to this account.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2">
                  <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <form onSubmit={handleFormSubmit} className="p-6 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="description"
                            className="text-sm font-medium"
                          >
                            Description
                          </label>
                          <Input
                            id="description"
                            name="description"
                            placeholder="Description"
                            value={form.description}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="message"
                            className="text-sm font-medium"
                          >
                            Message
                          </label>
                          <Input
                            id="message"
                            name="message"
                            placeholder="Message"
                            value={form.message}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="amount"
                            className="text-sm font-medium"
                          >
                            Amount
                          </label>
                          <Input
                            id="amount"
                            name="amount"
                            placeholder="Amount"
                            type="number"
                            step="0.01"
                            value={form.amount}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label
                            htmlFor="createdAt"
                            className="text-sm font-medium"
                          >
                            Date
                          </label>
                          <Input
                            id="createdAt"
                            name="createdAt"
                            type="date"
                            value={form.createdAt.slice(0, 10)}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label htmlFor="category" className="text-sm font-medium">Category</label>
                          <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={categoryPopoverOpen}
                                className="w-full justify-between"
                                type="button"
                              >
                                {categorySearch.toLowerCase()
                                  ? categories.find((cat) => cat.id === categorySearch.toLowerCase())?.name
                                  : "Select category..."}
                                <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search category..."
                                  className="h-9"
                                  // value={categorySearch}
                                  // onValueChange={setCategorySearch}
                                />
                                <CommandList className="max-h-48">
                                  <CommandEmpty>No category found.</CommandEmpty>
                                  <CommandGroup>
                                    {categories
                                      // .filter(cat =>
                                      //   cat.name.toLowerCase().includes(categorySearch.toLowerCase())
                                      // )
                                      .map((cat) => (
                                        <CommandItem
                                          key={cat.id}
                                          value={cat.id}
                                          onSelect={(currentValue) => {
                                            setCategorySearch(
                                              currentValue ===
                                                categorySearch.toLowerCase()
                                                ? ''
                                                : currentValue
                                            );
                                            setCategoryPopoverOpen(false);
                                            // setForm((f) => ({
                                            //   ...f,
                                            //   category: currentValue
                                            // }));
                                          }}
                                        >
                                          {cat.name}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              categorySearch.toLowerCase() === cat.id ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-6">
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="h-10 w-40"
                        >
                          {submitting ? 'Adding...' : 'Add Transaction'}
                        </Button>
                        {error && (
                          <span className="text-sm font-medium text-destructive">
                            {error}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                    (table
                      .getColumn('description')
                      ?.getFilterValue() as string) ?? ''
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
                        <TableHead>Actions</TableHead>
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
                          <TableCell>
                            {/* {row.original.id?.startsWith('local-') && ( */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                  size="icon"
                                >
                                  <MoreVerticalIcon />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Make a copy</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    handleDelete(row.original.id);
                                    setDeletePopoverId(null);
                                  }}
                                  className="text-red-500"
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length + 1}
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
                    onClick={handlePreviousPage}
                    disabled={!paginationLinks.prev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!paginationLinks.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Header>
    </>
  );
};

export default TransactionsPage;
