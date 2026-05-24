import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: id },
      })

      if (!reservation) {
        throw new Error('Reservation not found')
      }

      if (reservation.status !== 'pending') {
        throw new Error('Reservation already processed')
      }

      if (new Date() > reservation.expiresAt) {
        throw new Error('Reservation expired')
      }

      await tx.reservation.update({
        where: { id: id },
        data: { status: 'confirmed' },
      })

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          totalUnits: {
            decrement: reservation.quantity,
          },
          reservedUnits: {
            decrement: reservation.quantity,
          },
        },
      })

      return { success: true }
    })

    return NextResponse.json({ message: 'Reservation confirmed' }, { status: 200 })
  } catch (error: any) {
    if (error.message === 'Reservation expired') {
      return NextResponse.json({ error: 'Reservation expired' }, { status: 410 })
    }
    if (error.message === 'Reservation not found') {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }
    if (error.message === 'Reservation already processed') {
      return NextResponse.json({ error: 'Reservation already processed' }, { status: 400 })
    }
    console.error('Error confirming reservation:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}