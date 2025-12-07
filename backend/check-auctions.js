const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuctions() {
  try {
    const auctions = await prisma.listing.findMany({
      where: {
        type: 'AUCTION'
      },
      select: {
        id: true,
        title: true,
        status: true,
        startingBid: true,
        currentBid: true,
        auctionEndTime: true,
        _count: {
          select: {
            bids: true
          }
        }
      }
    });

    console.log('\n=== AUCTION LISTINGS ===');
    console.log(`Total auctions found: ${auctions.length}\n`);
    
    if (auctions.length === 0) {
      console.log('No auction listings found in the database.');
    } else {
      auctions.forEach((auction, index) => {
        console.log(`${index + 1}. ${auction.title}`);
        console.log(`   ID: ${auction.id}`);
        console.log(`   Status: ${auction.status}`);
        console.log(`   Starting Bid: $${auction.startingBid}`);
        console.log(`   Current Bid: $${auction.currentBid || 'No bids yet'}`);
        console.log(`   Total Bids: ${auction._count.bids}`);
        console.log(`   Ends: ${auction.auctionEndTime}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuctions();
