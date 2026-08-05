import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Question, Attempt, XPTransaction } from '@/lib/models';
import { readSharedDb, writeSharedDb, generateId } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { answers, topicTag, type } = await req.json();

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => String(u._id) === String(auth.userId));
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      let correctCount = 0;
      let xpEarned = 0;
      const processedResponses: any[] = [];

      for (const ans of (answers || [])) {
        const q = (db.questions || []).find((item) => String(item._id) === String(ans.questionId));
        if (q) {
          const isCorrect = Number(ans.selectedOption) === Number(q.correct_option);
          if (isCorrect) {
            correctCount++;
            xpEarned += 27;
          }
          processedResponses.push({
            question_id: q._id,
            selected_option: ans.selectedOption,
            is_correct: isCorrect,
          });
        }
      }

      const totalQuestions = answers.length;
      const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      const attempt = {
        _id: generateId(),
        student_id: user._id,
        course_id: user.locked_course_id,
        type: type || 'practice',
        topic_tag: topicTag || 'General',
        responses: processedResponses,
        score: correctCount,
        accuracy: accuracyPercent,
        submission_type: 'manual',
        created_at: new Date().toISOString(),
      };

      if (!db.attempts) db.attempts = [];
      db.attempts.push(attempt);

      if (xpEarned > 0) {
        user.xp_total = (user.xp_total || 0) + xpEarned;
        if (!db.xpTransactions) db.xpTransactions = [];
        db.xpTransactions.push({
          _id: generateId(),
          student_id: user._id,
          attempt_id: attempt._id,
          xp_amount: xpEarned,
          reason: `+${xpEarned} XP for practice set (${correctCount} correct answers)`,
          created_at: new Date().toISOString(),
        });
      }

      writeSharedDb(db);

      return NextResponse.json({
        success: true,
        attempt,
        correctCount,
        totalQuestions,
        accuracyPercent,
        xpEarned,
        newXpTotal: user.xp_total || 0,
      });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    let correctCount = 0;
    let xpEarned = 0;
    const processedResponses: any[] = [];

    for (const ans of (answers || [])) {
      let q: any = null;
      try {
        q = await Question.findById(ans.questionId);
      } catch (e) {
        q = null;
      }
      if (q) {
        const isCorrect = Number(ans.selectedOption) === Number(q.correct_option);
        if (isCorrect) {
          correctCount++;
          xpEarned += 27;
        }
        processedResponses.push({
          question_id: q._id,
          selected_option: ans.selectedOption,
          is_correct: isCorrect,
        });
      }
    }

    const totalQuestions = answers.length;
    const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const attempt = await Attempt.create({
      student_id: user._id,
      course_id: user.locked_course_id,
      type: type || 'practice',
      topic_tag: topicTag || 'General',
      responses: processedResponses,
      score: correctCount,
      accuracy: accuracyPercent,
      submission_type: 'manual',
      started_at: new Date(),
      submitted_at: new Date(),
    });

    if (xpEarned > 0) {
      user.xp_total = (user.xp_total || 0) + xpEarned;
      await user.save();
      await XPTransaction.create({
        student_id: user._id,
        attempt_id: attempt._id,
        xp_amount: xpEarned,
        reason: `+${xpEarned} XP for practice set (${correctCount} correct answers)`,
      });
    }

    return NextResponse.json({
      success: true,
      attempt,
      correctCount,
      totalQuestions,
      accuracyPercent,
      xpEarned,
      newXpTotal: user.xp_total || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
