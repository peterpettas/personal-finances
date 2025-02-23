'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { billColumns, BillType } from '../transactions/[accountId]/columns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import { ArrowUpDown, ChevronDown, MoreHorizontal, PlusIcon } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const BillsPage = () => {
  const [bills, setBills] = useState<BillType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchBills = async () => {
    setLoading(true);
    const response = await fetch('/api/bills');
    if (!response.ok) {
      console.error('Failed to fetch bills');
      setLoading(false);
      return;
    }
    const data = await response.json();
    setBills(data);
    setLoading(false);
  };

  const addBill = async (data: any) => {
    const response = await fetch('/api/bills', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      fetchBills();
    }
  };

  const updateBill = async (id: number, data: any) => {
    const response = await fetch(`/api/bills/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      fetchBills();
    }
  };

  const deleteBill = async (id: number) => {
    const response = await fetch(`/api/bills/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      fetchBills();
    }
  };

  const onSubmit = (data: any) => {
	const billData = {
		...data,
		amount: parseFloat(data.amount),
	};
    addBill(billData);
    reset();
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const table = useReactTable({
    data: bills,
    columns: billColumns,
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

  const onDateChange = (date: any) => {
    setSelectedDate(date);
  };

  return (
    <div className="p-6 space-y-4">
      <div className='flex justify-between items-center'>
        <h1 className="text-2xl font-bold">Bills</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4"><PlusIcon /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Bill</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new bill. Click save when you're
                done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    {...register('description', { required: true })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    {...register('amount', { required: true })}
                    type="number"
                    step="0.01"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duedate" className="text-right">
                    Due Date
                  </Label>
                  <Input
                    id="duedate"
                    {...register('duedate', { required: true })}
                    type="date"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="category"
                    {...register('category', { required: true })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subcategory" className="text-right">
                    subcategory
                  </Label>
                  <Input
                    id="subcategory"
                    {...register('subcategory')}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paid" className="text-right">
                    Paid
                  </Label>
                  <select
                    {...register('paid', { required: true })}
                    className="col-span-3"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payfromaccount" className="text-right">
                    Pay from account
                  </Label>
                  <Input
                    id="payfromaccount"
                    {...register('payfromaccount', { required: true })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    {...register('notes')}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="submit">Save</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedDate(
              new Date(selectedDate.setMonth(selectedDate.getMonth() - 1))
            )
          }
        >
          Previous Month
        </Button>
        <h2 className="text-lg font-semibold">
          {selectedDate.toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric'
          })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSelectedDate(
              new Date(selectedDate.setMonth(selectedDate.getMonth() + 1))
            )
          }
        >
          Next Month
        </Button>
      </div>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="w-full">
          <div className="flex items-center py-4">
            <Input
              placeholder="Filter bills..."
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
                      colSpan={billColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsPage;
