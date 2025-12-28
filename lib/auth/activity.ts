import { supabaseAdmin } from '@/lib/supabase'

/**
 * Update the last_active timestamp for a user
 * @param userId - The user's UUID
 */
export async function updateLastActive(userId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last_active:', error)
      // Don't throw - this is a non-critical operation
    }
  } catch (error) {
    console.error('Exception updating last_active:', error)
    // Don't throw - this is a non-critical operation
  }
}

