import { NextResponse } from 'next/server';
import { createOrUpdateBudget } from '../../../lib/db';

export async function POST(req: Request) {
  try {
    const { categoryId, amount, month } = await req.json();
    
    if (!categoryId || amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const budget = await createOrUpdateBudget(
      categoryId,
      amount,
      month ? new Date(month) : new Date()
    );

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
} 