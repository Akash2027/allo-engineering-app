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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Clean up expired reservations first
  await cleanupExpiredReservations()
  
  try {
    const { id } = await params
    
    const reservation = await prisma.reservation.findUnique({
      where: { id: id },
      include: {
        product: {
          select: { name: true }
        },
        warehouse: {
          select: { name: true, location: true }
        }
      }
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    if (reservation.status !== 'pending') {
      return NextResponse.json({ error: 'Reservation already processed' }, { status: 400 })
    }

    if (new Date() > reservation.expiresAt) {
      return NextResponse.json({ error: 'Reservation expired' }, { status: 410 })
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}