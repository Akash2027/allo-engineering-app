import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true
          }
        }
      }
    })

    const formattedProducts = products.map((product: any) => ({
      productId: product.id,
      name: product.name,
      description: product.description,
      warehouses: product.inventory.map((inv: any) => ({
        warehouseId: inv.warehouse.id,
        warehouseName: inv.warehouse.name,
        location: inv.warehouse.location,
        availableUnits: inv.totalUnits - inv.reservedUnits,
        totalUnits: inv.totalUnits,
        reservedUnits: inv.reservedUnits
      }))
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}