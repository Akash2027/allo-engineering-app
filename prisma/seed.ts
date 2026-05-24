import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Wireless Headphones',
      description: 'Noise-cancelling Bluetooth headphones with 30hr battery life',
    },
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Smart Watch',
      description: 'Fitness tracker with heart rate monitor and GPS',
    },
  })

  const product3 = await prisma.product.create({
    data: {
      name: 'USB-C Cable',
      description: 'Fast charging 2m braided USB-C cable',
    },
  })

  console.log('Created products')

  // Create Warehouses
  const warehouse1 = await prisma.warehouse.create({
    data: {
      name: 'Mumbai Warehouse',
      location: 'Mumbai, Maharashtra',
    },
  })

  const warehouse2 = await prisma.warehouse.create({
    data: {
      name: 'Bangalore Warehouse',
      location: 'Bangalore, Karnataka',
    },
  })

  console.log('Created warehouses')

  // Create Inventory
  await prisma.inventory.create({
    data: {
      productId: product1.id,
      warehouseId: warehouse1.id,
      totalUnits: 10,
      reservedUnits: 0,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product1.id,
      warehouseId: warehouse2.id,
      totalUnits: 5,
      reservedUnits: 0,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product2.id,
      warehouseId: warehouse1.id,
      totalUnits: 3,
      reservedUnits: 0,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product2.id,
      warehouseId: warehouse2.id,
      totalUnits: 7,
      reservedUnits: 0,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product3.id,
      warehouseId: warehouse1.id,
      totalUnits: 100,
      reservedUnits: 0,
    },
  })

  await prisma.inventory.create({
    data: {
      productId: product3.id,
      warehouseId: warehouse2.id,
      totalUnits: 80,
      reservedUnits: 0,
    },
  })

  console.log('Created inventory')
  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })