import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

// GET: Resolve joinCode details and request status for authenticated user
export async function GET(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    
    const { searchParams } = new URL(request.url);
    const joinCode = (searchParams.get('joinCode') || '').trim().toUpperCase();

    if (!joinCode) {
      return NextResponse.json({ error: 'joinCode is required' }, { status: 400 });
    }

    if (isMemoryMode) {
      const db = readSharedDb();
      const hostUser = (db.users || []).find(
        (u) => u._id.slice(0, 8).toUpperCase() === joinCode
      );

      if (!hostUser) {
        return NextResponse.json({ error: 'Invalid invite link or host user not found' }, { status: 440 });
      }

      if (!auth) {
        return NextResponse.json({
          hostUser: { name: hostUser.name, email: hostUser.email },
          status: 'unauthenticated',
        });
      }

      const currentUser = (db.users || []).find((u) => u._id === auth.userId);
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (hostUser._id === currentUser._id) {
        return NextResponse.json({
          hostUser: { name: hostUser.name, email: hostUser.email },
          status: 'self',
        });
      }

      const hostFriends: string[] = hostUser.friends || [];
      if (hostFriends.includes(currentUser._id)) {
        return NextResponse.json({
          hostUser: { name: hostUser.name, email: hostUser.email },
          status: 'already_friends',
        });
      }

      const existingReq = (hostUser.friendRequests || []).find(
        (r: any) => r.requesterId === currentUser._id && r.status === 'pending'
      );

      if (existingReq) {
        return NextResponse.json({
          hostUser: { name: hostUser.name, email: hostUser.email },
          status: 'pending',
        });
      }

      return NextResponse.json({
        hostUser: { name: hostUser.name, email: hostUser.email },
        status: 'can_request',
      });
    }

    // Mongoose Mode
    const allUsers = await User.find({}).select('name email friends friendRequests');
    const hostUser = allUsers.find(
      (u) => u._id.toString().slice(0, 8).toUpperCase() === joinCode
    );

    if (!hostUser) {
      return NextResponse.json({ error: 'Invalid invite link or host user not found' }, { status: 404 });
    }

    if (!auth) {
      return NextResponse.json({
        hostUser: { name: hostUser.name, email: hostUser.email },
        status: 'unauthenticated',
      });
    }

    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (hostUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({
        hostUser: { name: hostUser.name, email: hostUser.email },
        status: 'self',
      });
    }

    const hostFriends: string[] = hostUser.friends || [];
    if (hostFriends.includes(currentUser._id.toString())) {
      return NextResponse.json({
        hostUser: { name: hostUser.name, email: hostUser.email },
        status: 'already_friends',
      });
    }

    const existingReq = (hostUser.friendRequests || []).find(
      (r: any) => r.requesterId === currentUser._id.toString() && r.status === 'pending'
    );

    if (existingReq) {
      return NextResponse.json({
        hostUser: { name: hostUser.name, email: hostUser.email },
        status: 'pending',
      });
    }

    return NextResponse.json({
      hostUser: { name: hostUser.name, email: hostUser.email },
      status: 'can_request',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Send join request to host user by joinCode
export async function POST(request: Request) {
  try {
    const { isMemoryMode } = await dbConnect();
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please login or register first.' }, { status: 401 });
    }

    const { joinCode } = await request.json();
    if (!joinCode) {
      return NextResponse.json({ error: 'joinCode is required' }, { status: 400 });
    }

    const cleanCode = joinCode.trim().toUpperCase();

    if (isMemoryMode) {
      const db = readSharedDb();
      const hostIndex = db.users.findIndex(
        (u) => u._id.slice(0, 8).toUpperCase() === cleanCode
      );

      if (hostIndex === -1) {
        return NextResponse.json({ error: 'Host user not found for this invite link' }, { status: 404 });
      }

      const hostUser = db.users[hostIndex];
      const currentUser = db.users.find((u) => u._id === auth.userId);

      if (!currentUser) {
        return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
      }

      if (hostUser._id === currentUser._id) {
        return NextResponse.json({ error: 'You cannot send a join request to yourself' }, { status: 400 });
      }

      const hostFriends: string[] = hostUser.friends || [];
      if (hostFriends.includes(currentUser._id)) {
        return NextResponse.json({ message: 'You are already in this user\'s friends arena!', status: 'already_friends' });
      }

      const requests: any[] = hostUser.friendRequests || [];
      const existingReq = requests.find((r) => r.requesterId === currentUser._id && r.status === 'pending');

      if (!existingReq) {
        requests.push({
          requesterId: currentUser._id,
          requesterName: currentUser.name,
          requesterEmail: currentUser.email,
          requesterXp: currentUser.xp_total || 0,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        db.users[hostIndex].friendRequests = requests;
        writeSharedDb(db);
      }

      return NextResponse.json({
        success: true,
        message: `Join request sent to ${hostUser.name}! Waiting for them to accept.`,
        hostName: hostUser.name,
      });
    }

    // Mongoose mode
    const allUsers = await User.find({});
    const hostUser = allUsers.find(
      (u) => u._id.toString().slice(0, 8).toUpperCase() === cleanCode
    );

    if (!hostUser) {
      return NextResponse.json({ error: 'Host user not found for this invite link' }, { status: 404 });
    }

    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    if (hostUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ error: 'You cannot send a join request to yourself' }, { status: 400 });
    }

    const hostFriends: string[] = hostUser.friends || [];
    if (hostFriends.includes(currentUser._id.toString())) {
      return NextResponse.json({ message: 'You are already in this user\'s friends arena!', status: 'already_friends' });
    }

    const requests = hostUser.friendRequests || [];
    const existingReq = requests.find(
      (r: any) => r.requesterId === currentUser._id.toString() && r.status === 'pending'
    );

    if (!existingReq) {
      requests.push({
        requesterId: currentUser._id.toString(),
        requesterName: currentUser.name,
        requesterEmail: currentUser.email,
        requesterXp: currentUser.xp_total || 0,
        status: 'pending',
        created_at: new Date(),
      } as any);
      hostUser.friendRequests = requests;
      await hostUser.save();
    }

    return NextResponse.json({
      success: true,
      message: `Join request sent to ${hostUser.name}! Waiting for them to accept.`,
      hostName: hostUser.name,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
