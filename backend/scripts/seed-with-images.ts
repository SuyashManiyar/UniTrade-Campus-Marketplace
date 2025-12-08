import { PrismaClient, ItemCategory, ItemCondition, ListingType, ListingStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// User data
const users = [
  { name: 'Naveen', email: 'njarpla@umass.edu' },
  { name: 'Sreehitha', email: 'snarayana@umass.edu' },
  { name: 'Suyash', email: 'smanayar@umass.edu' },
  { name: 'Rohit', email: 'rtumati@umass.edu' },
  { name: 'Chetan', email: 'cmadadi@umass.edu' },
];

// Listing data based on image filenames
const listingData: Record<string, {
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  price: number;
  type: ListingType;
}> = {
  '10Books.jpg': {
    title: 'Computer Science Textbook Bundle - 10 Books',
    description: 'Collection of 10 essential CS textbooks including Data Structures, Algorithms, Operating Systems, and more. Great condition, minimal highlighting. Perfect for CS majors!',
    category: ItemCategory.TEXTBOOKS,
    condition: ItemCondition.GOOD,
    price: 150,
    type: ListingType.DIRECT_SALE
  },
  'books1.jpg': {
    title: 'Engineering Textbooks Set',
    description: 'Set of engineering textbooks for various courses. All books are in excellent condition with no writing or tears. Great for engineering students.',
    category: ItemCategory.TEXTBOOKS,
    condition: ItemCondition.LIKE_NEW,
    price: 120,
    type: ListingType.DIRECT_SALE
  },
  'books2.jpg': {
    title: 'Math and Physics Textbooks',
    description: 'Calculus, Linear Algebra, and Physics textbooks. Used for one semester, very clean. Includes solution manuals for some books.',
    category: ItemCategory.TEXTBOOKS,
    condition: ItemCondition.GOOD,
    price: 95,
    type: ListingType.DIRECT_SALE
  },
  'camera.jpg': {
    title: 'Canon DSLR Camera with Lens',
    description: 'Canon EOS Rebel T7 DSLR camera with 18-55mm lens. Barely used, comes with camera bag, memory card, and charger. Perfect for photography enthusiasts!',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.LIKE_NEW,
    price: 450,
    type: ListingType.DIRECT_SALE
  },
  'chair1.jpg': {
    title: 'Ergonomic Office Chair',
    description: 'Comfortable office chair with lumbar support and adjustable height. Great for long study sessions. Black mesh back with padded seat.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.GOOD,
    price: 75,
    type: ListingType.DIRECT_SALE
  },
  'chair2.jpg': {
    title: 'Gaming Chair - Red and Black',
    description: 'High-back gaming chair with armrests and reclining feature. Very comfortable for gaming or studying. Minor wear on armrests.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.GOOD,
    price: 120,
    type: ListingType.DIRECT_SALE
  },
  'chair3.jpg': {
    title: 'Study Desk Chair',
    description: 'Simple and sturdy desk chair, perfect for dorm room or apartment. Adjustable height, swivel base. Clean and well-maintained.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.GOOD,
    price: 45,
    type: ListingType.DIRECT_SALE
  },
  'cycle.jpg': {
    title: 'Mountain Bike - 21 Speed',
    description: 'Trek mountain bike with 21-speed gear system. Perfect for campus commuting and trail riding. Recently serviced, new tires.',
    category: ItemCategory.BIKES,
    condition: ItemCondition.GOOD,
    price: 280,
    type: ListingType.DIRECT_SALE
  },
  'cycle2.jpg': {
    title: 'Road Bike - Lightweight',
    description: 'Lightweight road bike, great for long distance rides. Shimano components, smooth shifting. Includes bike lock and lights.',
    category: ItemCategory.BIKES,
    condition: ItemCondition.LIKE_NEW,
    price: 350,
    type: ListingType.DIRECT_SALE
  },
  'cycle3.jpg': {
    title: 'Hybrid Bike for Campus',
    description: 'Comfortable hybrid bike perfect for getting around campus. Has basket and rear rack. Well maintained, rides smoothly.',
    category: ItemCategory.BIKES,
    condition: ItemCondition.GOOD,
    price: 200,
    type: ListingType.DIRECT_SALE
  },
  'cycle4.jpg': {
    title: 'City Cruiser Bike',
    description: 'Classic cruiser bike with comfortable seat and upright riding position. Great for casual rides around town. Includes U-lock.',
    category: ItemCategory.BIKES,
    condition: ItemCondition.FAIR,
    price: 150,
    type: ListingType.DIRECT_SALE
  },
  'dumbells.jpg': {
    title: 'Adjustable Dumbbell Set',
    description: 'Pair of adjustable dumbbells, 5-25 lbs each. Perfect for home workouts. Includes stand. Barely used, like new condition.',
    category: ItemCategory.OTHER,
    condition: ItemCondition.LIKE_NEW,
    price: 80,
    type: ListingType.DIRECT_SALE
  },
  'echo.jpg': {
    title: 'Amazon Echo Dot (4th Gen)',
    description: 'Amazon Echo Dot smart speaker with Alexa. Works perfectly, comes with original box and charger. Great for smart home control and music.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.LIKE_NEW,
    price: 35,
    type: ListingType.DIRECT_SALE
  },
  'extension box.jpg': {
    title: 'Power Strip with USB Ports',
    description: '6-outlet surge protector power strip with 3 USB charging ports. Perfect for dorm rooms. Brand new condition.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.LIKE_NEW,
    price: 20,
    type: ListingType.DIRECT_SALE
  },
  'guitar.jpg': {
    title: 'Acoustic Guitar with Case',
    description: 'Yamaha acoustic guitar in excellent condition. Comes with padded case, extra strings, and tuner. Great for beginners and intermediate players.',
    category: ItemCategory.OTHER,
    condition: ItemCondition.GOOD,
    price: 180,
    type: ListingType.DIRECT_SALE
  },
  'Ipad.jpg': {
    title: 'iPad Air (4th Generation) 64GB',
    description: 'iPad Air with 64GB storage, WiFi model. Includes Apple Pencil compatible. Screen protector and case included. Perfect for note-taking.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.LIKE_NEW,
    price: 450,
    type: ListingType.DIRECT_SALE
  },
  'iphone.jpg': {
    title: 'iPhone 13 - 128GB Unlocked',
    description: 'iPhone 13 in excellent condition, 128GB, unlocked for all carriers. Battery health 95%. Comes with original box and charger.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.LIKE_NEW,
    price: 550,
    type: ListingType.DIRECT_SALE
  },
  'jacket.jpg': {
    title: 'Winter Jacket - North Face',
    description: 'North Face winter jacket, size Medium. Warm and waterproof, perfect for New England winters. Gently used, no stains or tears.',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.GOOD,
    price: 85,
    type: ListingType.DIRECT_SALE
  },
  'jeans.jpg': {
    title: "Levi's Jeans - Size 32x32",
    description: "Classic Levi's 511 slim fit jeans in dark wash. Size 32x32. Worn a few times, excellent condition. Perfect for everyday wear.",
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.LIKE_NEW,
    price: 35,
    type: ListingType.DIRECT_SALE
  },
  'magic_mouse.jpg': {
    title: 'Apple Magic Mouse 2',
    description: 'Apple Magic Mouse 2 in white. Rechargeable, works perfectly with Mac. Minimal signs of use, comes with charging cable.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.GOOD,
    price: 60,
    type: ListingType.DIRECT_SALE
  },
  'matress.jpg': {
    title: 'Twin XL Mattress with Topper',
    description: 'Twin XL mattress perfect for dorm beds. Includes memory foam topper. Clean, no stains. Great condition, very comfortable.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.GOOD,
    price: 120,
    type: ListingType.DIRECT_SALE
  },
  'nike_jordans.jpg': {
    title: 'Air Jordan 1 Retro - Size 10',
    description: 'Nike Air Jordan 1 Retro sneakers in red and white colorway. Size 10. Gently worn, well maintained. Comes with original box.',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.GOOD,
    price: 180,
    type: ListingType.DIRECT_SALE
  },
  'shirt.jpg': {
    title: 'Dress Shirt Bundle - Size M',
    description: 'Set of 3 dress shirts, size Medium. Various colors (white, blue, light pink). Perfect for interviews and presentations. Barely worn.',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.LIKE_NEW,
    price: 40,
    type: ListingType.DIRECT_SALE
  },
  'shoes.jpg': {
    title: 'Running Shoes - Nike Pegasus',
    description: 'Nike Pegasus running shoes, size 9.5. Great cushioning and support. Used for about 50 miles, plenty of life left.',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.GOOD,
    price: 65,
    type: ListingType.DIRECT_SALE
  },
  'showe stool.jpg': {
    title: 'Shower Stool/Caddy',
    description: 'Plastic shower stool and caddy organizer. Perfect for dorm showers. Clean and in good condition.',
    category: ItemCategory.OTHER,
    condition: ItemCondition.GOOD,
    price: 15,
    type: ListingType.DIRECT_SALE
  },
  'tshirt.jpg': {
    title: 'UMass T-Shirt Collection',
    description: 'Collection of 5 UMass t-shirts in various designs. Size Large. All in great condition, perfect for showing school spirit!',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.GOOD,
    price: 30,
    type: ListingType.DIRECT_SALE
  },
  'underarmor_jacket.jpg': {
    title: 'Under Armour Athletic Jacket',
    description: 'Under Armour zip-up athletic jacket, size Large. Moisture-wicking material, perfect for workouts or casual wear. Like new.',
    category: ItemCategory.CLOTHING,
    condition: ItemCondition.LIKE_NEW,
    price: 55,
    type: ListingType.DIRECT_SALE
  },
  'watch.jpg': {
    title: 'Fossil Smartwatch',
    description: 'Fossil Gen 5 smartwatch with heart rate monitor and GPS. Works with Android and iOS. Includes charger and extra band.',
    category: ItemCategory.ELECTRONICS,
    condition: ItemCondition.GOOD,
    price: 150,
    type: ListingType.DIRECT_SALE
  },
  '578572294_1764920050883510_988517828217124173_n.jpg': {
    title: 'Mini Fridge for Dorm',
    description: 'Compact mini fridge perfect for dorm rooms. 1.7 cubic feet, works perfectly. Energy efficient and quiet. Great for drinks and snacks.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.GOOD,
    price: 70,
    type: ListingType.DIRECT_SALE
  },
  '595455341_2060718354695489_3387306161811717130_n.jpg': {
    title: 'Desk Lamp with USB Port',
    description: 'LED desk lamp with adjustable brightness and USB charging port. Perfect for late-night studying. Modern design, barely used.',
    category: ItemCategory.FURNITURE,
    condition: ItemCondition.LIKE_NEW,
    price: 25,
    type: ListingType.DIRECT_SALE
  }
};

async function main() {
  console.log('🌱 Starting seed with images...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.report.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('👥 Creating users...');
  const createdUsers = [];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        isVerified: true,
        role: 'STUDENT',
      },
    });
    createdUsers.push(user);
    console.log(`   ✓ Created user: ${user.name} (${user.email})`);
  }

  // Copy images to uploads folder
  const sourceDir = '/Users/naveen7.j/Downloads/UniTrade-Campus-Marketplace/520_pics';
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  console.log('📸 Copying images to uploads folder...');
  const imageFiles = fs.readdirSync(sourceDir).filter(file => 
    file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
  );

  for (const imageFile of imageFiles) {
    const sourcePath = path.join(sourceDir, imageFile);
    const destPath = path.join(uploadsDir, imageFile);
    fs.copyFileSync(sourcePath, destPath);
  }
  console.log(`   ✓ Copied ${imageFiles.length} images`);

  // Create listings
  console.log('📦 Creating listings...');
  const createdListings = [];
  const statuses: ListingStatus[] = [
    ListingStatus.ACTIVE, 
    ListingStatus.ACTIVE, 
    ListingStatus.ACTIVE, 
    ListingStatus.ACTIVE, 
    ListingStatus.SOLD, 
    ListingStatus.ACTIVE
  ];

  let listingIndex = 0;
  for (const [imageFile, data] of Object.entries(listingData)) {
    const seller = createdUsers[listingIndex % createdUsers.length];
    const status = statuses[listingIndex % statuses.length];
    
    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        condition: data.condition,
        price: data.price,
        type: data.type,
        status: status,
        images: JSON.stringify([`/uploads/${imageFile}`]),
        sellerId: seller.id,
      },
    });
    createdListings.push(listing);
    console.log(`   ✓ Created listing: ${listing.title} (${status})`);
    listingIndex++;
  }

  // Create reviews (one review per user pair)
  console.log('⭐ Creating reviews...');
  let reviewCount = 0;
  for (let i = 0; i < createdUsers.length; i++) {
    const reviewer = createdUsers[i];
    const reviewee = createdUsers[(i + 1) % createdUsers.length];
    
    const reviews = [
      { rating: 5, comment: 'Great seller! Item exactly as described. Fast response and smooth transaction.' },
      { rating: 4, comment: 'Good experience overall. Item was in good condition. Would buy again.' },
      { rating: 5, comment: 'Excellent communication and very friendly. Highly recommend!' },
    ];

    // Only create one review per reviewer-reviewee pair
    const randomReview = reviews[Math.floor(Math.random() * reviews.length)];
    await prisma.review.create({
      data: {
        rating: randomReview.rating,
        comment: randomReview.comment,
        reviewerId: reviewer.id,
        revieweeId: reviewee.id,
      },
    });
    reviewCount++;
  }
  console.log(`   ✓ Created ${reviewCount} reviews`);

  // Update user ratings
  console.log('📊 Calculating user ratings...');
  for (const user of createdUsers) {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: user.id },
    });

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          rating: avgRating,
          ratingCount: reviews.length,
        },
      });
    }
  }

  // Create wishlist items
  console.log('❤️  Creating wishlist items...');
  let wishlistCount = 0;
  for (const user of createdUsers) {
    const activeListings = createdListings.filter(l => l.status === ListingStatus.ACTIVE && l.sellerId !== user.id);
    const randomListings = activeListings.sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const listing of randomListings) {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          listingId: listing.id,
        },
      });
      wishlistCount++;
    }
  }
  console.log(`   ✓ Created ${wishlistCount} wishlist items`);

  // Create some messages
  console.log('💬 Creating messages...');
  let messageCount = 0;
  for (let i = 0; i < 5; i++) {
    const sender = createdUsers[i % createdUsers.length];
    const receiver = createdUsers[(i + 1) % createdUsers.length];
    const listing = createdListings[i % createdListings.length];

    const messages = [
      'Hi! Is this item still available?',
      'Yes, it is! Would you like to meet up to see it?',
      'That would be great! When are you free?',
      'How about tomorrow at 2pm near the library?',
      'Perfect! See you then.',
    ];

    for (const content of messages) {
      await prisma.message.create({
        data: {
          content,
          senderId: messageCount % 2 === 0 ? sender.id : receiver.id,
          receiverId: messageCount % 2 === 0 ? receiver.id : sender.id,
          listingId: listing.id,
        },
      });
      messageCount++;
    }
  }
  console.log(`   ✓ Created ${messageCount} messages`);

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Listings: ${createdListings.length}`);
  console.log(`   Reviews: ${reviewCount}`);
  console.log(`   Wishlist items: ${wishlistCount}`);
  console.log(`   Messages: ${messageCount}`);
  console.log('\n💡 Note: Users created without passwords. Use your auth system to set them up.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
