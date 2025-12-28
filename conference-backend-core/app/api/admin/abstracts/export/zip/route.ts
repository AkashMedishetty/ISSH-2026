import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') {
    return new Response(JSON.stringify({ success: false, message: 'Admin access required' }), { status: 403 })
  }

  await connectDB()
  const abstracts = await Abstract.find({}).lean()

  const { default: ExcelJS } = await import('exceljs')
  const { default: archiver } = await import('archiver')
  const { PassThrough } = await import('stream')

  // Build Excel workbook in-memory
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Abstracts')
  sheet.columns = [
    { header: 'Abstract ID', key: 'abstractId', width: 16 },
    { header: 'User ID', key: 'userId', width: 24 },
    { header: 'Registration ID', key: 'registrationId', width: 16 },
    { header: 'Track', key: 'track', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Subcategory', key: 'subcategory', width: 20 },
    { header: 'Title', key: 'title', width: 60 },
    { header: 'Authors', key: 'authors', width: 40 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Initial File', key: 'initialFile', width: 40 },
    { header: 'Final File', key: 'finalFile', width: 40 },
  ]
  for (const a of abstracts) {
    sheet.addRow({
      abstractId: a.abstractId,
      userId: String(a.userId),
      registrationId: a.registrationId,
      track: a.track,
      category: a.category || '',
      subcategory: a.subcategory || '',
      title: a.title,
      authors: (a.authors || []).join('; '),
      status: a.status,
      initialFile: a.initial?.file?.storagePath || '',
      finalFile: a.final?.file?.storagePath || ''
    })
  }
  const excelOut: unknown = await workbook.xlsx.writeBuffer()
  const excelBuffer: Buffer = Buffer.isBuffer(excelOut)
    ? (excelOut as Buffer)
    : Buffer.from(excelOut as ArrayBuffer)

  // Prepare streaming zip response
  const archive = archiver('zip', { zlib: { level: 9 } })
  const stream = new PassThrough()
  archive.on('error', (err: any) => {
    stream.emit('error', err)
  })

  // Append Excel
  archive.append(excelBuffer, { name: 'abstracts.xlsx' })

  // Append files if present
  for (const a of abstracts) {
    const base = path.join('abstracts', a.abstractId)
    const initial = a.initial?.file?.storagePath
    const final = a.final?.file?.storagePath
    if (initial && fs.existsSync(initial)) {
      const name = path.basename(initial)
      archive.file(initial, { name: path.join(base, 'initial', name) })
    }
    if (final && fs.existsSync(final)) {
      const name = path.basename(final)
      archive.file(final, { name: path.join(base, 'final', name) })
    }
  }

  archive.finalize()
  archive.pipe(stream)

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="abstracts_export.zip"'
    }
  })
}


