'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Reservation {
  id: string
  quantity: number
  status: string
  expiresAt: string
  product: {
    name: string
  }
  warehouse: {
    name: string
    location: string
  }
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.reservationId as string

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId])

  useEffect(() => {
    if (reservation && reservation.expiresAt) {
      const updateTimer = () => {
        const expiry = new Date(reservation.expiresAt).getTime()
        const now = new Date().getTime()
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          setError('Reservation has expired')
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [reservation])

  const fetchReservation = async () => {
    try {
      console.log('Fetching reservation:', reservationId)
      const res = await fetch(`/api/reservations/${reservationId}`)
      console.log('Response status:', res.status)
      
      if (res.status === 404) {
        setError('Reservation not found')
        setLoading(false)
        return
      }
      
      if (res.status === 410) {
        setError('Reservation expired')
        setLoading(false)
        return
      }
      
      const data = await res.json()
      console.log('Reservation data:', data)
      setReservation(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load reservation')
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: 'POST',
      })

      if (res.status === 410) {
        setError('Reservation has expired')
        setProcessing(false)
        return
      }

      if (res.ok) {
        router.push('/?confirmed=true')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to confirm purchase')
        setProcessing(false)
      }
    } catch (err) {
      setError('Network error')
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`/api/reservations/${reservationId}/release`, {
        method: 'POST',
      })

      if (res.ok) {
        router.push('/?cancelled=true')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to cancel')
        setProcessing(false)
      }
    } catch (err) {
      setError('Network error')
      setProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading reservation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded">
          <h2 className="font-bold text-lg mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">No reservation data</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>

          <div className="space-y-4 mb-6">
            <div className="border-b pb-3">
              <p className="text-gray-600">Product:</p>
              <p className="font-semibold text-lg">{reservation.product?.name || 'Loading...'}</p>
            </div>

            <div className="border-b pb-3">
              <p className="text-gray-600">Warehouse:</p>
              <p className="font-semibold">{reservation.warehouse?.name || 'Loading...'}</p>
              <p className="text-sm text-gray-500">{reservation.warehouse?.location || ''}</p>
            </div>

            <div className="border-b pb-3">
              <p className="text-gray-600">Quantity:</p>
              <p className="font-semibold">{reservation.quantity}</p>
            </div>

            <div className="border-b pb-3">
              <p className="text-gray-600">Time Left to Confirm:</p>
              <p className={`font-bold text-2xl ${timeLeft < 60 ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleConfirm}
              disabled={processing || timeLeft === 0}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Confirm Purchase'}
            </button>

            <button
              onClick={handleCancel}
              disabled={processing || timeLeft === 0}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}