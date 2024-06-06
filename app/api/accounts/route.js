import { NextResponse } from 'next/server';
import { fetchUpApi } from '../../../lib/api';

export async function GET() {
  try {
    const data = await fetchUpApi('accounts');
    const accounts = data.data;

    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
