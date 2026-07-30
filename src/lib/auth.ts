import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'exammaster_super_secret_jwt_key_2026_student';

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  lockedCourseId?: string | null;
}

export function signUserToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyUserToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthenticatedUser(): UserPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get('student_token')?.value;
  if (!token) return null;
  return verifyUserToken(token);
}
