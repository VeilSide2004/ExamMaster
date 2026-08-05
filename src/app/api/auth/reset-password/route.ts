import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { User } from '@/lib/models';
import { readSharedDb, writeSharedDb } from '@/lib/sharedDb';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { isMemoryMode } = await dbConnect();

    if (isMemoryMode) {
      const db = readSharedDb();
      if (!db.users) db.users = [];

      const user = db.users.find((u) => u.email?.toLowerCase().trim() === lowerEmail);

      if (!user) {
        return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
      }

      user.password_hash = hashedPassword;
      writeSharedDb(db);

      return NextResponse.json({ success: true, message: 'Password updated successfully! You can now log in.' });
    }

    // Mongoose / Atlas Mode
    const user = await User.findOne({ email: lowerEmail });
    if (!user) {
      return NextResponse.json({ error: 'No account found with this email address' }, { status: 404 });
    }

    user.password_hash = hashedPassword;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully! You can now log in.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
