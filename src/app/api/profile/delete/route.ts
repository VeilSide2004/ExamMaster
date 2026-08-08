import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    if (profileId === auth.userId) {
      return NextResponse.json({ error: 'Cannot delete active profile. Switch to another profile first.' }, { status: 400 });
    }

    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      const currentUser = (db.users || []).find((u) => u._id === auth.userId);
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const mainEmail = (currentUser.account_email || currentUser.email).toLowerCase();

      const targetProfile = (db.users || []).find((u) => u._id === profileId);
      if (!targetProfile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      if (targetProfile.email.toLowerCase() === mainEmail) {
        return NextResponse.json({ error: 'Cannot delete primary account profile' }, { status: 400 });
      }

      const targetAccountEmail = (targetProfile.account_email || '').toLowerCase();
      if (targetAccountEmail !== mainEmail) {
        return NextResponse.json({ error: 'Unauthorized profile deletion' }, { status: 403 });
      }

      db.users = db.users.filter((u) => u._id !== profileId);
      writeSharedDb(db);

      return NextResponse.json({ success: true });
    }

    // Mongoose Mode
    const currentUser = await User.findById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mainEmail = (currentUser.account_email || currentUser.email).toLowerCase();

    const targetProfile = await User.findById(profileId);
    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (targetProfile.email.toLowerCase() === mainEmail) {
      return NextResponse.json({ error: 'Cannot delete primary account profile' }, { status: 400 });
    }

    const targetAccountEmail = (targetProfile.account_email || '').toLowerCase();
    if (targetAccountEmail !== mainEmail) {
      return NextResponse.json({ error: 'Unauthorized profile deletion' }, { status: 403 });
    }

    targetProfile.status = 'Deleted';
    await targetProfile.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
