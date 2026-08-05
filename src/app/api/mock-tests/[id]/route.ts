import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, MockTest, Course, Question } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';
import { getEquivalentCourseIds } from '@/lib/courseMatcher';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

      const rawTest = (db.mockTests || []).find((m) => m._id === params.id);
      if (!rawTest) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      const userCourseId = typeof user.locked_course_id === 'object' && user.locked_course_id?._id ? String(user.locked_course_id._id) : String(user.locked_course_id);
      const validCourseIds = getEquivalentCourseIds(userCourseId, db.courses || []);
      const testCourseId = String(typeof rawTest.course_id === 'object' ? rawTest.course_id?._id : rawTest.course_id);

      if (!validCourseIds.includes(testCourseId)) {
        return NextResponse.json({ error: 'RULE-02 Violation: That test is not part of your locked course' }, { status: 403 });
      }

      const course = (db.courses || []).find((c) => c._id === rawTest.course_id);
      const question_ids = (rawTest.question_ids || []).map((qId: string) => (db.questions || []).find((q) => q._id === qId)).filter(Boolean);

      const test = {
        ...rawTest,
        course_id: course ? { _id: course._id, name: course.name } : { name: 'Locked Course' },
        question_ids,
      };

      return NextResponse.json({ test });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    const rawTest = await MockTest.findById(params.id);
    if (!rawTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const allCourses = await Course.find({});
    const userCourseId = typeof user.locked_course_id === 'object' && user.locked_course_id?._id ? user.locked_course_id._id.toString() : user.locked_course_id.toString();
    const validCourseIds = getEquivalentCourseIds(userCourseId, allCourses);
    const testCourseId = String(typeof rawTest.course_id === 'object' ? (rawTest.course_id as any)?._id : rawTest.course_id);

    if (!validCourseIds.includes(testCourseId)) {
      return NextResponse.json({ error: 'RULE-02 Violation: That test is not part of your locked course' }, { status: 403 });
    }

    const courseObj = allCourses.find((c) => c._id.toString() === testCourseId);
    const rawQIds = (rawTest.question_ids || []).map((q: any) => q._id?.toString() || q.toString());
    const populatedQs = await Question.find({ _id: { $in: rawQIds } });

    const orderedQs = rawQIds
      .map((qId: string) => populatedQs.find((q: any) => q._id.toString() === qId || String(q._id) === qId))
      .filter(Boolean);

    const test = {
      ...rawTest.toObject(),
      course_id: courseObj ? { _id: courseObj._id.toString(), name: courseObj.name, subjects: courseObj.subjects } : { name: 'Locked Course' },
      question_ids: orderedQs,
    };

    return NextResponse.json({ test });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

