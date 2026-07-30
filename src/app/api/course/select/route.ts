import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser, signUserToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json({ error: 'Course selection is required' }, { status: 400 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const user = (db.users || []).find((u) => u._id === auth.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (user.locked_course_id) {
        return NextResponse.json(
          { error: 'RULE-01 Violation: Your course selection is permanently locked and cannot be changed.' },
          { status: 403 }
        );
      }

      user.locked_course_id = courseId;
      writeSharedDb(db);

      const newToken = signUserToken({
        userId: user._id,
        email: user.email,
        name: user.name,
        lockedCourseId: courseId,
      });

      const response = NextResponse.json({ success: true, lockedCourseId: courseId });
      response.cookies.set('student_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // Mongoose mode
    const user = await User.findById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.locked_course_id) {
      return NextResponse.json(
        { error: 'RULE-01 Violation: Your course selection is permanently locked and cannot be changed.' },
        { status: 403 }
      );
    }

    user.locked_course_id = courseId;
    await user.save();

    const newToken = signUserToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      lockedCourseId: courseId,
    });

    const response = NextResponse.json({ success: true, lockedCourseId: courseId });
    response.cookies.set('student_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
