import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET - Get platform analytics and statistics
 * Admin only
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAuth(request)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is admin
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', admin.id)
      .single()

    if (!user || user.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    // Get all analytics in parallel
    const [
      userStats,
      candidateStats,
      companyStats,
      jobStats,
      matchStats,
      applicationStats,
      recentActivity,
    ] = await Promise.all([
      getUserStats(),
      getCandidateStats(),
      getCompanyStats(),
      getJobStats(),
      getMatchStats(),
      getApplicationStats(),
      getRecentActivity(),
    ])

    return NextResponse.json({
      success: true,
      analytics: {
        users: userStats,
        candidates: candidateStats,
        companies: companyStats,
        jobs: jobStats,
        matches: matchStats,
        applications: applicationStats,
        recent_activity: recentActivity,
        generated_at: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Get user statistics
 */
async function getUserStats() {
  const { data: totalUsers } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })

  const { data: usersByType } = await supabaseAdmin
    .from('users')
    .select('user_type')
  
  const typeCounts = usersByType?.reduce((acc: any, user: any) => {
    acc[user.user_type] = (acc[user.user_type] || 0) + 1
    return acc
  }, {}) || {}

  // Get users created in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString())

  return {
    total: totalUsers?.length || 0,
    by_type: typeCounts,
    new_last_30_days: recentUsers?.length || 0,
  }
}

/**
 * Get candidate statistics
 */
async function getCandidateStats() {
  const { data: totalCandidates } = await supabaseAdmin
    .from('candidate_profile')
    .select('id', { count: 'exact', head: true })

  const { data: candidatesWithSkills } = await supabaseAdmin
    .from('candidate_skill')
    .select('candidate_id', { count: 'exact' })

  const uniqueCandidatesWithSkills = new Set(candidatesWithSkills?.map(s => s.candidate_id)).size

  const { data: availabilityStats } = await supabaseAdmin
    .from('candidate_profile')
    .select('availability_status')
  
  const availabilityCounts = availabilityStats?.reduce((acc: any, profile: any) => {
    acc[profile.availability_status] = (acc[profile.availability_status] || 0) + 1
    return acc
  }, {}) || {}

  return {
    total: totalCandidates?.length || 0,
    with_skills: uniqueCandidatesWithSkills,
    availability: availabilityCounts,
  }
}

/**
 * Get company statistics
 */
async function getCompanyStats() {
  const { data: totalCompanies } = await supabaseAdmin
    .from('company_profile')
    .select('id', { count: 'exact', head: true })

  const { data: companiesWithJobs } = await supabaseAdmin
    .from('role_requirement')
    .select('company_id', { count: 'exact' })

  const uniqueCompaniesWithJobs = new Set(companiesWithJobs?.map(j => j.company_id)).size

  const { data: sizeStats } = await supabaseAdmin
    .from('company_profile')
    .select('company_size')
  
  const sizeCounts = sizeStats?.reduce((acc: any, company: any) => {
    if (company.company_size) {
      acc[company.company_size] = (acc[company.company_size] || 0) + 1
    }
    return acc
  }, {}) || {}

  return {
    total: totalCompanies?.length || 0,
    with_jobs: uniqueCompaniesWithJobs,
    by_size: sizeCounts,
  }
}

/**
 * Get job statistics
 */
async function getJobStats() {
  const { data: totalJobs } = await supabaseAdmin
    .from('role_requirement')
    .select('id', { count: 'exact', head: true })

  const { data: jobsByStatus } = await supabaseAdmin
    .from('role_requirement')
    .select('status')
  
  const statusCounts = jobsByStatus?.reduce((acc: any, job: any) => {
    acc[job.status] = (acc[job.status] || 0) + 1
    return acc
  }, {}) || {}

  const { data: jobsByLevel } = await supabaseAdmin
    .from('role_requirement')
    .select('role_level')
  
  const levelCounts = jobsByLevel?.reduce((acc: any, job: any) => {
    if (job.role_level) {
      acc[job.role_level] = (acc[job.role_level] || 0) + 1
    }
    return acc
  }, {}) || {}

  // Total views and applications
  const { data: jobStats } = await supabaseAdmin
    .from('role_requirement')
    .select('views_count, applications_count')

  const totalViews = jobStats?.reduce((sum, job) => sum + (job.views_count || 0), 0) || 0
  const totalApplications = jobStats?.reduce((sum, job) => sum + (job.applications_count || 0), 0) || 0

  return {
    total: totalJobs?.length || 0,
    by_status: statusCounts,
    by_level: levelCounts,
    total_views: totalViews,
    total_applications: totalApplications,
  }
}

/**
 * Get match statistics
 */
async function getMatchStats() {
  const { data: totalMatches } = await supabaseAdmin
    .from('match_result')
    .select('id', { count: 'exact', head: true })

  const { data: matchesByStatus } = await supabaseAdmin
    .from('match_result')
    .select('match_status')
  
  const statusCounts = matchesByStatus?.reduce((acc: any, match: any) => {
    acc[match.match_status] = (acc[match.match_status] || 0) + 1
    return acc
  }, {}) || {}

  // Average match score
  const { data: matchScores } = await supabaseAdmin
    .from('match_result')
    .select('match_score')

  const avgScore = matchScores && matchScores.length > 0
    ? matchScores.reduce((sum, m) => sum + parseFloat(m.match_score || '0'), 0) / matchScores.length
    : 0

  // High-quality matches (score >= 80)
  const highQualityMatches = matchScores?.filter(m => parseFloat(m.match_score || '0') >= 80).length || 0

  return {
    total: totalMatches?.length || 0,
    by_status: statusCounts,
    average_score: Math.round(avgScore * 100) / 100,
    high_quality_matches: highQualityMatches,
  }
}

/**
 * Get application statistics
 */
async function getApplicationStats() {
  const { data: totalApplications } = await supabaseAdmin
    .from('application')
    .select('id', { count: 'exact', head: true })

  const { data: applicationsByStatus } = await supabaseAdmin
    .from('application')
    .select('application_status')
  
  const statusCounts = applicationsByStatus?.reduce((acc: any, app: any) => {
    acc[app.application_status] = (acc[app.application_status] || 0) + 1
    return acc
  }, {}) || {}

  // Applications in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { data: recentApplications } = await supabaseAdmin
    .from('application')
    .select('id', { count: 'exact', head: true })
    .gte('submitted_at', thirtyDaysAgo.toISOString())

  return {
    total: totalApplications?.length || 0,
    by_status: statusCounts,
    new_last_30_days: recentApplications?.length || 0,
  }
}

/**
 * Get recent activity
 */
async function getRecentActivity() {
  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('id, email, user_type, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentJobs } = await supabaseAdmin
    .from('role_requirement')
    .select('id, role_title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: recentApplications } = await supabaseAdmin
    .from('application')
    .select('id, application_status, submitted_at')
    .order('submitted_at', { ascending: false })
    .limit(10)

  return {
    recent_users: recentUsers || [],
    recent_jobs: recentJobs || [],
    recent_applications: recentApplications || [],
  }
}

