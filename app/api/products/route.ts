import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function cleanupExpiredReservations() {
  const expired = await prisma.reservation.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: new Date() }
    }
  })
  
  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: 'released' }
      })
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId
          }
        },
        data: { reservedUnits: { decrement: reservation.quantity } }
      })
    })
  }
  
  if (expired.length > 0) {
    console.log(`Cleaned up ${expired.length} expired reservations`)
  }
}

export async function GET() {
  // Clean up expired reservations first
  await cleanupExpiredReservations()
  
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