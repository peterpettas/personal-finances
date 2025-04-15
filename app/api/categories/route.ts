import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';
import { getBudgetsForMonth, SelectBudget } from '../../../lib/db';

type UpCategory = {
  type: string;
  id: string;
  attributes: {
    name: string;
  };
  relationships: {
    parent: {
      data: {
        type: string;
        id: string;
      } | null;
    };
    children: {
      data: Array<{
        type: string;
        id: string;
      }>;
    };
  };
};

type UpTransaction = {
  type: string;
  id: string;
  attributes: {
    amount: {
      value: string;
      currencyCode: string;
    };
    createdAt: string;
    description: string;
    status: string;
  };
  relationships: {
    category: {
      data: {
        type: string;
        id: string;
      } | null;
    };
  };
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const monthStr = searchParams.get('month');
  const month = monthStr ? new Date(monthStr) : new Date();

  try {
    // Fetch all categories from Up API
    const categoriesResponse = await fetchUpApi('categories');
    const upCategories: UpCategory[] = categoriesResponse.data;

    // Get root categories (those without parents)
    const rootCategories = upCategories.filter(
      (cat) => cat.relationships.parent.data === null
    );

    // Get all budgets for the month - handle case where table doesn't exist yet
    let budgets: SelectBudget[] = [];
    try {
      budgets = await getBudgetsForMonth(month);
    } catch (error) {
      console.warn('Could not fetch budgets, possibly because table does not exist yet:', error);
    }
    const budgetMap = new Map(budgets.map(b => [b.categoryId, b.amount]));

    // Get transactions for the month
    const { start, end } = getStartAndEndOfMonth(month);
    const transactionsResponse = await fetchUpApi(
      `transactions?filter[since]=${encodeURIComponent(start)}&filter[until]=${encodeURIComponent(end)}`
    );
    const transactions: UpTransaction[] = transactionsResponse.data;

    // Calculate activity per category
    const activityMap = new Map<string, number>();
    transactions.forEach(transaction => {
      const categoryId = transaction.relationships.category?.data?.id;
      if (categoryId) {
        const amount = parseFloat(transaction.attributes.amount.value);
        activityMap.set(
          categoryId,
          (activityMap.get(categoryId) || 0) + amount
        );
      }
    });

    // Transform Up categories into our budget structure
    const categoryGroups = await Promise.all(
      rootCategories.map(async (rootCat) => {
        // Fetch child categories
        const childResponse = await fetchUpApi(
          `categories?filter[parent]=${rootCat.id}`
        );
        const childCategories: UpCategory[] = childResponse.data;

        // Calculate group totals
        let groupBudgeted = 0;
        let groupActivity = 0;
        
        const categories = childCategories.map((child) => {
          const budgeted = budgetMap.get(child.id) || 0;
          const activity = activityMap.get(child.id) || 0;
          const available = budgeted + activity;

          groupBudgeted += budgeted;
          groupActivity += activity;

          return {
            id: child.id,
            name: `${getCategoryEmoji(child.id)} ${child.attributes.name}`,
            budgeted,
            activity,
            available,
            status: getStatus(budgeted, activity)
          };
        });

        return {
          id: rootCat.id,
          name: rootCat.attributes.name,
          budgeted: groupBudgeted,
          activity: groupActivity,
          available: groupBudgeted + groupActivity,
          categories
        };
      })
    );

    return NextResponse.json({ categoryGroups });
  } catch (error) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

function getStartAndEndOfMonth(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

function getCategoryEmoji(categoryId: string): string {
  const emojiMap: { [key: string]: string } = {
	'games-and-software': '🎮',
	'booze': '🍺',
	'events-and-gigs': '🎉',
	'hobbies': '🎨',
	'holidays-and-travel': '✈️',
	'lottery-and-gambling': '🎲',
	'pubs-and-bars': '🍻',
	'restaurants-and-cafes': '🍽️',
	'takeaway': '🍔',
	'tv-and-music': '🎥',
	'adult': '🔞',
	'family': '👪',
	'clothing-and-accessories': '👕',
	'education-and-student-loans': '🎓',
	'fitness-and-wellbeing': '🏃',
	'gifts-and-charity': '🎁',
	'hair-and-beauty': '💆‍♂️',
	'health-and-medical': '🏥',
	'investments': '📈',
	'life-admin': '📝',
	'mobile-phone': '📱',
	'news-magazines-and-books': '📰',
	'technology': '💻',
	'groceries': '🛒',
	'homeware-and-appliances': '🛋️',
	'internet': '🌐',
	'home-maintenance-and-improvements': '🔧',
  'pets': '🐾',
  'home-insurance-and-rates': '🏡',
  'rent-and-mortgage': '🏠',
  'utilities': '💡',
  'car-insurance-and-maintenance': '🚗',
  'cycling': '🚴',
  'fuel': '⛽',
  'public-transport': '🚉',
  'car-repayments': '',
  'taxis-and-share-cars': '🚕',
  'toll-roads': '🛣️',
  };

  return emojiMap[categoryId] || '💰';
}

function getStatus(budgeted: number, activity: number): string {
  const available = budgeted + activity;
  
  if (available === 0 && budgeted > 0) {
    return 'Fully Spent';
  } else if (activity !== 0) {
    return `Spent ${formatCurrency(Math.abs(activity))} of ${formatCurrency(budgeted)}`;
  } else if (budgeted > 0) {
    return 'Funded';
  }
  
  return '';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount);
} 