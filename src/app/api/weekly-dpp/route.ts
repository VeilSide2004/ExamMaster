import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { WeeklyDPP, User } from '@/lib/models';
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
        return NextResponse.json({ weeklyDpps: [] });
      }

      const courseId = user.locked_course_id;
      const dpps = (db.weeklyDpps || []).filter((d) => d.course_id === courseId && d.is_active !== false);

      const populated = dpps.map((d) => {
        const dppQuestions = (db.questions || []).filter((q) => (d.question_ids || []).includes(q._id));
        return {
          ...d,
          questions: dppQuestions,
        };
      });

      return NextResponse.json({ weeklyDpps: populated });
    }

    // Mongoose Mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ weeklyDpps: [] });
    }

    const dpps = await WeeklyDPP.find({
      course_id: user.locked_course_id,
      is_active: true,
    }).populate('question_ids');

    const formatted = dpps.map((d) => ({
      _id: d._id.toString(),
      course_id: d.course_id.toString(),
      title: d.title,
      duration_minutes: d.duration_minutes,
      question_ids: (d.question_ids || []).map((q: any) => q._id?.toString() || q.toString()),
      questions: d.question_ids || [],
      created_at: d.created_at,
    }));

    return NextResponse.json({ weeklyDpps: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
