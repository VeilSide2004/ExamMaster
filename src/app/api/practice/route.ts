import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Question, Course, Attempt } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const subject = searchParams.get('subject');

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => String(u._id) === String(auth.userId));
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      const rawCourseId = user.locked_course_id;
      const courseId = typeof rawCourseId === 'object' && rawCourseId?._id ? String(rawCourseId._id) : String(rawCourseId);
      const courseObj = (db.courses || []).find((c) => String(c._id) === courseId || c.name === courseId) || (typeof rawCourseId === 'object' ? rawCourseId : null);

      let questions = (db.questions || []).filter((q) => {
        if (q.is_active === false) return false;
        return String(q.course_id) === courseId || String(q.course_id) === String(courseObj?._id);
      });

      let courseSubjects = courseObj?.subjects && Array.isArray(courseObj.subjects) && courseObj.subjects.length > 0
        ? courseObj.subjects
        : [];

      if (courseSubjects.length === 0) {
        const subSet = new Set<string>();
        questions.forEach((q) => {
          if (q.topic_tag) {
            const sName = q.topic_tag.includes('-') ? q.topic_tag.split('-')[0].trim() : q.topic_tag.trim();
            if (sName) subSet.add(sName);
          }
        });
        courseSubjects = Array.from(subSet);
      }

      const allQuestionsInCourse = questions;
      const topicCounts: Record<string, number> = {};

      allQuestionsInCourse.forEach((q) => {
        if (q.topic_tag) {
          topicCounts[q.topic_tag] = (topicCounts[q.topic_tag] || 0) + 1;
        }
      });

      if (subject) {
        questions = questions.filter((q) => (q.topic_tag || '').toLowerCase().includes(subject.toLowerCase()));
      }

      if (topic) {
        questions = questions.filter((q) => q.topic_tag === topic || (q.topic_tag || '').toLowerCase().includes(topic.toLowerCase()));
      }

      const userAttempts = (db.attempts || []).filter((a) => String(a.student_id) === String(user._id));
      const completedTopics = Array.from(new Set(userAttempts.map((a) => a.topic_tag).filter(Boolean)));

      return NextResponse.json({
        questions,
        topicCounts,
        completedTopics,
        userAttempts,
        courseName: courseObj?.name || 'Selected Track',
        courseSubjects,
      });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    const rawCourseId = user.locked_course_id;
    const courseId = typeof rawCourseId === 'object' && rawCourseId?._id ? rawCourseId._id.toString() : rawCourseId.toString();

    let courseObj: any = null;
    if (typeof rawCourseId === 'object' && rawCourseId?.name) {
      courseObj = rawCourseId;
    } else {
      try {
        courseObj = await Course.findById(courseId);
      } catch (e) {
        courseObj = null;
      }
    }

    const query: any = { is_active: true };
    if (subject) {
      query.topic_tag = { $regex: subject, $options: 'i' };
    }
    if (topic) {
      query.topic_tag = topic;
    }

    const allDbQuestions = await Question.find(query);
    const questions = allDbQuestions.filter((q: any) => {
      return String(q.course_id) === courseId || String(q.course_id) === String(courseObj?._id);
    });

    let courseSubjects = courseObj?.subjects && Array.isArray(courseObj.subjects) && courseObj.subjects.length > 0
      ? courseObj.subjects
      : [];

    if (courseSubjects.length === 0) {
      const subSet = new Set<string>();
      questions.forEach((q: any) => {
        if (q.topic_tag) {
          const sName = q.topic_tag.includes('-') ? q.topic_tag.split('-')[0].trim() : q.topic_tag.trim();
          if (sName) subSet.add(sName);
        }
      });
      courseSubjects = Array.from(subSet);
    }

    const topicCounts: Record<string, number> = {};
    questions.forEach((q) => {
      if (q.topic_tag) {
        topicCounts[q.topic_tag] = (topicCounts[q.topic_tag] || 0) + 1;
      }
    });

    const userAttempts = await Attempt.find({ student_id: user._id });
    const completedTopics = Array.from(new Set(userAttempts.map((a) => a.topic_tag).filter(Boolean)));

    return NextResponse.json({
      questions,
      topicCounts,
      completedTopics,
      userAttempts,
      courseName: courseObj?.name || 'Selected Track',
      courseSubjects,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
