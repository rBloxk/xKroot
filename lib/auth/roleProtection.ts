import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Require specific user roles to access a route
 * @param allowedRoles - Array of allowed user types
 * @returns Middleware function that checks user role
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user_type from database
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return NextResponse.json(
        { error: 'Failed to verify user role' },
        { status: 500 }
      )
    }

    const userType = userData.user_type

    if (!userType || !allowedRoles.includes(userType)) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
          your_role: userType || 'none',
        },
        { status: 403 }
      )
    }

    // User has required role, allow request to continue
    return null
  }
}

/**
 * Require a specific user type
 * @param userType - Required user type
 */
export function requireUserType(userType: string) {
  return requireRole([userType])
}

/**
 * Check if user has a specific role (non-blocking check)
 * Useful for conditional rendering in components
 */
export async function checkUserRole(userId: string, requiredRole: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return false
    }

    return data.user_type === requiredRole
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
}

