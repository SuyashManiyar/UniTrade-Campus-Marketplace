import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { listingSchema, bidSchema } from '../utils/validation';
import { uploadImages, handleUploadError, getFileUrl } from '../middleware/upload';

const router = Router();
const prisma = new PrismaClient();

// Get all listings with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      type,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      status: 'ACTIVE'
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (condition) {
      where.condition = condition;
    }

    if (type) {
      where.type = type;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              rating: true,
              ratingCount: true
            }
          },
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
            include: {
              bidder: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.listing.count({ where })
    ]);

    res.json({
      listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            pronouns: true,
            major: true,
            location: true,
            rating: true,
            ratingCount: true,
            createdAt: true
          }
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            bidder: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
router.post('/', authenticateToken, uploadImages, handleUploadError, async (req: AuthRequest, res: any) => {
  try {
    // Parse form data - numbers need to be converted from strings
    const formData = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      startingBid: req.body.startingBid ? parseFloat(req.body.startingBid) : undefined,
      bidIncrement: req.body.bidIncrement ? parseFloat(req.body.bidIncrement) : undefined,
    };

    const validatedData = listingSchema.parse(formData);
    const userId = req.user!.id;

    // Handle uploaded images
    const imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        imageUrls.push(getFileUrl(file.filename));
      });
    }

    const listingData: any = {
      ...validatedData,
      sellerId: userId,
      images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
    };

    // Handle auction-specific fields
    if (validatedData.type === 'AUCTION') {
      if (!validatedData.startingBid || !validatedData.auctionEndTime) {
        return res.status(400).json({ 
          error: 'Starting bid and auction end time required for auctions' 
        });
      }
      
      listingData.currentBid = validatedData.startingBid;
      listingData.auctionEndTime = new Date(validatedData.auctionEndTime);
    }

    const listing = await prisma.listing.create({
      data: listingData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            rating: true,
            ratingCount: true
          }
        }
      }
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error('Create listing error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }
});

// Update listing
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if listing exists and belongs to user
    const existingListing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.sellerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    if (existingListing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot update inactive listing' });
    }

    const validatedData = listingSchema.partial().parse(req.body);

    const listing = await prisma.listing.update({
      where: { id },
      data: validatedData,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            rating: true,
            ratingCount: true
          }
        }
      }
    });

    res.json(listing);
  } catch (error) {
    console.error('Update listing error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update listing' });
    }
  }
});

// Delete listing
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if listing exists and belongs to user
    const existingListing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.sellerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await prisma.listing.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: 'Listing cancelled successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// Place bid on auction
router.post('/:id/bid', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { amount } = bidSchema.parse(req.body);

    // Get listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.type !== 'AUCTION') {
      return res.status(400).json({ error: 'This is not an auction listing' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Auction is not active' });
    }

    if (listing.sellerId === userId) {
      return res.status(400).json({ error: 'Cannot bid on your own listing' });
    }

    if (listing.auctionEndTime && new Date() > listing.auctionEndTime) {
      return res.status(400).json({ error: 'Auction has ended' });
    }

    // Check if bid is high enough
    const currentHighestBid = listing.currentBid || listing.startingBid || 0;
    const minimumBid = currentHighestBid + (listing.bidIncrement || 1);

    if (amount < minimumBid) {
      return res.status(400).json({ 
        error: `Bid must be at least $${minimumBid}` 
      });
    }

    // Create bid and update listing
    const [bid] = await Promise.all([
      prisma.bid.create({
        data: {
          amount,
          bidderId: userId,
          listingId: id
        },
        include: {
          bidder: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.listing.update({
        where: { id },
        data: { currentBid: amount }
      })
    ]);

    res.status(201).json(bid);
  } catch (error) {
    console.error('Place bid error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to place bid' });
    }
  }
});

// Get user's listings
router.get('/user/my-listings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const listings = await prisma.listing.findMany({
      where: { sellerId: userId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 1,
          include: {
            bidder: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(listings);
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

export default router;