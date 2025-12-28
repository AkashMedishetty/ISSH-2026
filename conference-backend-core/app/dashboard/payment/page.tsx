import { Metadata } from "next"
import { Suspense } from "react"
import { ProtectedRoute } from "@/conference-backend-core/components/auth/ProtectedRoute"
import { PaymentForm } from "@/conference-backend-core/components/payment/PaymentForm"
import { WorkshopPayment } from "@/conference-backend-core/components/payment/WorkshopPayment"
import { MainLayout } from "@/conference-backend-core/components/layout/MainLayout"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

export const metadata: Metadata = {
  title: `Payment | ${conferenceConfig.shortName}`,
  description: `Complete your ${conferenceConfig.shortName} conference registration payment`,
}

async function PaymentContent({ searchParams }: { searchParams: Promise<{ type?: string; paymentId?: string }> }) {
  const params = await searchParams
  const isWorkshopAddon = params.type === 'workshop-addon'
  
  if (isWorkshopAddon) {
    return <WorkshopPayment />
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Information</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your conference registration payment
          </p>
        </div>
        
        <PaymentForm />
      </div>
    </div>
  )
}

export default function PaymentPage({ searchParams }: { searchParams: Promise<{ type?: string; paymentId?: string }> }) {
  return (
    <ProtectedRoute>
      <MainLayout currentPage="payment" showSearch={true}>
        <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]">Loading...</div>}>
          <PaymentContent searchParams={searchParams} />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  )
}