import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { rateLimit } from '@/lib/middleware/rateLimiter'

// Error reporting endpoint
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for error reporting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // limit each IP to 50 error reports per windowMs
      keyGenerator: (req) => {
        // Use IP + User-Agent for more granular limiting
        const forwarded = req.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'
        return `error_report_${ip}_${Buffer.from(userAgent).toString('base64').substring(0, 10)}`
      }
    })

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Too many error reports. Please try again later.'
      }, { status: 429 })
    }

    const errorReport = await request.json()

    // Validate error report structure
    if (!errorReport.errorId || !errorReport.message) {
      return NextResponse.json({
        success: false,
        message: 'Invalid error report format'
      }, { status: 400 })
    }

    // Sanitize error report
    const sanitizedReport = {
      errorId: String(errorReport.errorId).substring(0, 100),
      message: String(errorReport.message).substring(0, 1000),
      stack: errorReport.stack ? String(errorReport.stack).substring(0, 5000) : null,
      componentStack: errorReport.componentStack ? String(errorReport.componentStack).substring(0, 5000) : null,
      timestamp: errorReport.timestamp || new Date().toISOString(),
      userAgent: errorReport.userAgent ? String(errorReport.userAgent).substring(0, 500) : null,
      url: errorReport.url ? String(errorReport.url).substring(0, 500) : null,
      reportedAt: new Date(),
      severity: classifyError(errorReport.message),
      resolved: false
    }

    await connectDB()

    // Store error report in database
    // You can create an ErrorReport model if needed
    console.error('Error Report Received:', {
      ...sanitizedReport,
      stack: sanitizedReport.stack ? '[STACK_TRACE_TRUNCATED]' : null
    })

    // In production, you might want to:
    // 1. Store in database for admin review
    // 2. Send to external monitoring service (Sentry, LogRocket, etc.)
    // 3. Alert administrators for critical errors

    if (sanitizedReport.severity === 'critical') {
      // Send immediate alert for critical errors
      console.error('CRITICAL ERROR REPORTED:', sanitizedReport.errorId)
      // You could integrate with email/Slack notifications here
    }

    return NextResponse.json({
      success: true,
      message: 'Error report received',
      errorId: sanitizedReport.errorId
    })

  } catch (error) {
    console.error('Error reporting endpoint failed:', error)
    
    // Don't fail completely - we don't want error reporting to cause more errors
    return NextResponse.json({
      success: false,
      message: 'Error reporting temporarily unavailable'
    }, { status: 500 })
  }
}

function classifyError(message: string): 'low' | 'medium' | 'high' | 'critical' {
  const lowerMessage = message.toLowerCase()
  
  // Critical errors that need immediate attention
  if (lowerMessage.includes('payment') || 
      lowerMessage.includes('database') ||
      lowerMessage.includes('authentication') ||
      lowerMessage.includes('security')) {
    return 'critical'
  }
  
  // High priority errors
  if (lowerMessage.includes('network') ||
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('failed to fetch')) {
    return 'high'
  }
  
  // Medium priority errors
  if (lowerMessage.includes('validation') ||
      lowerMessage.includes('form') ||
      lowerMessage.includes('ui')) {
    return 'medium'
  }
  
  // Default to low priority
  return 'low'
}