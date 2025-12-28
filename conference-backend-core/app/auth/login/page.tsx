import { Suspense } from "react"
import { Metadata } from "next"
import { LoginForm } from "@/conference-backend-core/components/auth/LoginForm"
import { MainLayout } from "@/conference-backend-core/components/layout/MainLayout"
import { Navigation } from "@/conference-backend-core/components/Navigation"
import { conferenceConfig } from "@/config/conference.config"

export const metadata: Metadata = {
  title: `Login | ${conferenceConfig.shortName}`,
  description: `Sign in to your ${conferenceConfig.shortName} conference account`,
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}