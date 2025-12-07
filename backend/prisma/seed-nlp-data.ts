import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NLP test data...');

  // Create test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@test.com' },
      update: {},
      create: {
        email: 'alice@test.com',
        password: 'hashed_password',
        name: 'Alice Johnson',
        location: 'Northeast',
        major: 'Computer Science'
      }
    }),
    prisma.user.upsert({
      where: { email: 'bob@test.com' },
      update: {},
      create: {
        email: 'bob@test.com',
        password: 'hashed_password',
        name: 'Bob Smith',
        location: 'Southwest',
        major: 'Engineering'
      }
    }),
    prisma.user.upsert({
      where: { email: 'carol@test.com' },
      update: {},
      create: {
        email: 'carol@test.com',
        password: 'hashed_password',
        name: 'Carol Davis',
        location: 'Central',
        major: 'Business'
      }
    })
  ]);

  console.log('✅ Created', users.length, 'users');

  // Electronics listings
  const electronicsListings = [
    { title: 'MacBook Pro 16" M2', description: 'Powerful laptop for development and design work', price: 1800, condition: 'LIKE_NEW' },
    { title: 'Dell XPS 15 Laptop', description: 'Great for programming and multitasking', price: 950, condition: 'GOOD' },
    { title: 'HP Pavilion Laptop', description: 'Budget-friendly laptop for students', price: 450, condition: 'FAIR' },
    { title: 'Lenovo ThinkPad', description: 'Reliable business laptop', price: 650, condition: 'GOOD' },
    { title: 'ASUS Gaming Laptop', description: 'High-performance gaming and work', price: 1200, condition: 'LIKE_NEW' },
    
    { title: 'Anker PowerBank 20000mAh', description: 'Fast charging portable battery', price: 35, condition: 'NEW' },
    { title: 'RAVPower PowerBank', description: 'Compact 10000mAh power bank', price: 25, condition: 'LIKE_NEW' },
    { title: 'Xiaomi PowerBank 30000mAh', description: 'High capacity portable charger', price: 45, condition: 'GOOD' },
    { title: 'Belkin PowerBank', description: 'Reliable 15000mAh battery pack', price: 30, condition: 'FAIR' },
    
    { title: 'iPhone 14 Pro', description: 'Latest Apple smartphone with great camera', price: 850, condition: 'LIKE_NEW' },
    { title: 'Samsung Galaxy S23', description: 'Android flagship phone', price: 700, condition: 'GOOD' },
    { title: 'Google Pixel 7', description: 'Clean Android experience', price: 450, condition: 'GOOD' },
    { title: 'OnePlus 11', description: 'Fast charging flagship killer', price: 550, condition: 'LIKE_NEW' },
    
    { title: 'iPad Air 5th Gen', description: 'Perfect for note-taking and media', price: 480, condition: 'LIKE_NEW' },
    { title: 'Samsung Galaxy Tab S8', description: 'Android tablet with S Pen', price: 420, condition: 'GOOD' },
    
    { title: 'Sony WH-1000XM5 Headphones', description: 'Best noise cancelling headphones', price: 280, condition: 'LIKE_NEW' },
    { title: 'AirPods Pro 2nd Gen', description: 'Apple wireless earbuds', price: 180, condition: 'NEW' },
    { title: 'Bose QuietComfort 45', description: 'Comfortable noise cancelling', price: 220, condition: 'GOOD' },
    { title: 'JBL Bluetooth Speaker', description: 'Portable waterproof speaker', price: 80, condition: 'GOOD' },
    
    { title: 'LG 27" 4K Monitor', description: 'Sharp display for productivity', price: 320, condition: 'GOOD' },
    { title: 'Dell UltraSharp Monitor', description: '24" Full HD professional monitor', price: 180, condition: 'LIKE_NEW' },
    { title: 'Samsung Curved Monitor', description: '32" gaming monitor', price: 380, condition: 'GOOD' },
    
    { title: 'Logitech MX Master 3', description: 'Premium wireless mouse', price: 75, condition: 'LIKE_NEW' },
    { title: 'Mechanical Keyboard RGB', description: 'Cherry MX switches gaming keyboard', price: 95, condition: 'GOOD' },
    { title: 'Webcam 1080p HD', description: 'Logitech webcam for online classes', price: 55, condition: 'NEW' },
  ];

  // Furniture listings
  const furnitureListings = [
    { title: 'IKEA Desk White', description: 'Spacious study desk with drawers', price: 120, condition: 'GOOD' },
    { title: 'Standing Desk Adjustable', description: 'Electric height-adjustable desk', price: 280, condition: 'LIKE_NEW' },
    { title: 'Wooden Study Desk', description: 'Solid wood desk with storage', price: 150, condition: 'FAIR' },
    { title: 'Corner Desk L-Shaped', description: 'Space-saving corner desk', price: 180, condition: 'GOOD' },
    
    { title: 'Ergonomic Office Chair', description: 'Comfortable mesh back chair', price: 140, condition: 'GOOD' },
    { title: 'Gaming Chair RGB', description: 'Racing style gaming chair', price: 180, condition: 'LIKE_NEW' },
    { title: 'IKEA Office Chair', description: 'Simple and comfortable', price: 60, condition: 'FAIR' },
    
    { title: 'Bookshelf 5-Tier', description: 'Tall wooden bookshelf', price: 80, condition: 'GOOD' },
    { title: 'Storage Cabinet', description: 'Lockable file cabinet', price: 95, condition: 'GOOD' },
    { title: 'Floor Lamp Modern', description: 'LED floor lamp with dimmer', price: 45, condition: 'LIKE_NEW' },
    { title: 'Desk Lamp LED', description: 'Adjustable study lamp', price: 25, condition: 'NEW' },
    
    { title: 'Twin Bed Frame', description: 'Metal bed frame with storage', price: 150, condition: 'GOOD' },
    { title: 'Mattress Queen Size', description: 'Memory foam mattress', price: 280, condition: 'LIKE_NEW' },
    { title: 'Nightstand Wood', description: 'Bedside table with drawer', price: 45, condition: 'GOOD' },
  ];

  // Textbooks listings
  const textbooksListings = [
    { title: 'Calculus Early Transcendentals', description: 'Stewart 8th Edition math textbook', price: 85, condition: 'GOOD' },
    { title: 'Introduction to Algorithms', description: 'CLRS computer science textbook', price: 95, condition: 'LIKE_NEW' },
    { title: 'Organic Chemistry', description: 'Wade 9th Edition with solutions', price: 120, condition: 'GOOD' },
    { title: 'Physics for Scientists', description: 'Serway & Jewett textbook', price: 110, condition: 'FAIR' },
    { title: 'Biology Campbell', description: '11th Edition biology textbook', price: 100, condition: 'GOOD' },
    { title: 'Microeconomics Principles', description: 'Mankiw economics textbook', price: 75, condition: 'LIKE_NEW' },
    { title: 'Psychology Myers', description: 'AP Psychology textbook', price: 65, condition: 'GOOD' },
    { title: 'Linear Algebra', description: 'Strang MIT textbook', price: 70, condition: 'LIKE_NEW' },
    { title: 'Data Structures Java', description: 'CS textbook with code examples', price: 80, condition: 'GOOD' },
    { title: 'Statistics for Engineers', description: 'Montgomery statistics textbook', price: 90, condition: 'FAIR' },
  ];

  // Bikes listings
  const bikesListings = [
    { title: 'Mountain Bike 21-Speed', description: 'Durable trail bike', price: 280, condition: 'GOOD' },
    { title: 'Road Bike Carbon Frame', description: 'Lightweight racing bike', price: 850, condition: 'LIKE_NEW' },
    { title: 'Hybrid Bike Commuter', description: 'Perfect for campus commuting', price: 320, condition: 'GOOD' },
    { title: 'Electric Bike E-Bike', description: 'Pedal-assist electric bicycle', price: 1200, condition: 'LIKE_NEW' },
    { title: 'BMX Bike', description: 'Trick bike for stunts', price: 180, condition: 'FAIR' },
    { title: 'Folding Bike Portable', description: 'Compact foldable bicycle', price: 220, condition: 'GOOD' },
    { title: 'Cruiser Bike Beach', description: 'Comfortable beach cruiser', price: 150, condition: 'GOOD' },
  ];

  // Clothing listings
  const clothingListings = [
    { title: 'North Face Winter Jacket', description: 'Warm waterproof jacket', price: 120, condition: 'LIKE_NEW' },
    { title: 'Patagonia Fleece', description: 'Cozy fleece pullover', price: 65, condition: 'GOOD' },
    { title: 'Nike Running Shoes', description: 'Size 10 athletic shoes', price: 55, condition: 'GOOD' },
    { title: 'Adidas Sneakers', description: 'Size 9 casual sneakers', price: 45, condition: 'FAIR' },
    { title: 'Levi\'s Jeans', description: '32x32 classic blue jeans', price: 35, condition: 'GOOD' },
    { title: 'Hoodie University Logo', description: 'Official university hoodie', price: 40, condition: 'LIKE_NEW' },
    { title: 'Backpack Hiking', description: '40L camping backpack', price: 75, condition: 'GOOD' },
    { title: 'Winter Boots Waterproof', description: 'Size 11 snow boots', price: 80, condition: 'LIKE_NEW' },
  ];

  // Other listings
  const otherListings = [
    { title: 'Mini Fridge Compact', description: 'Perfect for dorm room', price: 85, condition: 'GOOD' },
    { title: 'Microwave 700W', description: 'Compact microwave oven', price: 45, condition: 'FAIR' },
    { title: 'Coffee Maker Keurig', description: 'Single-serve coffee maker', price: 55, condition: 'GOOD' },
    { title: 'Blender Ninja', description: 'High-power blender', price: 65, condition: 'LIKE_NEW' },
    { title: 'Vacuum Cleaner', description: 'Cordless stick vacuum', price: 95, condition: 'GOOD' },
    { title: 'Air Purifier HEPA', description: 'Room air purifier', price: 110, condition: 'LIKE_NEW' },
    { title: 'Electric Kettle', description: 'Fast boiling kettle', price: 25, condition: 'NEW' },
  ];

  // Create all listings
  let count = 0;
  
  for (const item of electronicsListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'ELECTRONICS',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  for (const item of furnitureListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'FURNITURE',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  for (const item of textbooksListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'TEXTBOOKS',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  for (const item of bikesListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'BIKES',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  for (const item of clothingListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'CLOTHING',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  for (const item of otherListings) {
    await prisma.listing.create({
      data: {
        ...item,
        category: 'OTHER',
        type: 'DIRECT_SALE',
        status: 'ACTIVE',
        sellerId: users[count % users.length].id
      }
    });
    count++;
  }

  console.log('✅ Created', count, 'listings');
  console.log('📊 Breakdown:');
  console.log('   Electronics:', electronicsListings.length);
  console.log('   Furniture:', furnitureListings.length);
  console.log('   Textbooks:', textbooksListings.length);
  console.log('   Bikes:', bikesListings.length);
  console.log('   Clothing:', clothingListings.length);
  console.log('   Other:', otherListings.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
