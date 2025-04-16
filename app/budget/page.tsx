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
      
      // Instead of immediately setting category groups, wait for transaction data
      // to be fetched and totals to be calculated
      await fetchAllCategoryTransactions(data.categoryGroups);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch transactions for all categories
  const fetchAllCategoryTransactions = async (groups: CategoryGroupType[]) => {
    const allCategories = groups.flatMap(group => group.categories);
    
    // Prepare date range for the selected month
    const startDate = new Date(selectedMonth);
    startDate.setDate(1);
    const endDate = new Date(selectedMonth);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    
    // Set loading state for all categories
    const loadingStates: { [key: string]: boolean } = {};
    allCategories.forEach(cat => {
      loadingStates[cat.id] = true;
    });
    setIsLoadingTransactions(loadingStates);
    
    // Fetch transactions for each category in parallel
    const fetchPromises = allCategories.map(async (category) => {
      try {
        const url = `/api/transactions?categoryId=${category.id}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions for category ${category.id}`);
        }
        
        const data = await response.json();
        
        // Transform the API response to match the expected TransactionType
        const formattedTransactions = (data.transactions || []).map((transaction: any) => {
          // Check for existing expected format
          if (transaction.id && transaction.description && transaction.amount !== undefined && transaction.date) {
            return transaction;
          }
          
          // Handle UP API transaction format
          return {
            id: transaction.id || `temp-id-${Math.random()}`,
            description: transaction.attributes?.description || 'Unknown transaction',
            amount: transaction.attributes?.amount?.valueInBaseUnits 
              ? parseFloat(transaction.attributes.amount.valueInBaseUnits) / 100 * -1
              : 0,
            date: transaction.attributes?.createdAt || transaction.attributes?.settledAt || new Date().toISOString(),
            categoryId: category.id
          };
        });
        
        return {
          categoryId: category.id,
          transactions: formattedTransactions
        };
      } catch (error) {
        console.error(`Error fetching transactions for category ${category.id}:`, error);
        return {
          categoryId: category.id,
          transactions: []
        };
      }
    });
    
    // Wait for all fetch operations to complete
    const results = await Promise.all(fetchPromises);
    
    // Update category transactions state
    const newTransactions: { [key: string]: TransactionType[] } = {};
    results.forEach(result => {
      newTransactions[result.categoryId] = result.transactions;
    });
    setCategoryTransactions(newTransactions);
    
    // Update category totals based on transaction data
    updateCategoryTotals(groups, newTransactions);
    
    // Clear loading states
    const finishedLoadingStates: { [key: string]: boolean } = {};
    allCategories.forEach(cat => {
      finishedLoadingStates[cat.id] = false;
    });
    setIsLoadingTransactions(finishedLoadingStates);
  };
  
  // Function to update category totals based on transaction data
  const updateCategoryTotals = (groups: CategoryGroupType[], transactions: { [key: string]: TransactionType[] }) => {
    setCategoryGroups(groups.map(group => {
      const updatedCategories = group.categories.map(cat => {
        const catTransactions = transactions[cat.id] || [];
        const transactionsTotal = calculateTransactionsTotal(catTransactions);
        
        // Calculate available amount correctly:
        // 1. If no budget (budgeted = 0), available should be 0 (will show green)
        // 2. If budget is set, available = budgeted - activity (since activity is negative for expenses, 
        //    this is equivalent to budgeted + Math.abs(activity))
        const available = cat.budgeted === 0 ? 0 : cat.budgeted - transactionsTotal;
        
        return {
          ...cat,
          activity: transactionsTotal,
          available: available
        };
      });
      
      // Recalculate group totals based on updated categories
      const groupActivity = updatedCategories.reduce((sum, cat) => sum + cat.activity, 0);
      const groupBudgeted = updatedCategories.reduce((sum, cat) => sum + cat.budgeted, 0);
      const groupAvailable = updatedCategories.reduce((sum, cat) => sum + cat.available, 0);
      
      return {
        ...group,
        categories: updatedCategories,
        activity: groupActivity,
        budgeted: groupBudgeted,
        available: groupAvailable
      };
    }));
  };

  // Simplified version of fetchCategoryTransactions that uses the cached data
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
      
      // Transform the API response to match the expected TransactionType
      const formattedTransactions = (data.transactions || []).map((transaction: any) => {
        // Check for existing expected format
        if (transaction.id && transaction.description && transaction.amount !== undefined && transaction.date) {
          return transaction;
        }
        
        // Handle UP API transaction format
        return {
          id: transaction.id || `temp-id-${Math.random()}`,
          description: transaction.attributes?.description || 'Unknown transaction',
          // Parse the amount properly from API response
          amount: transaction.attributes?.amount?.valueInBaseUnits 
            ? parseFloat(transaction.attributes.amount.valueInBaseUnits) / 100 * -1 // Make debits negative
            : 0,
          date: transaction.attributes?.createdAt || transaction.attributes?.settledAt || new Date().toISOString(),
          categoryId: categoryId
        };
      });
      
      // Store the transactions in state
      setCategoryTransactions(prev => ({
        ...prev,
        [categoryId]: formattedTransactions
      }));
    } catch (error) {
      console.error('Error fetching category transactions:', error);
    } finally {
      setIsLoadingTransactions(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [selectedMonth]);

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
    if (isNaN(amount) || amount === undefined || amount === null) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(Math.abs(amount));
  };

  const calculateTransactionsTotal = (transactions: TransactionType[]): number => {
    if (!transactions || transactions.length === 0) return 0;
    
    return transactions.reduce((total, transaction) => {
      // Ensure we're working with numbers
      const amount = typeof transaction.amount === 'number' 
        ? transaction.amount 
        : typeof transaction.amount === 'string' 
          ? parseFloat(transaction.amount) 
          : 0;
        
      if (isNaN(amount)) return total;
      return total + amount;
    }, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-AU', {
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
      const amount = parseFloat(editValue);
      
      // First, optimistically update the UI
      setCategoryGroups(prevGroups => {
        return prevGroups.map(group => {
          // Find the category in this group
          const categoryIndex = group.categories.findIndex(cat => cat.id === category.id);
          
          // If the category is not in this group, return the group unchanged
          if (categoryIndex === -1) return group;
          
          // Get the old budgeted amount to calculate the difference
          const oldBudgeted = group.categories[categoryIndex].budgeted;
          const budgetDifference = amount - oldBudgeted;
          
          // Create a copy of the categories array with the updated category
          const updatedCategories = [...group.categories];
          
          // Calculate new available based on current activity
          const newAvailable = amount === 0 ? 0 : amount - updatedCategories[categoryIndex].activity;
          
          updatedCategories[categoryIndex] = {
            ...updatedCategories[categoryIndex],
            budgeted: amount,
            available: newAvailable
          };
          
          // Update the group totals
          return {
            ...group,
            categories: updatedCategories,
            budgeted: group.budgeted + budgetDifference,
            available: group.available + budgetDifference
          };
        });
      });
      
      // Then, make the API call to persist the change
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: category.id,
          amount: amount,
          month: selectedMonth.toISOString()
        })
      });

      if (!response.ok) {
        // If the API call fails, revert the optimistic update by refetching data
        console.error('Failed to update budget, reverting UI changes');
        fetchBudgetData();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      // Revert UI changes on error
      fetchBudgetData();
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
                                <div className="p-2 border-b border-gray-200 bg-gray-50">
                                  <h3 className="font-medium">{category.name} Transactions</h3>
                                  <p className="text-xs text-gray-500">{selectedMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="max-h-60 overflow-auto">
                                  {isLoadingTransactions[category.id] ? (
                                    <div className="p-2 text-center text-sm text-gray-500">Loading transactions...</div>
                                  ) : categoryTransactions[category.id]?.length ? (
                                    <div className="divide-y">
                                      {categoryTransactions[category.id].map(transaction => (
                                        <div key={transaction.id} className="p-2 hover:bg-gray-50">
                                          <div className="flex justify-between">
                                            <span className="font-medium text-sm">{transaction.description}</span>
                                            <span className={` text-sm ${transaction.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                                              {formatCurrency(transaction.amount)}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">{formatDate(transaction.date)}</div>
                                        </div>
                                      ))}
                                      <div className="p-2 border-t border-gray-200 font-medium bg-gray-50 flex justify-between">
                                        <span>Total:</span>
                                        <span className={calculateTransactionsTotal(categoryTransactions[category.id]) < 0 ? "text-red-500" : "text-green-500"}>
                                          {formatCurrency(calculateTransactionsTotal(categoryTransactions[category.id]))}
                                        </span>
                                      </div>
                                      {Math.abs(calculateTransactionsTotal(categoryTransactions[category.id]) - category.activity) > 0.01 && (
                                        <div className="p-2 bg-amber-50 text-amber-700 text-sm border-t border-amber-200">
                                          <div className="flex justify-between">
                                            <span>Discrepancy:</span>
                                            <span>
                                              {formatCurrency(Math.abs(calculateTransactionsTotal(categoryTransactions[category.id]) - category.activity))}
                                            </span>
                                          </div>
                                          <div className="text-xs mt-1">
                                            Note: The total of visible transactions doesn't match the category activity amount.
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-2 text-center text-sm text-gray-500">
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
