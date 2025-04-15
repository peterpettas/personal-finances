import { NextResponse } from 'next/server';
import { executeMigration } from '../../../lib/db';

export async function POST() {
  try {
    await executeMigration();
    return NextResponse.json({ message: 'Migration completed successfully' });
  } catch (error) {
    console.error('Error executing migration:', error);
    return NextResponse.json(
      { error: 'Failed to execute migration' },
      { status: 500 }
    );
  }
} 