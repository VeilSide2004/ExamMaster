import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Fetch user's friends leaderboard or search registered students
export async function GET(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();

    if (isMemoryMode) {
      const db = readSharedDb();
      const currentUser = (db.users || []).find((u) => u._id === auth.userId);
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const friendsIds: string[] = currentUser.friends || [];

      // If search query is provided, search all registered users excluding current user and already added friends
      if (searchQuery) {
        const matches = (db.users || [])
          .filter((u) => u._id !== currentUser._id)
          .filter((u) => 
            (u.name || '').toLowerCase().includes(searchQuery) || 
            (u.email || '').toLowerCase().includes(searchQuery)
          )
          .map((u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            xp_total: u.xp_total || 0,
            isAlreadyFriend: friendsIds.includes(u._id),
          }));

        return NextResponse.json({ searchResults: matches.slice(0, 10) });
      }

      // Return Friends Leaderboard (currentUser + friends)
      const allFriendsObjs = (db.users || [])
        .filter((u) => u._id === currentUser._id || friendsIds.includes(u._id))
        .sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));

      const leaderboard = allFriendsObjs.map((u, idx) => ({
        rank: idx + 1,
        id: u._id,
        name: u.name,
        email: u.email,
        xp_total: u.xp_total || 0,
        isSelf: u._id === currentUser._id,
      }));

      const pendingRequests = (currentUser.friendRequests || [])
        .filter((r: any) => r.status === 'pending')
        .map((r: any) => ({
          requesterId: r.requesterId,
          name: r.requesterName,
          email: r.requesterEmail,
          xp_total: r.requesterXp || 0,
          created_at: r.created_at,
        }));

      return NextResponse.json({
        friendsLeaderboard: leaderboard,
        pendingRequests,
        inviteCode: currentUser._id.slice(0, 8).toUpperCase(),
        totalFriends: friendsIds.length,
      });
    }

    // Mongoose mode
    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const friendsIds: string[] = currentUser.friends || [];

    if (searchQuery) {
      const matches = await User.find({
        _id: { $ne: currentUser._id },
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
        ],
      })
        .select('name email xp_total')
        .limit(10);

      const searchResults = matches.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        xp_total: u.xp_total || 0,
        isAlreadyFriend: friendsIds.includes(u._id.toString()),
      }));

      return NextResponse.json({ searchResults });
    }

    // Fetch currentUser + friends
    const idsToFetch = [currentUser._id, ...friendsIds];
    const friendUsers = await User.find({ _id: { $in: idsToFetch } })
      .sort({ xp_total: -1 })
      .select('name email xp_total');

    const leaderboard = friendUsers.map((u, idx) => ({
      rank: idx + 1,
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      xp_total: u.xp_total || 0,
      isSelf: u._id.toString() === currentUser._id.toString(),
    }));

    const pendingRequests = (currentUser.friendRequests || [])
      .filter((r: any) => r.status === 'pending')
      .map((r: any) => ({
        requesterId: r.requesterId,
        name: r.requesterName,
        email: r.requesterEmail,
        xp_total: r.requesterXp || 0,
        created_at: r.created_at,
      }));

    return NextResponse.json({
      friendsLeaderboard: leaderboard,
      pendingRequests,
      inviteCode: currentUser._id.toString().slice(0, 8).toUpperCase(),
      totalFriends: friendsIds.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a friend by friendId or email
export async function POST(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const friendIdToAdd = body.friendId;

    if (!friendIdToAdd) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    if (friendIdToAdd === auth.userId) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const userIndex = (db.users || []).findIndex((u) => u._id === auth.userId);
      if (userIndex === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const targetFriend = (db.users || []).find((u) => u._id === friendIdToAdd || u.email === friendIdToAdd);
      if (!targetFriend) {
        return NextResponse.json({ error: 'Registered student not found' }, { status: 404 });
      }

      const friends: string[] = db.users[userIndex].friends || [];
      if (!friends.includes(targetFriend._id)) {
        friends.push(targetFriend._id);
        db.users[userIndex].friends = friends;
        writeSharedDb(db);
      }

      return NextResponse.json({ success: true, message: `Added ${targetFriend.name} to your friends leaderboard!` });
    }

    // Mongoose mode
    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetFriend = await User.findOne({
      $or: [{ _id: friendIdToAdd }, { email: friendIdToAdd }],
    });

    if (!targetFriend) {
      return NextResponse.json({ error: 'Registered student not found' }, { status: 404 });
    }

    const currentFriends: string[] = currentUser.friends || [];
    if (!currentFriends.includes(targetFriend._id.toString())) {
      currentFriends.push(targetFriend._id.toString());
      currentUser.friends = currentFriends;
      await currentUser.save();
    }

    return NextResponse.json({ success: true, message: `Added ${targetFriend.name} to your friends leaderboard!` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a friend from friends leaderboard
export async function DELETE(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendIdToRemove = searchParams.get('friendId');

    if (!friendIdToRemove) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const userIndex = (db.users || []).findIndex((u) => u._id === auth.userId);
      if (userIndex !== -1 && db.users[userIndex].friends) {
        db.users[userIndex].friends = db.users[userIndex].friends.filter((id: string) => id !== friendIdToRemove);
        writeSharedDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // Mongoose mode
    const currentUser = await User.findById(auth.userId);
    if (currentUser && currentUser.friends) {
      currentUser.friends = currentUser.friends.filter((id: string) => id !== friendIdToRemove);
      await currentUser.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
