// Copyright (c) 2025 Ahmed Fahmy
// Developed at Ufuq.tech
// Licensed under the MIT License. See LICENSE file in the project root for full license information.

/**
 * API Middleware
 * Authentication and authorization helpers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookie, type User, type UserRole } from '@/lib/auth';
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'ieee_auth_token';

/**
 * Get authenticated user from request
 * @param _request Next.js request object (unused, for future extensibility)
 * @returns User object or null
 */
export async function getAuthUser(_request?: NextRequest): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return getUserFromCookie(token.value);
}

/**
 * Require authentication middleware
 * Returns user if authenticated, or error response
 */
export async function requireAuth(request: NextRequest): Promise<{ user: User } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return { user };
}

/**
 * Require specific role middleware
 * Returns user if authorized, or error response
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: UserRole
): Promise<{ user: User } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  const roleHierarchy: Record<UserRole, number> = {
    ChairMan: 3,
    highboard: 2,
    board: 1,
  };

  if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  return { user };
}

/**
 * Create authenticated API handler wrapper
 * @param handler API route handler function
 * @returns Wrapped handler with auth check
 */
export function withAuth(handler: (request: NextRequest, user: User) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult.user);
  };
}

/**
 * Create role-protected API handler wrapper
 * @param role Required role
 * @param handler API route handler function
 * @returns Wrapped handler with role check
 */
export function withRole(
  role: UserRole,
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireRole(request, role);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult.user);
  };
}

/**
 * Create multi-role protected API handler wrapper
 * @param roles Array of allowed roles
 * @param handler API route handler function
 * @returns Wrapped handler with role check
 */
export function withRoles(
  roles: UserRole[],
  handler: (request: NextRequest, user: User) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Check if user has one of the allowed roles
    if (!roles.includes(user.role)) {
      return NextResponse.json(
        { error: `Forbidden: Requires one of these roles: ${roles.join(', ')}` },
        { status: 403 }
      );
    }

    return handler(request, authResult.user);
  };
}
