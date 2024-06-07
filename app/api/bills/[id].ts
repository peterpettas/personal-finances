import { NextResponse } from 'next/server';
import { getBillById, updateBillById, deleteBillById } from '../../../lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const bill = await getBillById(parseInt(id, 10));

  if (!bill) {
    return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
  }

  return NextResponse.json(bill);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const data = await req.json();

  const bill = await updateBillById(parseInt(id, 10), { ...data, updatedat: new Date() });

  return NextResponse.json(bill);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  await deleteBillById(parseInt(id, 10));

  return NextResponse.json({ message: 'Bill deleted' });
}
