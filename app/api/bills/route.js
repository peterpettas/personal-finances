import { NextResponse } from 'next/server';
import { getBills, createBill } from '../../../lib/db';

export async function GET() {
	const bills = await getBills();
	return NextResponse.json(bills);
}

export async function POST(req) {
	const data = await req.json();
	const bill = await createBill(data);

	return NextResponse.json(bill);
}