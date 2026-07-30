import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, MockTest } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => u._id === auth.userId);
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      const userLockedCourseId = String(user.locked_course_id);

      const tests = (db.mockTests || [])
        .filter((m) => {
          const testCourseId = String(typeof m.course_id === 'object' ? m.course_id?._id : m.course_id);
          return testCourseId === userLockedCourseId && m.is_active !== false;
        })
        .map((m) => {
          const qList = (m.question_ids || []).map((qId: string) => (db.questions || []).find((q) => q._id === qId)).filter(Boolean);
          return { ...m, question_ids: qList };
        });

      return NextResponse.json({ tests });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    const tests = await MockTest.find({
      course_id: user.locked_course_id,
      is_active: true,
    }).populate('question_ids');

    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
