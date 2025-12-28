"use client"

import { ProtectedRoute } from '@/conference-backend-core/components/auth/ProtectedRoute'
import useSWR from 'swr'
import { useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ReviewerAbstractsPage() {
  const { data, mutate } = useSWR('/api/reviewer/abstracts', fetcher)
  const [submitting, setSubmitting] = useState<string | null>(null)

  async function submitReview(abstractId: string) {
    setSubmitting(abstractId)
    try {
      const res = await fetch('/api/reviewer/abstracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId,
          // Default example scores; UI sliders below allow editing before submit
          scores: { originality: 8, methodology: 8, relevance: 8, clarity: 8 },
          recommendation: 'accept',
          comments: 'Good paper.'
        })
      })
      await res.json()
      mutate()
    } finally {
      setSubmitting(null)
    }
  }

  async function submitReviewWith(abstractId: string, scores: any, recommendation: 'accept' | 'reject' | 'revise', comments: string) {
    setSubmitting(abstractId)
    try {
      const res = await fetch('/api/reviewer/abstracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abstractId, scores, recommendation, comments })
      })
      await res.json()
      mutate()
    } finally {
      setSubmitting(null)
    }
  }
  return (
    <ProtectedRoute requiredRole="reviewer">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-4">Assigned Abstracts</h1>
        <ul className="space-y-3">
          {(data?.data || []).map((a: any) => (
            <li key={a.abstractId} className="p-3 border rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.abstractId} · {a.track} {a.category ? `· ${a.category}` : ''}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                <label>Originality<input type="range" min="0" max="10" defaultValue={8} className="w-full" id={`orig-${a.abstractId}`} /></label>
                <label>Methodology<input type="range" min="0" max="10" defaultValue={8} className="w-full" id={`meth-${a.abstractId}`} /></label>
                <label>Relevance<input type="range" min="0" max="10" defaultValue={8} className="w-full" id={`rel-${a.abstractId}`} /></label>
                <label>Clarity<input type="range" min="0" max="10" defaultValue={8} className="w-full" id={`cla-${a.abstractId}`} /></label>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <select id={`rec-${a.abstractId}`} className="border p-1 rounded">
                  <option value="accept">Accept</option>
                  <option value="reject">Reject</option>
                  <option value="revise">Revise</option>
                </select>
                <input id={`com-${a.abstractId}`} placeholder="Comments" className="flex-1 border p-1 rounded" />
                <button disabled={!!submitting} onClick={() => {
                  const o = Number((document.getElementById(`orig-${a.abstractId}`) as HTMLInputElement).value)
                  const m = Number((document.getElementById(`meth-${a.abstractId}`) as HTMLInputElement).value)
                  const r = Number((document.getElementById(`rel-${a.abstractId}`) as HTMLInputElement).value)
                  const c = Number((document.getElementById(`cla-${a.abstractId}`) as HTMLInputElement).value)
                  const rec = (document.getElementById(`rec-${a.abstractId}`) as HTMLSelectElement).value
                  const com = (document.getElementById(`com-${a.abstractId}`) as HTMLInputElement).value
                  submitReviewWith(a.abstractId, { originality: o, methodology: m, relevance: r, clarity: c }, rec as any, com)
                }} className="px-3 py-1 bg-conference-primary text-white rounded">
                  {submitting === a.abstractId ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProtectedRoute>
  )
}


