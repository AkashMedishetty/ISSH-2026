import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { createWriteStream, readFileSync, existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import { Readable } from 'stream'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }
    
    const userRole = (session.user as any)?.role
    if (userRole !== 'admin' && userRole !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Admin or reviewer access required' }, { status: 403 })
    }

    await connectDB()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const track = searchParams.get('track')

    const query: any = {}
    if (status && status !== 'all') query.status = status
    if (track && track !== 'all') query.track = track

    // If reviewer, only show assigned abstracts
    if (userRole === 'reviewer') {
      query.assignedReviewerIds = { $in: [(session.user as any).id] }
    }

    // Fetch abstracts with user details
    const abstracts = await Abstract.find(query)
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration.registrationId profile'
      })
      .sort({ submittedAt: -1 })
      .lean()

    // Create a temporary directory for the export
    const tempDir = path.join(process.cwd(), 'temp', 'exports')
    await mkdir(tempDir, { recursive: true })

    // Create CSV data
    const csvHeaders = [
      'Abstract ID',
      'Registration ID',
      'Submitter Name',
      'Email',
      'Title',
      'Track',
      'Authors',
      'Status',
      'Word Count',
      'Submitted At',
      'Initial File',
      'Final File',
      'Abstract Content'
    ]

    const csvRows = abstracts.map(abstract => {
      const user = abstract.userId as any
      return [
        abstract.abstractId,
        user?.registration?.registrationId || 'N/A',
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A',
        user?.email || 'N/A',
        `"${abstract.title.replace(/"/g, '""')}"`, // Escape quotes in CSV
        abstract.track,
        `"${abstract.authors.join(', ').replace(/"/g, '""')}"`,
        abstract.status,
        abstract.wordCount || 0,
        new Date(abstract.submittedAt).toISOString(),
        abstract.initial?.file?.originalName || 'N/A',
        abstract.final?.file?.originalName || 'N/A',
        `"${(abstract.initial?.notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"` // Escape and clean content
      ]
    })

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n')

    // Create ZIP archive in memory
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk) => chunks.push(chunk))
    archive.on('error', (err) => {
      throw err
    })

    // Add CSV file to archive
    archive.append(csvContent, { name: 'abstracts-data.csv' })

    // Add files to archive with proper naming
    for (const abstract of abstracts) {
      const user = abstract.userId as any
      const regId = user?.registration?.registrationId || 'UNKNOWN'
      
      // Add initial file if exists
      if (abstract.initial?.file?.storagePath && existsSync(abstract.initial.file.storagePath)) {
        try {
          const fileBuffer = readFileSync(abstract.initial.file.storagePath)
          const fileExtension = path.extname(abstract.initial.file.originalName)
          const fileName = `${regId}-${abstract.abstractId}-initial${fileExtension}`
          archive.append(fileBuffer, { name: `initial-files/${fileName}` })
        } catch (error) {
          console.error(`Failed to read initial file for ${abstract.abstractId}:`, error)
        }
      }

      // Add final file if exists
      if (abstract.final?.file?.storagePath && existsSync(abstract.final.file.storagePath)) {
        try {
          const fileBuffer = readFileSync(abstract.final.file.storagePath)
          const fileExtension = path.extname(abstract.final.file.originalName)
          const fileName = `${regId}-${abstract.abstractId}-final${fileExtension}`
          archive.append(fileBuffer, { name: `final-files/${fileName}` })
        } catch (error) {
          console.error(`Failed to read final file for ${abstract.abstractId}:`, error)
        }
      }
    }

    // Finalize the archive
    await archive.finalize()

    // Convert chunks to single buffer
    const zipBuffer = Buffer.concat(chunks)

    // Return the ZIP file
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `abstracts-export-${timestamp}.zip`

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, message: 'Export failed' },
      { status: 500 }
    )
  }
}


