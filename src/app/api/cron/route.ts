import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Perform a lightweight query to wake up the database
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: 'Database kept alive' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ success: false, error: 'Failed to query database' }, { status: 500 });
  }
}
