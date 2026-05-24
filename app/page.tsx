'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Warehouse {
  warehouseId: string
  warehouseName: string
  location: string
  availableUnits: number
}

interface Product {
  productId: string
  name: string
  description: string
  warehouses: Warehouse[]
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [reserving, setReserving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load products')
      setLoading(false)
    }
  }

  const handleReserve = async (productId: string, warehouseId: string) => {
    setReserving(`${productId}-${warehouseId}`)
    setError(null)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
      })

      const data = await res.json()

      if (res.status === 409) {
        setError('Not enough stock available')
        setReserving(null)
        return
      }

      if (!res.ok) {
        setError('Failed to create reservation')
        setReserving(null)
        return
      }

      router.push(`/checkout/${data.reservationId}`)
    } catch (err) {
      setError('Network error')
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-2xl font-bold text-white">Loading amazing products...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">🛍️ Reserve & Checkout</h1>
          <p className="text-white text-lg opacity-90">Reserve now, pay later - Your items are held for 10 minutes!</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg text-center font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.productId} className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-5">
                <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                <p className="text-purple-100 text-sm mt-1">{product.description}</p>
              </div>

              {/* Card Body */}
              <div className="p-5">
                <h3 className="font-bold text-gray-700 mb-3 text-lg">📍 Available Stock</h3>
                <div className="space-y-3">
                  {product.warehouses.map((warehouse) => (
                    <div key={warehouse.warehouseId} className="border-2 rounded-xl p-4 bg-gray-50 hover:border-purple-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-800 text-lg">{warehouse.warehouseName}</p>
                          <p className="text-xs text-gray-500">{warehouse.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${warehouse.availableUnits > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                          {warehouse.availableUnits > 0 ? `${warehouse.availableUnits} left` : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-3xl font-black text-gray-800">
                          {warehouse.availableUnits}
                          <span className="text-sm font-normal text-gray-500"> available</span>
                        </div>
                        <button
                          onClick={() => handleReserve(product.productId, warehouse.warehouseId)}
                          disabled={reserving === `${product.productId}-${warehouse.warehouseId}` || warehouse.availableUnits === 0}
                          className={`px-5 py-2 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 ${
                            warehouse.availableUnits > 0
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {reserving === `${product.productId}-${warehouse.warehouseId}` ? '⏳ Holding...' : '🎯 Reserve Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}