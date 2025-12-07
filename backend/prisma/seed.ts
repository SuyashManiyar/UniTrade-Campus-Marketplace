import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Add your sample data here
  // Example: Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'student1@umass.edu' },
    update: {},
    create: {
      email: 'student1@umass.edu',
      name: 'John Doe',
      pronouns: 'he/him',
      major: 'Computer Science',
      location: 'Southwest',
      role: 'STUDENT',
      isVerified: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'student2@umass.edu' },
    update: {},
    create: {
      email: 'student2@umass.edu',
      name: 'Jane Smith',
      pronouns: 'she/her',
      major: 'Business',
      location: 'Central',
      role: 'STUDENT',
      isVerified: true,
    },
  })

  console.log('✅ Users created')

  // Example: Create sample listings
  const listing1 = await prisma.listing.create({
    data: {
      title: 'iPhone 13 Pro',
      description: 'Gently used iPhone 13 Pro, 256GB, excellent condition',
      category: 'ELECTRONICS',
      condition: 'LIKE_NEW',
      price: 650,
      type: 'DIRECT_SALE',
      status: 'ACTIVE',
      sellerId: user1.id,
    },
  })

  const listing2 = await prisma.listing.create({
    data: {
      title: 'Calculus Textbook',
      description: 'Calculus Early Transcendentals, 8th Edition',
      category: 'TEXTBOOKS',
      condition: 'GOOD',
      price: 50,
      type: 'AUCTION',
      status: 'ACTIVE',
      startingBid: 50,
      currentBid: 50,
      bidIncrement: 5,
      auctionEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      sellerId: user2.id,
    },
  })

  console.log('✅ Listings created')

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
