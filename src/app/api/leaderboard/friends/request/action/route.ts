import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

// POST: Host accepts or declines a join request from another student
export async function POST(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requesterId, action } = await request.json();
    if (!requesterId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'requesterId and valid action (accept/decline) are required' }, { status: 400 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const hostIndex = db.users.findIndex((u) => u._id === auth.userId);
      const requesterIndex = db.users.findIndex((u) => u._id === requesterId);

      if (hostIndex === -1) {
        return NextResponse.json({ error: 'Host user not found' }, { status: 404 });
      }

      const hostUser = db.users[hostIndex];
      let hostRequests: any[] = hostUser.friendRequests || [];

      // Remove request from pending requests list
      db.users[hostIndex].friendRequests = hostRequests.filter((r) => r.requesterId !== requesterId);

      if (action === 'accept') {
        // Add requesterId to host's friends list
        const hostFriends: string[] = hostUser.friends || [];
        if (!hostFriends.includes(requesterId)) {
          hostFriends.push(requesterId);
          db.users[hostIndex].friends = hostFriends;
        }

        // Also add hostId to requester's friends list if requester exists
        if (requesterIndex !== -1) {
          const requesterFriends: string[] = db.users[requesterIndex].friends || [];
          if (!requesterFriends.includes(hostUser._id)) {
            requesterFriends.push(hostUser._id);
            db.users[requesterIndex].friends = requesterFriends;
          }
        }
      }

      writeSharedDb(db);

      const requesterName = requesterIndex !== -1 ? db.users[requesterIndex].name : 'Student';
      return NextResponse.json({
        success: true,
        message: action === 'accept' ? `Accepted ${requesterName}'s join request!` : `Declined join request`,
      });
    }

    // Mongoose mode
    const hostUser = await User.findById(auth.userId);
    const requesterUser = await User.findById(requesterId);

    if (!hostUser) {
      return NextResponse.json({ error: 'Host user not found' }, { status: 404 });
    }

    // Filter out the request
    hostUser.friendRequests = (hostUser.friendRequests || []).filter(
      (r) => r.requesterId !== requesterId
    );

    if (action === 'accept') {
      const hostFriends: string[] = hostUser.friends || [];
      if (!hostFriends.includes(requesterId)) {
        hostFriends.push(requesterId);
        hostUser.friends = hostFriends;
      }

      if (requesterUser) {
        const reqFriends: string[] = requesterUser.friends || [];
        if (!reqFriends.includes(hostUser._id.toString())) {
          reqFriends.push(hostUser._id.toString());
          requesterUser.friends = reqFriends;
          await requesterUser.save();
        }
      }
    }

    await hostUser.save();

    const requesterName = requesterUser ? requesterUser.name : 'Student';
    return NextResponse.json({
      success: true,
      message: action === 'accept' ? `Accepted ${requesterName}'s join request!` : `Declined join request`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
