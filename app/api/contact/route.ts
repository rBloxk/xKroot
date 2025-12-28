import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message, inquiryType } = body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Save to database
    const { data, error } = await supabaseAdmin
      .from('contact_messages')
      .insert([
        {
          name,
          email,
          subject,
          message,
          inquiry_type: inquiryType || 'general',
          read: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // TODO: You can also send email notification here
    // Example with email service:
    // await sendEmail({
    //   to: getEmailForInquiryType(inquiryType),
    //   subject: `[${inquiryType}] ${subject}`,
    //   body: `From: ${name} (${email})\n\n${message}`,
    // })

    return NextResponse.json({
      message: "Your message has been sent successfully. We'll get back to you soon!",
      success: true,
    })
  } catch (error: any) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}

