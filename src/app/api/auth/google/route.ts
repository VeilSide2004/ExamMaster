import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb, generateId } from '@/lib/sharedDb';
import { signUserToken } from '@/lib/auth';

function parseJwtPayload(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let email = body.email;
    let name = body.name;

    if (body.credential) {
      const payload = parseJwtPayload(body.credential);
      if (payload && payload.email) {
        email = payload.email;
        name = payload.name || payload.email.split('@')[0];
      }
    }

    email = (email || 'student.google@exammaster.com').toLowerCase();
    name = name || email.split('@')[0];

    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      if (!db.users) db.users = [];

      let user = db.users.find((u) => u.email?.toLowerCase() === email);

      if (!user) {
        // Auto-register Google student user
        user = {
          _id: generateId(),
          name,
          email,
          password_hash: 'google_oauth_authenticated',
          locked_course_id: db.courses && db.courses.length > 0 ? db.courses[0]._id : null,
          role: 'student',
          xp_total: 100,
          rank: 1,
          created_at: new Date().toISOString(),
        };
        db.users.push(user);
        writeSharedDb(db);
      }

      const token = signUserToken({
        userId: String(user._id),
        email: user.email,
        name: user.name,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          lockedCourseId: user.locked_course_id,
        },
      });

      response.cookies.set({
        name: 'student_token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // Mongoose Mode
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password_hash: 'google_oauth_authenticated',
        role: 'student',
        xp_total: 100,
      });
    }

    const token = signUserToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        lockedCourseId: user.locked_course_id ? user.locked_course_id.toString() : null,
      },
    });

    response.cookies.set({
      name: 'student_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Google authentication failed' }, { status: 500 });
  }
}
