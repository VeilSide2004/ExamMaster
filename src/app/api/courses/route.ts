import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { Course } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      const courses = (db.courses || []).filter((c) => c.is_active !== false && String(c.is_active) !== 'false');
      return NextResponse.json({ courses });
    }

    const courses = await Course.find({ is_active: { $ne: false } }).sort({ created_at: -1 });
    return NextResponse.json({ courses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
