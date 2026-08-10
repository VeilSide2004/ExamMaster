import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { WeeklyDPP, User, Course } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';
import { getEquivalentCourseIds } from '@/lib/courseMatcher';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => String(u._id) === String(auth.userId));
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ weeklyDpps: [] });
      }

      const userCourseId = typeof user.locked_course_id === 'object' && user.locked_course_id?._id ? String(user.locked_course_id._id) : String(user.locked_course_id);
      const validCourseIds = getEquivalentCourseIds(userCourseId, db.courses || []);
      const dpps = (db.weeklyDpps || []).filter((d) => {
        const dppCourseId = String(typeof d.course_id === 'object' ? d.course_id?._id : d.course_id);
        return validCourseIds.includes(dppCourseId) && d.is_active !== false;
      });

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

    const allCourses = await Course.find({});
    const userCourseId = typeof user.locked_course_id === 'object' && user.locked_course_id?._id ? user.locked_course_id._id.toString() : user.locked_course_id.toString();
    const validCourseIds = getEquivalentCourseIds(userCourseId, allCourses);

    const dpps = await WeeklyDPP.find({
      course_id: { $in: validCourseIds },
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
