'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Define chart data type
interface ChartDataItem {
  month: string;
  income: number;
  expenses: number;
}

const chartConfig = {
  income: {
    label: 'Income',
    color: 'hsl(var(--chart-1))'
  },
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-2))'
  }
} satisfies ChartConfig;

export function SpendVSEarn() {
  const [timeRange, setTimeRange] = useState('6');
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<{ percentage: number; isUp: boolean }>({ percentage: 0, isUp: false });
  
  const currentDate = new Date();
  const thisYear = currentDate.getFullYear();
  const startDate = new Date();
  startDate.setMonth(currentDate.getMonth() - parseInt(timeRange, 10));
  const startYear = startDate.getFullYear();
  
  // Calculate the range of months for display
  const getMonthRangeDisplay = () => {
    if (chartData.length === 0) return '';
    return `${chartData[0]?.month} ${startYear} - ${chartData[chartData.length - 1]?.month} ${thisYear}`;
  };
  
  // Fetch transaction data
  useEffect(() => {
    async function fetchTransactionData() {
      setLoading(true);
      try {
        // Create date range for API query
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - parseInt(timeRange, 10));
        
        // Fetch transactions
        const response = await fetch(`/api/transactions?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        
        // Process transactions into monthly aggregates
        const monthlyData: Record<string, { income: number, expenses: number }> = {};
        
        // Initialize all months in the range
        for (let i = 0; i < parseInt(timeRange, 10); i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleDateString('en-US', { month: 'long' });
          monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        // Process each transaction
        data.transactions.forEach((transaction: any) => {
          const date = new Date(transaction.attributes.createdAt);
          const monthKey = date.toLocaleDateString('en-US', { month: 'long' });
          
          // Skip if the month isn't in our display range
          if (!monthlyData[monthKey]) return;
          
          const amountValue = parseFloat(transaction.attributes.amount.value);
          
          // Positive values are income, negative are expenses
          if (amountValue > 0) {
            monthlyData[monthKey].income += amountValue;
          } else {
            // Store expenses as positive numbers for display purposes
            monthlyData[monthKey].expenses += Math.abs(amountValue);
          }
        });
        
        // Convert to array format for chart
        const formattedData: ChartDataItem[] = Object.keys(monthlyData)
          .map(month => ({
            month,
            income: Math.round(monthlyData[month].income),
            expenses: Math.round(monthlyData[month].expenses)
          }))
          // Sort by date (most recent months last)
          .sort((a, b) => {
            const months = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months.indexOf(a.month) - months.indexOf(b.month);
          });
        
        // Calculate trend
        if (formattedData.length >= 2) {
          const currentMonth = formattedData[formattedData.length - 1];
          const previousMonth = formattedData[formattedData.length - 2];
          
          // Calculate net (income - expenses)
          const currentNet = currentMonth.income - currentMonth.expenses;
          const previousNet = previousMonth.income - previousMonth.expenses;
          
          // Calculate percentage change
          let percentageChange = 0;
          if (previousNet !== 0) {
            percentageChange = ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
          }
          
          setTrend({
            percentage: Math.abs(parseFloat(percentageChange.toFixed(1))),
            isUp: percentageChange >= 0
          });
        }
        
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching transaction data:', error);
        // Fallback to empty data
        setChartData([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTransactionData();
  }, [timeRange]);

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Last {timeRange} months</CardTitle>
          <CardDescription>{getMonthRangeDisplay()}</CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a time range"
          >
            <SelectValue placeholder="Last 6 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="9" className="rounded-lg">
              Last 9 months
            </SelectItem>
            <SelectItem value="6" className="rounded-lg">
              Last 6 months
            </SelectItem>
            <SelectItem value="3" className="rounded-lg">
              Last 3 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <p>Loading chart data...</p>
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={4} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p>No transaction data available</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {trend.isUp ? (
            <>
              Trending up by {trend.percentage}% this month <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Trending down by {trend.percentage}% this month <TrendingDown className="h-4 w-4" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing income vs. expenses for the last {timeRange} months
        </div>
      </CardFooter>
    </Card>
  );
}
