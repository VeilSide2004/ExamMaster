import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
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
        return NextResponse.json({ error: 'No course locked' }, { status: 400 });
      }

      const students = (db.users || [])
        .filter((u) => u.locked_course_id === user.locked_course_id && u.status === 'Active')
        .sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

      let userRank = 1;
      const formattedList = students.map((s, idx) => {
        if (s._id === user._id) {
          userRank = idx + 1;
        }
        return {
          rank: idx + 1,
          name: s.name,
          xp_total: s.xp_total || 0,
          isSelf: s._id === user._id,
        };
      });

      return NextResponse.json({
        leaderboard: formattedList.slice(0, 20),
        userRank: {
          rank: userRank,
          name: user.name,
          xp_total: user.xp_total || 0,
        },
      });
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user || !user.locked_course_id) {
      return NextResponse.json({ error: 'No course locked' }, { status: 400 });
    }

    const students = await User.find({
      locked_course_id: user.locked_course_id,
      status: 'Active',
    })
      .sort({ xp_total: -1, created_at: 1 })
      .select('name xp_total created_at');

    let userRank = 1;
    const formattedList = students.map((s, idx) => {
      if (s._id.toString() === user._id.toString()) {
        userRank = idx + 1;
      }
      return {
        rank: idx + 1,
        name: s.name,
        xp_total: s.xp_total || 0,
        isSelf: s._id.toString() === user._id.toString(),
      };
    });

    return NextResponse.json({
      leaderboard: formattedList.slice(0, 20),
      userRank: {
        rank: userRank,
        name: user.name,
        xp_total: user.xp_total || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
