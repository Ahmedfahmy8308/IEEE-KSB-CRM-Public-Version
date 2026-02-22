// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, issueJwt } from '@/lib/auth';
import { AUTH_COOKIE_NAME } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Verify credentials
    const user = await verifyCredentials(username, password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Issue JWT
    const token = issueJwt(user);

    // Create response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        committee: user.committee,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
