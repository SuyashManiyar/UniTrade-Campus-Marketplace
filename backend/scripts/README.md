# Seed Script with Images

This script seeds the database with realistic dummy data using actual product images.

## Features

- Creates 5 users (Naveen, Sreehitha, Suyash, Rohit, Chetan)
- Creates 30 listings with real product images
- Generates reviews, ratings, wishlist items, and messages
- Copies images from source directory to uploads folder
- Creates realistic marketplace data with varied statuses (active, sold, etc.)

## Usage

```bash
cd backend
npm run seed:images
```

## Users Created

The following users will be created:
- naveen - njarpla@umass.edu
- Sreehitha - snarayana@umass.edu
- Suyash - smanayar@umass.edu
- Rohit - rtumati@umass.edu
- Chetan - cmadadi@umass.edu

## What Gets Created

- **30 Listings**: Various categories (Electronics, Furniture, Textbooks, Bikes, Clothing)
- **Reviews**: Random reviews between users with 4-5 star ratings
- **Wishlist Items**: Each user has 3 random items in their wishlist
- **Messages**: Sample conversations between buyers and sellers
- **Images**: All product images copied to uploads folder

## Categories Included

- 📱 Electronics (iPhone, iPad, Camera, Echo, etc.)
- 🛋️ Furniture (Chairs, Mattress, Mini Fridge, etc.)
- 📚 Textbooks (Various book collections)
- 🚴 Bikes (Mountain, Road, Hybrid, Cruiser)
- 👕 Clothing (Jackets, Jeans, Shoes, T-shirts)
- 🏷️ Other (Guitar, Dumbbells, Shower Stool, etc.)

## Note

The script will:
1. Clear all existing data (users, listings, reviews, etc.)
2. Create fresh data with the images
3. Copy images from the source directory to `backend/uploads/`

Make sure your backend server is not running when you execute this script.
