/**
 * Helper function to create notifications
 * This can be called from anywhere in the application
 */

import { supabaseAdmin } from '@/lib/supabase'

export interface NotificationData {
  user_id: string
  notification_type: string
  title: string
  message: string
  link_url?: string
  metadata?: any
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: NotificationData): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('notification')
      .insert({
        user_id: data.user_id,
        notification_type: data.notification_type,
        title: data.title,
        message: data.message,
        link_url: data.link_url || null,
        metadata: data.metadata || null,
      })

    if (error) {
      console.error('Error creating notification:', error)
      // Don't throw - notifications are non-critical
    }
  } catch (error) {
    console.error('Unexpected error creating notification:', error)
    // Don't throw - notifications are non-critical
  }
}

/**
 * Create notification when match is found
 */
export async function notifyMatchFound(
  candidateId: string,
  jobId: string,
  jobTitle: string,
  companyName: string,
  matchScore: number
): Promise<void> {
  // Get candidate user_id
  const { data: candidate } = await supabaseAdmin
    .from('candidate_profile')
    .select('user_id')
    .eq('id', candidateId)
    .single()

  if (candidate) {
    await createNotification({
      user_id: candidate.user_id,
      notification_type: 'match_found',
      title: 'New Job Match Found!',
      message: `You have a ${matchScore}% match for ${jobTitle} at ${companyName}`,
      link_url: `/jobs/${jobId}`,
      metadata: {
        job_id: jobId,
        match_score: matchScore,
      },
    })
  }
}

/**
 * Create notification when application is received
 */
export async function notifyApplicationReceived(
  companyUserId: string,
  candidateName: string,
  jobTitle: string,
  applicationId: string
): Promise<void> {
  await createNotification({
    user_id: companyUserId,
    notification_type: 'application_received',
    title: 'New Application Received',
    message: `${candidateName} applied for ${jobTitle}`,
    link_url: `/company/applications/${applicationId}`,
    metadata: {
      application_id: applicationId,
    },
  })
}

/**
 * Create notification when application status changes
 */
export async function notifyApplicationStatusChanged(
  candidateUserId: string,
  jobTitle: string,
  companyName: string,
  newStatus: string,
  jobId: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    shortlisted: 'You have been shortlisted',
    interview_scheduled: 'Interview scheduled',
    offer_extended: 'Congratulations! You received an offer',
    rejected: 'Application status updated',
  }

  await createNotification({
    user_id: candidateUserId,
    notification_type: 'application_status_changed',
    title: 'Application Status Updated',
    message: `${statusMessages[newStatus] || 'Status changed'} for ${jobTitle} at ${companyName}`,
    link_url: `/candidate/applications`,
    metadata: {
      job_id: jobId,
      new_status: newStatus,
    },
  })
}

