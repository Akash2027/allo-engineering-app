'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.reservationId as string

  const [reservation, setReservation] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId])

  useEffect(() => {
    if (reservation?.expiresAt) {
      const interval = setInterval(() => {
        const expiry = new Date(reservation.expiresAt).getTime()
        const now = new Date().getTime()
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
        setTimeLeft(remaining)
        if (remaining === 0) setError('Reservation expired')
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [reservation])

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`)
      if (res.status === 410) {
        setError('Reservation expired')
        setLoading(false)
        return
      }
      const data = await res.json()
      setReservation(data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load reservation')
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setProcessing(true)
    const res = await fetch(`/api/reservations/${reservationId}/confirm`, { method: 'POST' })
    if (res.status === 410) {
      setError('Reservation expired')
    } else if (res.ok) {
      router.push('/?confirmed=true')
    } else {
      setError('Failed to confirm')
    }
    setProcessing(false)
  }

  const handleCancel = async () => {
    setProcessing(true)
    const res = await fetch(`/api/reservations/${reservationId}/release`, { method: 'POST' })
    if (res.ok) {
      router.push('/?cancelled=true')
    } else {
      setError('Failed to cancel')
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading reservation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  if (!reservation) return null

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const isExpiringSoon = timeLeft < 60
  const isUrgent = timeLeft < 30

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-light text-gray-900">Complete your reservation</h1>
          <p className="text-gray-500 text-sm mt-1">Confirm your purchase within the time limit</p>
        </div>
      </div>

      {/* Checkout Card */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Timer Section */}
          <div className={`text-center py-6 border-b ${isExpiringSoon ? 'bg-red-50' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Time remaining to confirm</p>
            <div className={`text-4xl font-mono font-medium ${isUrgent ? 'text-red-600 animate-pulse' : isExpiringSoon ? 'text-red-500' : 'text-gray-900'}`}>
              {mins}:{secs.toString().padStart(2, '0')}
            </div>
            {isExpiringSoon && (
              <p className="text-xs text-red-500 mt-2">⚠️ Reservation expiring soon</p>
            )}
          </div>

          {/* Reservation Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Product</span>
              <span className="text-gray-900 font-medium">{reservation.product?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Warehouse</span>
              <div className="text-right">
                <span className="text-gray-900 font-medium">{reservation.warehouse?.name}</span>
                <span className="text-gray-400 text-xs ml-2">{reservation.warehouse?.location}</span>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Quantity</span>
              <span className="text-gray-900 font-medium">1 unit</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={processing || timeLeft === 0}
              className="flex-1 bg-gray-900 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {processing ? 'Processing...' : 'Confirm purchase'}
            </button>
            <button
              onClick={handleCancel}
              disabled={processing}
              className="flex-1 border border-gray-300 bg-white text-gray-700 px-6 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="border-t border-red-200 bg-red-50 p-4">
              <p className="text-red-600 text-sm text-center">⚠️ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}