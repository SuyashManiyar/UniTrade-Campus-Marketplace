import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDB() {
  const listings = await prisma.listing.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      category: true,
      condition: true,
      price: true
    },
    take: 10
  });

  console.log(`Found ${listings.length} active listings:\n`);
  listings.forEach(listing => {
    console.log(`- ${listing.title} (${listing.category}, ${listing.condition}, $${listing.price})`);
  });

  await prisma.$disconnect();
}

checkDB();
