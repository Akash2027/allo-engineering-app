import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  await cleanupExpiredReservations()
  
  try {
    const body = await request.json()
    const { productId, warehouseId, quantity } = body

    if (!productId || !warehouseId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: productId,
          warehouseId: warehouseId,
        },
      })

      if (!inventory) {
        throw new Error('Inventory not found')
      }

      const available = inventory.totalUnits - inventory.reservedUnits

      if (available < quantity) {
        throw new Error('Not enough stock')
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedUnits: inventory.reservedUnits + quantity },
      })

      const expiresAt = new Date(Date.now() + 10 * 60000)

      const reservation = await tx.reservation.create({
        data: {
          productId: productId,
          warehouseId: warehouseId,
          quantity: quantity,
          status: 'pending',
          expiresAt: expiresAt,
        },
      })

      return reservation
    })

    return NextResponse.json({
      reservationId: result.id,
      expiresAt: result.expiresAt,
    }, { status: 201 })

  } catch (error: any) {
    if (error.message === 'Not enough stock') {
      return NextResponse.json({ error: 'Not enough stock' }, { status: 409 })
    }
    if (error.message === 'Inventory not found') {
      return NextResponse.json({ error: 'Product not found in this warehouse' }, { status: 404 })
    }
    console.error('Error creating reservation:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}