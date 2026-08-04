import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Course } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const auth = getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => u._id === auth.userId);
      if (!user) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
      }

      const lockedCourse = (db.courses || []).find((c) => String(c._id) === String(user.locked_course_id)) || null;

      return NextResponse.json({
        authenticated: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          lockedCourse,
          xp_total: user.xp_total || 0,
          status: user.status,
        },
      });
    }

    // Mongoose Mode
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    let lockedCourse = null;
    if (user.locked_course_id) {
      lockedCourse = await Course.findById(user.locked_course_id);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        lockedCourse,
        xp_total: user.xp_total || 0,
        status: user.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
