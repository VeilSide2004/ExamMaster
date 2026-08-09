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
        // Collect all existing members of host's arena group
        const currentArenaMembers = new Set<string>([hostUser._id, ...(hostUser.friends || []), requesterId]);

        if (requesterIndex !== -1 && db.users[requesterIndex].friends) {
          (db.users[requesterIndex].friends || []).forEach((fid: string) => currentArenaMembers.add(fid));
        }

        const arenaMembersList = Array.from(currentArenaMembers);

        // Update all members in this arena group so everyone has everyone else in their friends array
        arenaMembersList.forEach((memberId) => {
          const uIdx = db.users.findIndex((u) => u._id === memberId);
          if (uIdx !== -1) {
            const memberFriends = arenaMembersList.filter((id) => id !== memberId);
            db.users[uIdx].friends = Array.from(new Set([...(db.users[uIdx].friends || []), ...memberFriends]));
          }
        });
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
      const currentArenaMembers = new Set<string>([
        hostUser._id.toString(),
        ...(hostUser.friends || []),
        requesterId,
      ]);

      if (requesterUser && requesterUser.friends) {
        requesterUser.friends.forEach((fid: string) => currentArenaMembers.add(fid));
      }

      const arenaMembersList = Array.from(currentArenaMembers);

      // Update all members in this arena group so everyone has everyone else in their friends list
      await User.updateMany(
        { _id: { $in: arenaMembersList } },
        { $addToSet: { friends: { $each: arenaMembersList } } }
      );

      // Remove self-referential IDs from friends array for all updated users
      for (const mId of arenaMembersList) {
        await User.updateOne({ _id: mId }, { $pull: { friends: mId } });
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
