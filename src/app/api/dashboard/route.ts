import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Question, MockTest, Attempt } from '@/lib/models';
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
        return NextResponse.json({ needsCourseSelection: true }, { status: 200 });
      }

      const courseId = user.locked_course_id;
      const lockedCourse = (db.courses || []).find((c) => c._id === courseId) || null;

      const attempts = (db.attempts || []).filter((a) => a.student_id === user._id && a.course_id === courseId);
      const attemptedQIds = new Set<string>();
      attempts.forEach((a) => {
        (a.responses || []).forEach((r: any) => attemptedQIds.add(String(r.question_id)));
      });

      const courseQs = (db.questions || []).filter((q) => q.course_id === courseId && q.is_active !== false);
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

      const mockTests = (db.mockTests || []).filter((m) => m.course_id === courseId && m.is_active).slice(0, 2);

      const leaderboardStudents = (db.users || [])
        .filter((u) => u.locked_course_id === courseId && u.status === 'Active')
        .sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

      let rank = 1;
      for (let i = 0; i < leaderboardStudents.length; i++) {
        if (leaderboardStudents[i]._id === user._id) {
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
    const user = await User.findById(auth.userId).populate('locked_course_id');
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ needsCourseSelection: true }, { status: 200 });
    }

    const courseId = (user.locked_course_id as any)._id.toString();

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

    const mockTests = await MockTest.find({ course_id: courseId, is_active: true }).limit(2);

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
        lockedCourse: user.locked_course_id,
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
