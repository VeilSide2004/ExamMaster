import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, MockTest, Course, Question } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';
import { getEquivalentCourseIds } from '@/lib/courseMatcher';

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

      const validCourseIds = getEquivalentCourseIds(String(user.locked_course_id), db.courses || []);

      const tests = (db.mockTests || [])
        .filter((m) => {
          const testCourseId = String(typeof m.course_id === 'object' ? m.course_id?._id : m.course_id);
          return validCourseIds.includes(testCourseId) && m.is_active !== false;
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

    const allCourses = await Course.find({});
    const validCourseIds = getEquivalentCourseIds(user.locked_course_id.toString(), allCourses);

    const rawTests = await MockTest.find({
      course_id: { $in: validCourseIds },
      is_active: true,
    });

    const tests = await Promise.all(
      rawTests.map(async (m) => {
        const rawQIds = (m.question_ids || []).map((q: any) => q._id?.toString() || q.toString());
        const qs = await Question.find({ _id: { $in: rawQIds } });
        return {
          ...m.toObject(),
          question_ids: qs,
        };
      })
    );

    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

