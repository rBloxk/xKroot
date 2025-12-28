import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { updateLastActive } from './auth/activity'

export interface AuthUser {
  id: string
  email: string
  username?: string
}

export interface UserAuth {
  id: string
  email: string
  full_name?: string | null
}

// Verify admin authentication (existing function)
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Get the session token from cookies or Authorization header
    const accessToken = request.cookies.get('sb-access-token')?.value ||
                       request.cookies.get('supabase-auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return null
    }

    // Verify the session using admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)

    if (error || !user) {
      return null
    }

    // Check if user is an admin by checking the admins table
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('username, email')
      .eq('id', user.id)
      .single()

    if (!admin) {
      return null
    }

    return {
      id: user.id,
      email: admin.email || user.email || '',
      username: admin.username,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Verify regular user authentication
export async function verifyUserAuth(request: NextRequest): Promise<UserAuth | null> {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:59',message:'verifyUserAuth entry',data:{hasCookies:!!request.cookies},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Get the session token from cookies or Authorization header
    const sbAccessToken = request.cookies.get('sb-access-token')?.value
    const supabaseAuthToken = request.cookies.get('supabase-auth-token')?.value
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.replace('Bearer ', '')
    
    const accessToken = sbAccessToken || supabaseAuthToken || bearerToken

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:67',message:'Token retrieval',data:{hasSbAccessToken:!!sbAccessToken,hasSupabaseAuthToken:!!supabaseAuthToken,hasAuthHeader:!!authHeader,hasAccessToken:!!accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!accessToken) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:70',message:'No access token found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return null
    }

    // Verify the session using admin client
    let { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken)
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:74',message:'getUser result',data:{hasUser:!!user,hasError:!!error,errorMessage:error?.message,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // If token is expired, try to refresh it
    if (error && (error.message?.includes('expired') || error.message?.includes('invalid JWT'))) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:77',message:'Token expired/invalid, attempting refresh',data:{errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const refreshToken = request.cookies.get('sb-refresh-token')?.value
      
      if (refreshToken) {
        try {
          // Create a temporary client to refresh the session
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          
          const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          })
          
          // Refresh the session
          const { data: refreshData, error: refreshError } = await tempClient.auth.refreshSession({
            refresh_token: refreshToken,
          })
          
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:95',message:'Refresh session result',data:{hasRefreshData:!!refreshData?.session,hasRefreshError:!!refreshError,refreshErrorMessage:refreshError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          if (refreshData?.session && !refreshError) {
            // Retry getUser with the new access token
            const newAccessToken = refreshData.session.access_token
            const retryResult = await supabaseAdmin.auth.getUser(newAccessToken)
            
            // #region agent log
            fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:102',message:'Retry getUser after refresh',data:{hasUser:!!retryResult.data?.user,hasError:!!retryResult.error,userId:retryResult.data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            if (retryResult.data?.user && !retryResult.error) {
              user = retryResult.data.user
              error = null
            }
          }
        } catch (refreshErr) {
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:109',message:'Refresh failed',data:{error:refreshErr instanceof Error?refreshErr.message:String(refreshErr)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:112',message:'No refresh token available',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
    }

    if (error || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:115',message:'verifyUserAuth returning null',data:{hasError:!!error,hasUser:!!user,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return null
    }

    // Get user profile if it exists
    let fullName = null
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        fullName = profile.full_name
      }
      // Fallback to user metadata if profile doesn't have full_name
      if (!fullName) {
        fullName = user.user_metadata?.full_name || null
      }
    } catch (error) {
      // Profiles table might not exist, use metadata instead
      fullName = user.user_metadata?.full_name || null
    }

    // Update last_active timestamp (non-blocking)
    updateLastActive(user.id).catch(err => {
      console.error('Failed to update last_active:', err)
    })

    const result = {
      id: user.id,
      email: user.email || '',
      full_name: fullName,
    }
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:145',message:'verifyUserAuth returning user',data:{userId:result.id,email:result.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/701b9f22-89dc-4f0d-8a15-aed1153bb495',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/auth.ts:151',message:'verifyUserAuth exception',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('User auth verification error:', error)
    return null
  }
}

