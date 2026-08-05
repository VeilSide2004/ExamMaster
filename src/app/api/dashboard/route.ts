import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Question, MockTest, Attempt, Course } from '@/lib/models';
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
      const user = (db.users || []).find((u) => String(u._id) === String(auth.userId));
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ needsCourseSelection: true }, { status: 200 });
      }

      const rawCourseId = user.locked_course_id;
      const courseId = typeof rawCourseId === 'object' && rawCourseId?._id ? String(rawCourseId._id) : String(rawCourseId);
      const lockedCourse = (db.courses || []).find((c) => String(c._id) === courseId) || (typeof rawCourseId === 'object' ? rawCourseId : null);

      const attempts = (db.attempts || []).filter((a) => String(a.student_id) === String(user._id) && String(a.course_id) === courseId);
      const attemptedQIds = new Set<string>();
      attempts.forEach((a) => {
        (a.responses || []).forEach((r: any) => attemptedQIds.add(String(r.question_id)));
      });

      const courseQs = (db.questions || []).filter((q) => String(q.course_id) === courseId && q.is_active !== false);
      const topicSet = new Set<string>();
      courseQs.forEach((q) => {
        if (q.topic_tag) topicSet.add(q.topic_tag.trim());
      });

      const topicsList = Array.from(topicSet);
      let totalTopicCompletionSum = 0;

      topicsList.forEach((topicName) => {
        const topicQuestions = courseQs.filter(
          (q) =>
            (q.topic_tag || '').toLowerCase().includes(topicName.toLowerCase()) ||
            topicName.toLowerCase().includes((q.topic_tag || '').toLowerCase())
        );

        if (topicQuestions.length > 0) {
          let attemptedInTopic = 0;
          topicQuestions.forEach((q) => {
            if (attemptedQIds.has(String(q._id))) {
              attemptedInTopic++;
            }
          });
          totalTopicCompletionSum += Math.min(1, attemptedInTopic / topicQuestions.length);
        }
      });

      const progressPercent = topicsList.length > 0
        ? Math.min(100, Math.max(0, Math.round((totalTopicCompletionSum / topicsList.length) * 100)))
        : 0;

      const validCourseIds = getEquivalentCourseIds(String(courseId), db.courses || []);

      const mockTests = (db.mockTests || []).filter((m) => {
        const testCourseId = String(typeof m.course_id === 'object' ? m.course_id?._id : m.course_id);
        return validCourseIds.includes(testCourseId) && m.is_active;
      }).slice(0, 2);

      const leaderboardStudents = (db.users || [])
        .filter((u) => String(u.locked_course_id) === courseId && u.status === 'Active')
        .sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

      let rank = 1;
      for (let i = 0; i < leaderboardStudents.length; i++) {
        if (String(leaderboardStudents[i]._id) === String(user._id)) {
          rank = i + 1;
          break;
        }
      }

      return NextResponse.json({
        user: {
          name: user.name,
          email: user.email,
          xp_total: user.xp_total || 0,
          lockedCourse,
          progressPercent,
          rank: rank || 1,
        },
        mockTests,
        topLeaderboard: leaderboardStudents.slice(0, 3),
      });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ needsCourseSelection: true }, { status: 200 });
    }

    const rawCourseId = user.locked_course_id;
    const courseId = typeof rawCourseId === 'object' && rawCourseId?._id 
      ? rawCourseId._id.toString() 
      : rawCourseId.toString();

    let lockedCourse: any = null;
    if (typeof rawCourseId === 'object' && rawCourseId?.name) {
      lockedCourse = rawCourseId;
    } else {
      try {
        lockedCourse = await Course.findById(courseId);
      } catch (e) {
        lockedCourse = null;
      }
    }

    const courseQs = await Question.find({ course_id: courseId, is_active: true });
    const attempts = await Attempt.find({ student_id: user._id, course_id: courseId });
    const attemptedQIds = new Set<string>();
    attempts.forEach((a) => {
      a.responses.forEach((r) => attemptedQIds.add(r.question_id.toString()));
    });

    const topicSet = new Set<string>();
    courseQs.forEach((q) => {
      if (q.topic_tag) topicSet.add(q.topic_tag.trim());
    });

    const topicsList = Array.from(topicSet);
    let totalTopicCompletionSum = 0;

    topicsList.forEach((topicName) => {
      const topicQuestions = courseQs.filter(
        (q) =>
          (q.topic_tag || '').toLowerCase().includes(topicName.toLowerCase()) ||
          topicName.toLowerCase().includes((q.topic_tag || '').toLowerCase())
      );

      if (topicQuestions.length > 0) {
        let attemptedInTopic = 0;
        topicQuestions.forEach((q) => {
          if (attemptedQIds.has(q._id.toString())) {
            attemptedInTopic++;
          }
        });
        totalTopicCompletionSum += Math.min(1, attemptedInTopic / topicQuestions.length);
      }
    });

    const progressPercent = topicsList.length > 0
      ? Math.min(100, Math.max(0, Math.round((totalTopicCompletionSum / topicsList.length) * 100)))
      : 0;

    const allCourses = await Course.find({});
    const validCourseIds = getEquivalentCourseIds(courseId, allCourses);
    const mockTests = await MockTest.find({ course_id: { $in: validCourseIds }, is_active: true }).limit(2);

    const leaderboardStudents = await User.find({
      locked_course_id: courseId,
      status: 'Active',
    })
      .sort({ xp_total: -1, created_at: 1 })
      .select('name xp_total');

    let rank = 1;
    for (let i = 0; i < leaderboardStudents.length; i++) {
      if (leaderboardStudents[i]._id.toString() === user._id.toString()) {
        rank = i + 1;
        break;
      }
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        xp_total: user.xp_total,
        lockedCourse,
        progressPercent,
        rank: rank || 1,
      },
      mockTests,
      topLeaderboard: leaderboardStudents.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
