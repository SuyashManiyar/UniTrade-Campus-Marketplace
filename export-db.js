const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function exportData() {
  console.log('📦 Exporting database...')

  try {
    const users = await prisma.user.findMany()
    const listings = await prisma.listing.findMany()
    const bids = await prisma.bid.findMany()
    const messages = await prisma.message.findMany()
    const wishlists = await prisma.wishlist.findMany()

    const data = {
      users,
      listings,
      bids,
      messages,
      wishlists,
      exportedAt: new Date().toISOString()
    }

    fs.writeFileSync('database-export.json', JSON.stringify(data, null, 2))
    console.log('✅ Database exported to database-export.json')
    console.log(`   - ${users.length} users`)
    console.log(`   - ${listings.length} listings`)
    console.log(`   - ${bids.length} bids`)
    console.log(`   - ${messages.length} messages`)
    console.log(`   - ${wishlists.length} wishlist items`)
  } catch (error) {
    console.error('❌ Export failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()
