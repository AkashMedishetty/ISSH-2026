import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

// This route handles client-side uploads to Vercel Blob
// Files are uploaded directly from browser to Vercel Blob (bypasses 4.5MB serverless limit)
// Supports files up to 500MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate user before allowing upload
        // clientPayload contains registrationId for validation
        
        let registrationId = ''
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload)
            registrationId = payload.registrationId || ''
          } catch {
            registrationId = clientPayload
          }
        }

        if (registrationId) {
          await connectDB()
          const user = await User.findOne({
            'registration.registrationId': registrationId
          })
          
          if (!user) {
            throw new Error('Invalid registration ID')
          }
        }

        return {
          // Allow Word docs and PDFs up to 10MB
          allowedContentTypes: [
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/pdf', // .pdf
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            registrationId,
            uploadedAt: new Date().toISOString()
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called when upload completes
        // Note: This won't work on localhost - use ngrok for local testing
        console.log('✅ Blob upload completed:', blob.url)
        
        if (tokenPayload) {
          try {
            const payload = JSON.parse(tokenPayload)
            console.log('📋 Upload for registration:', payload.registrationId)
          } catch {
            // Ignore parse errors
          }
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
