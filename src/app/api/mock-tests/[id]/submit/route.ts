import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, MockTest, Course, Attempt, XPTransaction, Question } from '@/lib/models';
import { readSharedDb, writeSharedDb, generateId } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userAnswers, submissionType } = await req.json();

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => u._id === auth.userId);
      if (!user || !user.locked_course_id) {
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      const test = (db.mockTests || []).find((m) => m._id === params.id);
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }

      const course = (db.courses || []).find((c) => c._id === user.locked_course_id);
      const marksPerCorrect = course?.marking_scheme?.marks_per_correct || 4;
      const penaltyPerIncorrect = course?.marking_scheme?.penalty_per_incorrect || 1;

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let totalScore = 0;
      let xpEarned = 0;
      const processedResponses: any[] = [];

      const qList = (test.question_ids || []).map((qId: string) => (db.questions || []).find((q) => q._id === qId)).filter(Boolean);

      for (const q of qList) {
        const uAns = userAnswers[q._id];
        if (uAns && uAns.selectedOption !== null && uAns.selectedOption !== undefined && uAns.selectedOption >= 0) {
          const isCorrect = uAns.selectedOption === q.correct_option;
          if (isCorrect) {
            correctCount++;
            totalScore += marksPerCorrect;
            xpEarned += 27;
          } else {
            incorrectCount++;
            totalScore -= penaltyPerIncorrect;
          }
          processedResponses.push({
            question_id: q._id,
            selected_option: uAns.selectedOption,
            is_correct: isCorrect,
          });
        } else {
          unattemptedCount++;
        }
      }

      const totalAttempted = correctCount + incorrectCount;
      const accuracyPercent = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

      let cutoffBonusAwarded = false;
      if (totalScore >= test.cutoff_marks) {
        xpEarned += 100;
        cutoffBonusAwarded = true;
      }

      const attempt = {
        _id: generateId(),
        student_id: user._id,
        course_id: user.locked_course_id,
        test_id: test._id,
        type: 'mock',
        responses: processedResponses,
        score: Math.max(0, totalScore),
        accuracy: accuracyPercent,
        submission_type: submissionType || 'manual',
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
          reason: cutoffBonusAwarded ? `+${xpEarned} XP (Cutoff Bonus)` : `+${xpEarned} XP for Mock Test`,
          created_at: new Date().toISOString(),
        });
      }

      writeSharedDb(db);

      return NextResponse.json({
        success: true,
        result: {
          score: Math.max(0, totalScore),
          accuracyPercent,
          correctCount,
          incorrectCount,
          unattemptedCount,
          totalQuestions: qList.length,
          xpEarned,
          cutoffBonusAwarded,
          newXpTotal: user.xp_total || 0,
        },
      });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    const test = await MockTest.findById(params.id);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const rawQIds = (test.question_ids || []).map((q: any) => q._id?.toString() || q.toString());
    const populatedQs = await Question.find({ _id: { $in: rawQIds } });

    const qList = rawQIds
      .map((qId: string) => populatedQs.find((q: any) => q._id.toString() === qId || String(q._id) === qId))
      .filter(Boolean);

    const course = await Course.findById(user.locked_course_id);
    const marksPerCorrect = course?.marking_scheme?.marks_per_correct || 4;
    const penaltyPerIncorrect = course?.marking_scheme?.penalty_per_incorrect || 1;

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let totalScore = 0;
    let xpEarned = 0;
    const processedResponses: any[] = [];

    for (const q of qList) {
      if (!q) continue;
      const qId = (q._id as any)?.toString() || q.toString();
      const uAns = userAnswers[qId];
      if (uAns && uAns.selectedOption !== null && uAns.selectedOption !== undefined && uAns.selectedOption >= 0) {
        const isCorrect = Number(uAns.selectedOption) === Number(q.correct_option);
        if (isCorrect) {
          correctCount++;
          totalScore += marksPerCorrect;
          xpEarned += 27;
        } else {
          incorrectCount++;
          totalScore -= penaltyPerIncorrect;
        }
        processedResponses.push({
          question_id: q._id,
          selected_option: uAns.selectedOption,
          is_correct: isCorrect,
        });
      } else {
        unattemptedCount++;
      }
    }

    const totalAttempted = correctCount + incorrectCount;
    const accuracyPercent = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    let cutoffBonusAwarded = false;
    if (totalScore >= test.cutoff_marks) {
      xpEarned += 100;
      cutoffBonusAwarded = true;
    }

    const attempt = await Attempt.create({
      student_id: user._id,
      course_id: user.locked_course_id,
      test_id: test._id,
      type: 'mock',
      responses: processedResponses,
      score: Math.max(0, totalScore),
      accuracy: accuracyPercent,
      submission_type: submissionType || 'manual',
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
        reason: cutoffBonusAwarded ? `+${xpEarned} XP (Cutoff Bonus)` : `+${xpEarned} XP for Mock Test`,
      });
    }

    return NextResponse.json({
      success: true,
      result: {
        score: Math.max(0, totalScore),
        accuracyPercent,
        correctCount,
        incorrectCount,
        unattemptedCount,
        totalQuestions: qList.length,
        xpEarned,
        cutoffBonusAwarded,
        newXpTotal: user.xp_total || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
