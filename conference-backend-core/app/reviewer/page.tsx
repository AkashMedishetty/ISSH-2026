"use client"

import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { ReviewerDashboard } from '../../components/reviewer/ReviewerDashboard'
import { Navigation } from "../../components/Navigation"

export default function ReviewerPage() {
  return (
    <ProtectedRoute requiredRole="reviewer">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/20">
        <Navigation />
        
        <main className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h1 className="text-3xl font-bold text-purple-900 mb-2">
                  📋 Reviewer Portal
                </h1>
                <p className="text-purple-700">
                  Review assigned abstracts and provide detailed feedback to help maintain conference quality standards.
                </p>
              </div>
            </div>
            
            <ReviewerDashboard />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
