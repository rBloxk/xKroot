import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyUserAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('type') as string // 'avatar', 'resume', 'portfolio', etc.

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!imageType || !['avatar', 'resume', 'portfolio', 'cover'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "avatar", "resume", "portfolio", or "cover"' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    const allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    const allowedTypes = imageType === 'resume' 
      ? [...allowedImageTypes, ...allowedDocumentTypes]
      : allowedImageTypes

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. ${imageType === 'resume' ? 'Images and PDF/DOC files are allowed for resumes.' : 'Only images are allowed.'}` },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for images, 20MB for resumes)
    const maxSize = imageType === 'resume' ? 20 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${imageType === 'resume' ? '20MB' : '10MB'} limit` },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${imageType}-${Date.now()}.${fileExt}`
    const filePath = `candidate/${imageType}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage - xkroot-data bucket
    const { data, error } = await supabaseAdmin.storage
      .from('xkroot-data')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting existing files
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('xkroot-data')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      fileName: fileName,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
