'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type TransactionType = {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
};

type CategoryType = {
  id: string;
  name: string;
  icon?: string;
  budgeted: number;
  activity: number;
  available: number;
  status?: 'Fully Spent' | 'Funded' | string;
  transactions?: TransactionType[];
};

type CategoryGroupType = {
  id: string;
  name: string;
  categories: CategoryType[];
  budgeted: number;
  activity: number;
  available: number;
};

const Budget = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroupType[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [categoryTransactions, setCategoryTransactions] = useState<{ [key: string]: TransactionType[] }>({});
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<{ [key: string]: boolean }>({});

  const fetchBudgetData = async () => {
    setLoading(true);
    try {
      const month = selectedMonth.toISOString();
      const response = await fetch(`/api/categories?month=${encodeURIComponent(month)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget data');
      }
      const data = await response.json();
      setCategoryGroups(data.categoryGroups);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMonth]);

  const fetchCategoryTransactions = async (categoryId: string) => {
    if (categoryTransactions[categoryId] || isLoadingTransactions[categoryId]) return;
    
    setIsLoadingTransactions(prev => ({ ...prev, [categoryId]: true }));
    
    try {
      const startDate = new Date(selectedMonth);
      startDate.setDate(1);
      const endDate = new Date(selectedMonth);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      
      const start = startDate.toISOString();
      const end = endDate.toISOString();
      
      const url = `/api/transactions?categoryId=${categoryId}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category transactions');
      }
      
      const data = await response.json();
      setCategoryTransactions(prev => ({
        ...prev,
        [categoryId]: data.transactions || []
      }));
    } catch (error) {
      console.error('Error fetching category transactions:', error);
    } finally {
      setIsLoadingTransactions(prev => ({ ...prev, [categoryId]: false }));
    }
  };

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const onSubmit = async (data: any) => {
    if (!selectedCategory) return;
    
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          amount: parseFloat(data.amount),
          month: selectedMonth.toISOString()
        })
      });

      if (response.ok) {
        fetchBudgetData();
        setDialogOpen(false);
        reset();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleStartEdit = (category: CategoryType) => {
    setEditingCategory(category.id);
    setEditValue(category.budgeted.toString());
  };

  const handleSave = async (category: CategoryType) => {
    if (!editValue || editingCategory !== category.id) return;

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: category.id,
          amount: parseFloat(editValue),
          month: selectedMonth.toISOString()
        })
      });

      if (response.ok) {
        fetchBudgetData();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }

    setEditingCategory(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: CategoryType) => {
    if (e.key === 'Enter') {
      handleSave(category);
    } else if (e.key === 'Escape') {
      setEditingCategory(null);
      setEditValue('');
    }
  };

  return (
    <Header
      title="Budget"
      children={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableBody>
                  <TableRow className="bg-gray-50 font-medium">
                    <TableCell className="w-1/2">CATEGORY</TableCell>
                    <TableCell className="text-right">BUDGETED</TableCell>
                    <TableCell className="text-right">ACTIVITY</TableCell>
                    <TableCell className="text-right">AVAILABLE</TableCell>
                  </TableRow>
                  {categoryGroups.map((group) => (
                    <React.Fragment key={group.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <TableCell className="font-medium flex items-center gap-2">
                          {expandedGroups[group.id] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {group.name}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(group.budgeted)}</TableCell>
                        <TableCell className="text-right text-red-500">{formatCurrency(group.activity)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                            group.available < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {group.available < 0 ? '-' : ''}{formatCurrency(group.available)}
                          </span>
                        </TableCell>
                      </TableRow>
                      {expandedGroups[group.id] && group.categories.map((category) => (
                        <TableRow key={category.id} className="bg-gray-50" id={category.id}>
                          <TableCell className="pl-8">
                            <div className="flex items-center gap-2">
                              <span>{category.name}</span>
                              {category.status && (
                                <span className="text-xs text-gray-500">
                                  {category.status}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {editingCategory === category.id ? (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleSave(category)}
                                onKeyDown={(e) => handleKeyDown(e, category)}
                                className="w-24 ml-auto"
                                autoFocus
                              />
                            ) : (
                              <button
                                onClick={() => handleStartEdit(category)}
                                className="hover:bg-gray-100 px-2 py-1 rounded"
                              >
                                {formatCurrency(category.budgeted)}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Popover onOpenChange={() => {
                              if (!categoryTransactions[category.id]) {
                                fetchCategoryTransactions(category.id);
                              }
                            }}>
                              <PopoverTrigger asChild>
                                <span className="cursor-pointer text-red-500 hover:underline">
                                  {formatCurrency(category.activity)}
                                </span>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0">
                                <div className="p-3 border-b border-gray-200 bg-gray-50">
                                  <h3 className="font-medium">{category.name} Transactions</h3>
                                  <p className="text-xs text-gray-500">{selectedMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="max-h-60 overflow-auto">
                                  {isLoadingTransactions[category.id] ? (
                                    <div className="p-4 text-center text-sm text-gray-500">Loading transactions...</div>
                                  ) : categoryTransactions[category.id]?.length ? (
                                    <div className="divide-y">
                                      {categoryTransactions[category.id].map(transaction => (
                                        <div key={transaction.id} className="p-3 hover:bg-gray-50">
                                          <div className="flex justify-between">
                                            <span className="font-medium">{transaction.description}</span>
                                            <span className={transaction.amount < 0 ? "text-red-500" : "text-green-500"}>
                                              {formatCurrency(transaction.amount)}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">{formatDate(transaction.date)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-4 text-center text-sm text-gray-500">
                                      No transactions found for this category in the selected month.
                                    </div>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                              category.available < 0
                                ? 'bg-red-100 text-red-700'
                                : category.status === 'Fully Spent'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-green-100 text-green-700'
                            }`}>
                              {category.available < 0 ? '-' : ''}{formatCurrency(category.available)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Set Budget Amount</DialogTitle>
                <DialogDescription>
                  Enter the budget amount for {selectedCategory?.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register('amount', { required: true })}
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
      }
    />
  );
};

export default Budget;
