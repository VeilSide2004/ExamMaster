import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User, Notification } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Fetch student notifications (Personal + Course + Broadcast 'all')
export async function GET() {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const currentUser = (db.users || []).find((u) => u._id === auth.userId);
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userCourseId = currentUser.locked_course_id ? String(currentUser.locked_course_id) : null;

      // Filter notifications relevant to currentUser
      const allNotifs = (db.notifications || []).filter((n: any) => {
        if (n.targetType === 'user') {
          return String(n.targetUserId) === String(currentUser._id);
        }
        if (n.targetType === 'course' && userCourseId) {
          return String(n.targetCourseId) === userCourseId;
        }
        if (n.targetType === 'all') {
          return true;
        }
        return false;
      });

      // Sort newest first
      allNotifs.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const formatted = allNotifs.map((n: any) => {
        const readBy: string[] = n.readBy || [];
        return {
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type || 'announcement',
          isRead: readBy.includes(currentUser._id),
          created_at: n.created_at,
        };
      });

      const unreadCount = formatted.filter((n: any) => !n.isRead).length;

      return NextResponse.json({
        notifications: formatted,
        unreadCount,
      });
    }

    // Mongoose Mode
    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userIdStr = currentUser._id.toString();
    const userCourseId = currentUser.locked_course_id ? currentUser.locked_course_id.toString() : null;

    const query: any = {
      $or: [
        { targetType: 'all' },
        { targetType: 'user', targetUserId: userIdStr },
      ],
    };

    if (userCourseId) {
      query.$or.push({ targetType: 'course', targetCourseId: userCourseId });
    }

    const notifs = await Notification.find(query).sort({ created_at: -1 }).limit(30);

    const formatted = notifs.map((n) => {
      const readBy: string[] = n.readBy || [];
      return {
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type || 'announcement',
        isRead: readBy.includes(userIdStr),
        created_at: n.created_at,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mark notification(s) as read for current user
export async function POST(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (isMemoryMode) {
      const db = readSharedDb();
      if (!db.notifications) db.notifications = [];

      const currentUserId = auth.userId;

      if (markAll) {
        db.notifications.forEach((n: any) => {
          if (!n.readBy) n.readBy = [];
          if (!n.readBy.includes(currentUserId)) {
            n.readBy.push(currentUserId);
          }
        });
      } else if (notificationId) {
        const target = db.notifications.find((n: any) => String(n._id) === String(notificationId));
        if (target) {
          if (!target.readBy) target.readBy = [];
          if (!target.readBy.includes(currentUserId)) {
            target.readBy.push(currentUserId);
          }
        }
      }

      writeSharedDb(db);
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    // Mongoose Mode
    const userIdStr = auth.userId;

    if (markAll) {
      await Notification.updateMany(
        { readBy: { $ne: userIdStr } },
        { $addToSet: { readBy: userIdStr } }
      );
    } else if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        $addToSet: { readBy: userIdStr },
      });
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
