import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'No file provided'
      }, { status: 400 })
    }

    // Validate file type based on upload type
    const allowedTypes: Record<string, string[]> = {
      'program-brochure': ['application/pdf'],
      'speaker-photo': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      'default': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }

    const validTypes = allowedTypes[type] || allowedTypes['default']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        message: `Invalid file type. Allowed types: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        message: 'File size must be less than 25MB'
      }, { status: 400 })
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()
    const timestamp = Date.now()
    const sanitizedType = type?.replace(/[^a-z0-9-]/gi, '_') || 'upload'
    const filename = `${sanitizedType}-${timestamp}.${fileExtension}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)

    // Write file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return URL
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type,
      message: 'File uploaded successfully'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
