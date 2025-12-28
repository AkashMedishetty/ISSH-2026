import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Configuration from '@/lib/models/Configuration'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id
  const userRole = (session.user as any).role

  try {
    const formData = await request.formData()
    const abstractId = String(formData.get('abstractId') || '')
    const stage = String(formData.get('stage') || 'initial') // 'initial' | 'final'
    const file = formData.get('file') as File | null

    if (!abstractId || !file) {
      return NextResponse.json({ success: false, message: 'abstractId and file are required' }, { status: 400 })
    }

    await connectDB()
    const cfg = await Configuration.findOne({ type: 'abstracts', key: 'settings' })
    const settings = cfg?.value || defaultAbstractsSettings

    const allowed = stage === 'final' ? settings.allowedFinalFileTypes : settings.allowedInitialFileTypes
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Invalid file type' }, { status: 400 })
    }

    const maxBytes = settings.maxFileSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json({ success: false, message: 'File too large' }, { status: 400 })
    }

    const abstract = await Abstract.findOne({ abstractId })
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Only owner or admin can upload
    const isOwner = String(abstract.userId) === String(userId)
    const isAdmin = userRole === 'admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // Persist file
    const uploadsRoot = path.join(process.cwd(), 'uploads', 'abstracts', abstractId, stage)
    ensureDirSync(uploadsRoot)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const storedName = `${Date.now()}_${safeName}`
    const storagePath = path.join(uploadsRoot, storedName)
    fs.writeFileSync(storagePath, buffer)

    const fileRecord = {
      originalName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
      storagePath,
      uploadedAt: new Date()
    }

    if (stage === 'final') {
      // Enforce acceptance before final upload unless admin
      if (abstract.status !== 'accepted' && !isAdmin) {
        return NextResponse.json({ success: false, message: 'Final upload allowed only after acceptance' }, { status: 400 })
      }
      abstract.final = {
        ...(abstract.final || {}),
        file: fileRecord,
        submittedAt: new Date(),
        displayId: `${abstract.abstractId}-F`
      }
      abstract.status = 'final-submitted'
    } else {
      abstract.initial = {
        ...(abstract.initial || {}),
        file: fileRecord
      }
      if (abstract.status === 'submitted') {
        // keep
      }
    }

    await abstract.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


