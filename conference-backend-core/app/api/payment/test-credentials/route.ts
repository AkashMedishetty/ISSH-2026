import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  const info = {
    keyId: keyId || 'NOT SET',
    keyIdLength: keyId?.length || 0,
    secretLength: keySecret?.length || 0,
    secretFirst4: keySecret?.substring(0, 4) || 'N/A',
    secretLast4: keySecret?.substring((keySecret?.length || 0) - 4) || 'N/A',
    keyIdPrefix: keyId?.substring(0, 9) || 'N/A', // rzp_live_ or rzp_test_
  }

  // Try a simple Razorpay API call
  try {
    const rz = new Razorpay({
      key_id: keyId!,
      key_secret: keySecret!
    })
    // Fetch orders with limit 1 — lightweight call to test auth
    const orders = await rz.orders.all({ count: 1 })
    return NextResponse.json({ 
      success: true, 
      message: 'Razorpay credentials are valid',
      credentials: info,
      testResult: `Found ${orders.items?.length ?? 0} orders`
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: 'Razorpay auth failed',
      credentials: info,
      error: {
        statusCode: error?.statusCode,
        description: error?.error?.description,
        code: error?.error?.code
      }
    }, { status: 401 })
  }
}
