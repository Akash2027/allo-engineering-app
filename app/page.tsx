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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading inventory...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-light text-gray-900">Allo Engineering</h1>
          <p className="text-gray-500 mt-1 text-sm">Inventory Dashboard — Select a warehouse to reserve physical units. Reservations are held for 10 minutes.</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Products Grid */}
        <div className="space-y-8">
          {products.map((product) => (
            <div key={product.productId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Product Header */}
              <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
                <h2 className="text-xl font-medium text-gray-900">{product.name}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{product.description}</p>
              </div>

              {/* Warehouses */}
              <div className="divide-y divide-gray-100">
                {product.warehouses.map((warehouse) => (
                  <div key={warehouse.warehouseId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{warehouse.warehouseName}</span>
                        <span className="text-xs text-gray-400">{warehouse.location}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`text-sm font-medium ${warehouse.availableUnits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {warehouse.availableUnits > 0 ? `${warehouse.availableUnits} units available` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReserve(product.productId, warehouse.warehouseId)}
                      disabled={reserving === `${product.productId}-${warehouse.warehouseId}` || warehouse.availableUnits === 0}
                      className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                        warehouse.availableUnits > 0
                          ? 'bg-gray-900 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-400'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {reserving === `${product.productId}-${warehouse.warehouseId}` ? 'Reserving...' : 'Reserve'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}