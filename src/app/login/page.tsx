'use client';

import React from 'react';
import { AuthView } from '@/components/auth/AuthView';

export default function StudentLoginPage() {
  return <AuthView initialMode="signin" />;
}
