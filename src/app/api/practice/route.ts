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
      const user = (db.users || []).find((u) => u._id === auth.userId);
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      const courseObj = (db.courses || []).find((c) => c._id === user.locked_course_id || c.name === user.locked_course_id);
      const courseSubjects = courseObj?.subjects && courseObj.subjects.length > 0
        ? courseObj.subjects
        : ['Physics', 'Chemistry', 'Mathematics'];

      let questions = (db.questions || []).filter((q) => {
        if (q.is_active === false) return false;
        return String(q.course_id) === String(user.locked_course_id) || String(q.course_id) === String(courseObj?._id);
      });

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

    const courseObj = await Course.findById(user.locked_course_id);
    const courseSubjects = courseObj?.subjects && courseObj.subjects.length > 0
      ? courseObj.subjects
      : ['Physics', 'Chemistry', 'Mathematics'];

    const query: any = { is_active: true };
    if (subject) {
      query.topic_tag = { $regex: subject, $options: 'i' };
    }
    if (topic) {
      query.topic_tag = topic;
    }

    const allDbQuestions = await Question.find(query);
    const questions = allDbQuestions.filter((q: any) => {
      return String(q.course_id) === String(user.locked_course_id) || String(q.course_id) === String(courseObj?._id);
    });

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
