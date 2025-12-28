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
    const imageType = formData.get('type') as string // 'logo' or 'cover'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!imageType || !['logo', 'cover'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "logo" or "cover"' },
        { status: 400 }
      )
    }

    // Validate file type (images only)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${imageType}-${Date.now()}.${fileExt}`
    const filePath = `company/${imageType}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check if bucket exists, create if it doesn't
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === 'xkroot-data')
    
    if (!bucketExists) {
      // Try to create the bucket
      const { error: createError } = await supabaseAdmin.storage.createBucket('xkroot-data', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
      })
      
      if (createError) {
        console.error('Bucket creation error:', createError)
        return NextResponse.json(
          { error: `Storage bucket 'xkroot-data' does not exist and could not be created. Please create it in Supabase Dashboard. Error: ${createError.message}` },
          { status: 500 }
        )
      }
    }

    // Upload to Supabase Storage - xkroot-data bucket
    const { data, error } = await supabaseAdmin.storage
      .from('xkroot-data')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true, // Allow overwriting existing files
      })

    if (error) {
      console.error('Upload error:', error)
      // Provide more specific error messages
      let errorMessage = error.message || 'Failed to upload file'
      if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket "xkroot-data" not found. Please create it in Supabase Dashboard → Storage.'
      } else if (error.message?.includes('new row violates row-level security')) {
        errorMessage = 'Permission denied. Please check storage bucket policies.'
      } else if (error.message?.includes('The resource already exists')) {
        // This shouldn't happen with upsert: true, but handle it anyway
        errorMessage = 'File already exists. Trying to update...'
      }
      return NextResponse.json(
        { error: errorMessage },
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

