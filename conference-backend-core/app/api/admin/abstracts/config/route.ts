import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'

const CONFIG_TYPE = 'abstracts'
const CONFIG_KEY = 'settings'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }
    await connectDB()
    const config = await Configuration.findOne({ type: CONFIG_TYPE, key: CONFIG_KEY })
    return NextResponse.json({ success: true, data: config?.value || defaultAbstractsSettings })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    await connectDB()
    const updated = await Configuration.findOneAndUpdate(
      { type: CONFIG_TYPE, key: CONFIG_KEY },
      { type: CONFIG_TYPE, key: CONFIG_KEY, value: body, isActive: true },
      { upsert: true, new: true }
    )
    return NextResponse.json({ success: true, data: updated.value })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}


