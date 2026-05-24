import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, warehouseId, quantity } = body

    if (!productId || !warehouseId || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 })
    }

    // Transaction to prevent race condition
    const result = await prisma.$transaction(async (tx) => {
      // Get inventory
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

      // Update inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { reservedUnits: inventory.reservedUnits + quantity },
      })

      // Create reservation
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