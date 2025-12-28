import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      supabase: {
        connected: false,
        error: null,
      },
      database: {
        connected: false,
        error: null,
      },
    }

    // Test Supabase connection
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        // If table doesn't exist, that's okay - we just want to test the connection
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          results.supabase.connected = true
          results.supabase.message = 'Connected (table may not exist yet)'
        } else {
          results.supabase.error = error.message
        }
      } else {
        results.supabase.connected = true
        results.supabase.message = 'Successfully connected to Supabase'
      }
    } catch (error: any) {
      results.supabase.error = error.message || 'Connection failed'
    }

    // Test database connection with a simple query
    try {
      // Try to query a system table or any existing table
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1)

      if (error) {
        // If table doesn't exist, try querying information_schema
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          // Table doesn't exist, but connection works - try a different approach
          const { data: schemaData, error: schemaError } = await supabaseAdmin
            .from('information_schema.tables')
            .select('table_name')
            .limit(1)

          if (schemaError) {
            results.database.error = `Connection issue: ${schemaError.message}`
          } else {
            results.database.connected = true
            results.database.message = 'Database connected (users table may not exist yet)'
          }
        } else {
          results.database.error = error.message
        }
      } else {
        results.database.connected = true
        results.database.message = 'Database connection successful'
        results.database.tablesFound = true
      }
    } catch (error: any) {
      results.database.error = error.message || 'Database connection failed'
    }

    const allConnected = results.supabase.connected && results.database.connected

    return NextResponse.json(
      {
        success: allConnected,
        ...results,
      },
      { status: allConnected ? 200 : 503 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

