import { PrismaClient, ItemCategory, ItemCondition } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create dummy users first
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@umass.edu',
        name: 'John Doe',
        major: 'Computer Science',
        location: 'Southwest',
        bio: 'CS student looking to buy and sell tech items',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@umass.edu',
        name: 'Jane Smith',
        major: 'Business',
        location: 'Northeast',
        bio: 'Business major selling furniture and textbooks',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.wilson@umass.edu',
        name: 'Mike Wilson',
        major: 'Engineering',
        location: 'Central',
        bio: 'Engineering student with various items for sale',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.johnson@umass.edu',
        name: 'Sarah Johnson',
        major: 'Psychology',
        location: 'Orchard Hill',
        bio: 'Psychology major selling textbooks and furniture',
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex.brown@umass.edu',
        name: 'Alex Brown',
        major: 'Art',
        location: 'Sylvan',
        bio: 'Art student with creative items and supplies',
        isVerified: true,
      },
    }),
  ])

  // Create 50 dummy listings
  const listings = [
    // Electronics
    { title: 'MacBook Pro 13" 2021', description: 'Excellent condition MacBook Pro with M1 chip. Perfect for coding and design work. Includes charger and original box.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.LIKE_NEW, price: 1200, sellerId: users[0].id },
    { title: 'Dell XPS 15 Laptop', description: 'Powerful laptop great for engineering software. 16GB RAM, 512GB SSD. Minor scratches on lid.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.GOOD, price: 800, sellerId: users[2].id },
    { title: 'iPad Air with Apple Pencil', description: 'Perfect for note-taking and digital art. Comes with keyboard case and screen protector.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.LIKE_NEW, price: 450, sellerId: users[4].id },
    { title: 'Gaming Desktop PC', description: 'Custom built gaming PC. RTX 3070, Ryzen 7, 32GB RAM. Great for gaming and video editing.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.GOOD, price: 1500, sellerId: users[0].id },
    { title: 'iPhone 13 Pro', description: 'Unlocked iPhone 13 Pro in excellent condition. Battery health 95%. Includes case and screen protector.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.LIKE_NEW, price: 700, sellerId: users[1].id },
    { title: 'Samsung 27" Monitor', description: '4K monitor perfect for productivity and gaming. Adjustable stand, multiple ports.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.GOOD, price: 250, sellerId: users[2].id },
    { title: 'Mechanical Keyboard', description: 'Cherry MX Blue switches, RGB lighting. Great for coding and gaming.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.LIKE_NEW, price: 80, sellerId: users[0].id },
    { title: 'Wireless Mouse', description: 'Logitech MX Master 3. Ergonomic design, perfect for long study sessions.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.GOOD, price: 60, sellerId: users[3].id },
    { title: 'Bluetooth Headphones', description: 'Sony WH-1000XM4 noise cancelling headphones. Perfect for studying in noisy dorms.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.LIKE_NEW, price: 200, sellerId: users[1].id },
    { title: 'Webcam HD', description: 'Logitech C920 webcam for online classes and video calls. Crystal clear video quality.', category: ItemCategory.ELECTRONICS, condition: ItemCondition.GOOD, price: 40, sellerId: users[4].id },

    // Furniture
    { title: 'Study Desk with Drawers', description: 'Solid wood desk perfect for dorm room. Two drawers for storage. Minor wear on surface.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 120, sellerId: users[1].id },
    { title: 'Ergonomic Office Chair', description: 'Comfortable office chair with lumbar support. Perfect for long study sessions.', category: ItemCategory.FURNITURE, condition: ItemCondition.LIKE_NEW, price: 150, sellerId: users[3].id },
    { title: 'Twin Size Bed Frame', description: 'Metal bed frame, easy to assemble. Perfect for dorm room upgrade.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 80, sellerId: users[2].id },
    { title: 'Bookshelf 5-Tier', description: 'Tall bookshelf perfect for textbooks and decorations. Sturdy construction.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 60, sellerId: users[4].id },
    { title: 'Mini Fridge', description: 'Compact refrigerator perfect for dorm room. Energy efficient, quiet operation.', category: ItemCategory.FURNITURE, condition: ItemCondition.LIKE_NEW, price: 100, sellerId: users[0].id },
    { title: 'Floor Lamp', description: 'Modern floor lamp with adjustable brightness. Great for reading and studying.', category: ItemCategory.FURNITURE, condition: ItemCondition.LIKE_NEW, price: 35, sellerId: users[1].id },
    { title: 'Storage Ottoman', description: 'Multifunctional ottoman with hidden storage. Perfect for small spaces.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 45, sellerId: users[3].id },
    { title: 'Dining Table Set', description: 'Small dining table with 2 chairs. Perfect for apartment living.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 200, sellerId: users[2].id },
    { title: 'Bean Bag Chair', description: 'Comfortable bean bag chair for gaming and relaxing. Easy to move around.', category: ItemCategory.FURNITURE, condition: ItemCondition.GOOD, price: 50, sellerId: users[4].id },
    { title: 'TV Stand', description: 'Modern TV stand with cable management. Fits TVs up to 55 inches.', category: ItemCategory.FURNITURE, condition: ItemCondition.LIKE_NEW, price: 75, sellerId: users[0].id },

    // Textbooks
    { title: 'Calculus Early Transcendentals', description: 'Stewart Calculus textbook, 8th edition. Great condition, minimal highlighting.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 180, sellerId: users[2].id },
    { title: 'Introduction to Psychology', description: 'Myers Psychology textbook, latest edition. Perfect for PSYC 100.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.LIKE_NEW, price: 200, sellerId: users[3].id },
    { title: 'Organic Chemistry', description: 'Clayden Organic Chemistry textbook. Essential for chemistry majors.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 250, sellerId: users[1].id },
    { title: 'Microeconomics Principles', description: 'Mankiw Economics textbook with access code. Perfect for ECON courses.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.LIKE_NEW, price: 220, sellerId: users[1].id },
    { title: 'Java Programming Book', description: 'Head First Java programming book. Great for CS students learning Java.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 40, sellerId: users[0].id },
    { title: 'Statistics Textbook', description: 'Elementary Statistics textbook with solutions manual. Minimal wear.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 150, sellerId: users[4].id },
    { title: 'Biology Campbell', description: 'Campbell Biology textbook, 12th edition. Essential for biology majors.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.LIKE_NEW, price: 280, sellerId: users[3].id },
    { title: 'Physics Halliday', description: 'Fundamentals of Physics by Halliday. Great for physics courses.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 200, sellerId: users[2].id },
    { title: 'Art History Book', description: 'Gardner\'s Art Through the Ages. Perfect for art history courses.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.GOOD, price: 120, sellerId: users[4].id },
    { title: 'Business Ethics Textbook', description: 'Business Ethics textbook with case studies. Excellent condition.', category: ItemCategory.TEXTBOOKS, condition: ItemCondition.LIKE_NEW, price: 160, sellerId: users[1].id },

    // Bikes
    { title: 'Mountain Bike Trek', description: 'Trek mountain bike, 21-speed. Perfect for campus and trail riding. Recently tuned.', category: ItemCategory.BIKES, condition: ItemCondition.GOOD, price: 300, sellerId: users[2].id },
    { title: 'Road Bike Specialized', description: 'Lightweight road bike perfect for commuting to campus. Fast and efficient.', category: ItemCategory.BIKES, condition: ItemCondition.LIKE_NEW, price: 450, sellerId: users[0].id },
    { title: 'Hybrid Bike', description: 'Comfortable hybrid bike great for campus riding. Includes basket and lights.', category: ItemCategory.BIKES, condition: ItemCondition.GOOD, price: 200, sellerId: users[3].id },
    { title: 'Electric Scooter', description: 'Xiaomi electric scooter. Perfect for quick campus transportation. 15-mile range.', category: ItemCategory.BIKES, condition: ItemCondition.LIKE_NEW, price: 350, sellerId: users[1].id },
    { title: 'BMX Bike', description: 'BMX bike for tricks and fun riding. Sturdy construction, some scratches.', category: ItemCategory.BIKES, condition: ItemCondition.FAIR, price: 120, sellerId: users[4].id },

    // Clothing
    { title: 'UMass Hoodie', description: 'Official UMass hoodie, size Large. Warm and comfortable, perfect for campus.', category: ItemCategory.CLOTHING, condition: ItemCondition.LIKE_NEW, price: 35, sellerId: users[0].id },
    { title: 'Winter Coat North Face', description: 'North Face winter coat, size Medium. Perfect for New England winters.', category: ItemCategory.CLOTHING, condition: ItemCondition.GOOD, price: 80, sellerId: users[1].id },
    { title: 'Professional Blazer', description: 'Navy blue blazer perfect for interviews and presentations. Size Small.', category: ItemCategory.CLOTHING, condition: ItemCondition.LIKE_NEW, price: 45, sellerId: users[3].id },
    { title: 'Sneakers Nike', description: 'Nike Air Max sneakers, size 10. Comfortable for walking around campus.', category: ItemCategory.CLOTHING, condition: ItemCondition.GOOD, price: 60, sellerId: users[2].id },
    { title: 'Backpack Jansport', description: 'Classic Jansport backpack, perfect for carrying textbooks and laptop.', category: ItemCategory.CLOTHING, condition: ItemCondition.GOOD, price: 25, sellerId: users[4].id },

    // Other
    { title: 'Coffee Maker Keurig', description: 'Single-serve coffee maker perfect for dorm room. Includes K-cup holder.', category: ItemCategory.OTHER, condition: ItemCondition.LIKE_NEW, price: 60, sellerId: users[1].id },
    { title: 'Microwave', description: 'Compact microwave perfect for dorm cooking. Easy to use, energy efficient.', category: ItemCategory.OTHER, condition: ItemCondition.GOOD, price: 50, sellerId: users[3].id },
    { title: 'Guitar Acoustic', description: 'Yamaha acoustic guitar with case. Perfect for dorm room music sessions.', category: ItemCategory.OTHER, condition: ItemCondition.GOOD, price: 150, sellerId: users[4].id },
    { title: 'Printer Canon', description: 'All-in-one printer with scanner. Perfect for printing assignments and documents.', category: ItemCategory.OTHER, condition: ItemCondition.GOOD, price: 80, sellerId: users[0].id },
    { title: 'Vacuum Cleaner', description: 'Compact vacuum cleaner perfect for dorm and apartment cleaning.', category: ItemCategory.OTHER, condition: ItemCondition.LIKE_NEW, price: 70, sellerId: users[2].id },
    { title: 'Air Purifier', description: 'HEPA air purifier perfect for dorm rooms. Quiet operation, removes allergens.', category: ItemCategory.OTHER, condition: ItemCondition.LIKE_NEW, price: 90, sellerId: users[1].id },
    { title: 'Desk Organizer Set', description: 'Complete desk organizer set with pen holders, paper trays, and storage.', category: ItemCategory.OTHER, condition: ItemCondition.NEW, price: 25, sellerId: users[3].id },
    { title: 'Yoga Mat', description: 'High-quality yoga mat perfect for dorm room workouts and stretching.', category: ItemCategory.OTHER, condition: ItemCondition.LIKE_NEW, price: 20, sellerId: users[4].id },
    { title: 'Bluetooth Speaker', description: 'Portable Bluetooth speaker perfect for dorm parties and study music.', category: ItemCategory.OTHER, condition: ItemCondition.GOOD, price: 40, sellerId: users[0].id },
    { title: 'Desk Lamp LED', description: 'Adjustable LED desk lamp with USB charging port. Perfect for late-night studying.', category: ItemCategory.OTHER, condition: ItemCondition.LIKE_NEW, price: 30, sellerId: users[2].id },
    { title: 'Water Bottle Hydro Flask', description: 'Insulated water bottle keeps drinks cold for 24 hours. Perfect for campus life.', category: ItemCategory.OTHER, condition: ItemCondition.GOOD, price: 25, sellerId: users[1].id },
    { title: 'Planner Academic', description: 'Academic planner for organizing classes, assignments, and activities.', category: ItemCategory.OTHER, condition: ItemCondition.NEW, price: 15, sellerId: users[3].id },
  ]

  for (const listing of listings) {
    await prisma.listing.create({
      data: listing,
    })
  }

  console.log('✅ Seeded 50 listings with 5 users')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })