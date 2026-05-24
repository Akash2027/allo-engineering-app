import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Find all expired pending reservations
    const expiredReservations = await prisma.reservation.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date(),
        },
      },
    })

    console.log(`Found ${expiredReservations.length} expired reservations`)

    // Release each expired reservation
    for (const reservation of expiredReservations) {
      await prisma.$transaction(async (tx) => {
        // Update reservation status
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: 'released' },
        })

        // Release reserved units back to inventory
        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            reservedUnits: {
              decrement: reservation.quantity,
            },
          },
        })
      })
      
      console.log(`Released reservation: ${reservation.id}`)
    }

    return NextResponse.json({ 
      message: `Released ${expiredReservations.length} expired reservations` 
    })
  } catch (error) {
    console.error('Error expiring reservations:', error)
    return NextResponse.json({ error: 'Failed to expire reservations' }, { status: 500 })
  }
}