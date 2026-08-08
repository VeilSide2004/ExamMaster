import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Course } from '@/lib/models';
import { readSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const auth = getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      const currentUser = (db.users || []).find((u) => u._id === auth.userId);
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const mainEmail = (currentUser.account_email || currentUser.email).toLowerCase();

      // Find all profiles matching this main account email
      const family = (db.users || []).filter(
        (u) =>
          u.email.toLowerCase() === mainEmail ||
          (u.account_email && u.account_email.toLowerCase() === mainEmail) ||
          (currentUser.email.toLowerCase() === (u.account_email || '').toLowerCase())
      );

      const profiles = family.map((u) => {
        const lockedCourse = (db.courses || []).find((c) => String(c._id) === String(u.locked_course_id)) || null;
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          accountEmail: u.account_email || u.email,
          lockedCourseId: u.locked_course_id || null,
          lockedCourseName: lockedCourse?.name || null,
          isActive: u._id === auth.userId,
          isPrimary: u.email.toLowerCase() === mainEmail,
          xp_total: u.xp_total || 0,
        };
      });

      return NextResponse.json({ success: true, profiles });
    }

    // Mongoose mode
    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mainEmail = (currentUser.account_email || currentUser.email).toLowerCase();

    const family = await User.find({
      $or: [
        { email: mainEmail },
        { account_email: mainEmail },
      ],
      status: { $ne: 'Deleted' },
    }).lean();

    const courses = await Course.find({ is_active: true }).lean();
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c.name]));

    const profiles = family.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      accountEmail: u.account_email || u.email,
      lockedCourseId: u.locked_course_id ? u.locked_course_id.toString() : null,
      lockedCourseName: u.locked_course_id ? (courseMap.get(u.locked_course_id.toString()) || null) : null,
      isActive: u._id.toString() === auth.userId,
      isPrimary: u.email.toLowerCase() === mainEmail,
      xp_total: u.xp_total || 0,
    }));

    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
