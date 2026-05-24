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

  const handleReserve = async (productId: string, warehouseId: string, quantity: number = 1) => {
    setReserving(productId)
    setError(null)

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, warehouseId, quantity }),
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

      // Redirect to checkout page
      router.push(`/checkout/${data.reservationId}`)
    } catch (err) {
      setError('Network error')
      setReserving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Products</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {products.map((product) => (
            <div key={product.productId} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4">{product.description}</p>

              <h3 className="font-semibold mb-2">Available Stock:</h3>
              <div className="space-y-3">
                {product.warehouses.map((warehouse) => (
                  <div key={warehouse.warehouseId} className="flex justify-between items-center border-t pt-2">
                    <div>
                      <p className="font-medium">{warehouse.warehouseName}</p>
                      <p className="text-sm text-gray-500">{warehouse.location}</p>
                      <p className="text-green-600 font-semibold">
                        Available: {warehouse.availableUnits} units
                      </p>
                    </div>
                    <button
                      onClick={() => handleReserve(product.productId, warehouse.warehouseId, 1)}
                      disabled={reserving === product.productId || warehouse.availableUnits === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {reserving === product.productId ? 'Reserving...' : 'Reserve'}
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