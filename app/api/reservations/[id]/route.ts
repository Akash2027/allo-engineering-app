import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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