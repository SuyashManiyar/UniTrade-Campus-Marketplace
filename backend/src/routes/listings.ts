import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { listingSchema, bidSchema } from '../utils/validation';
import { uploadImages, handleUploadError, getFileUrl } from '../middleware/upload';
import { nlpService } from '../services/nlpService';
import { emitBidUpdate, emitListingUpdate } from '../socket/socket';

const router = Router();
const prisma = new PrismaClient();

// Clear NLP cache on server start (useful after prompt changes)
nlpService.clearCache();
console.log('🧹 NLP cache cleared on startup');

// NLP-enhanced search endpoint
router.post('/nlp-search', async (req, res) => {
  try {
    const { query, page = '1', limit = '20' } = req.body;
    console.log('\n🌐 [API] NLP Search endpoint called');
    console.log('📝 [API] Query:', query);

    if (!query || typeof query !== 'string') {
      console.log('❌ [API] Invalid query parameter');
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Parse natural language query using NLP service
    const parsedQuery = await nlpService.parseQuery(query);
    console.log('🎯 [API] Parsed query result:', JSON.stringify(parsedQuery, null, 2));

    // Input validation
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause from parsed query
    const where: any = {
      status: 'ACTIVE'
    };

    // Apply extracted filters
    if (parsedQuery.category) {
      where.category = parsedQuery.category;
    }

    if (parsedQuery.condition) {
      where.condition = parsedQuery.condition;
    }

    // Price range filter
    if (parsedQuery.minPrice !== undefined || parsedQuery.maxPrice !== undefined) {
      where.price = {};
      if (parsedQuery.minPrice !== undefined) {
        where.price.gte = parsedQuery.minPrice;
      }
      if (parsedQuery.maxPrice !== undefined) {
        where.price.lte = parsedQuery.maxPrice;
      }
    }

    // Keyword search in title and description (SQLite compatible)
    if (parsedQuery.keywords.length > 0) {
      where.OR = parsedQuery.keywords.flatMap(keyword => [
        { title: { contains: keyword } },
        { description: { contains: keyword } }
      ]);
    }

    // Execute queries in parallel
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              rating: true,
              ratingCount: true,
              location: true
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
          },
          _count: {
            select: { bids: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.listing.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    console.log('📊 [API] Database query results:');
    console.log('   Total listings found:', total);
    console.log('   Returning:', listings.length, 'listings');
    console.log('   Fallback used:', parsedQuery.confidence === 0);

    res.json({
      listings,
      extractedFilters: {
        keywords: parsedQuery.keywords,
        category: parsedQuery.category,
        condition: parsedQuery.condition,
        minPrice: parsedQuery.minPrice,
        maxPrice: parsedQuery.maxPrice,
        confidence: parsedQuery.confidence
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNextPage,
        hasPrevPage
      },
      fallbackUsed: parsedQuery.confidence === 0
    });
  } catch (error) {
    console.error('NLP search error:', error);
    res.status(500).json({
      error: 'Failed to process search query',
      message: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
  }
});

// Get all listings with advanced filters and search
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      status,
      minPrice,
      maxPrice,
      type,
      sortBy = 'newest',
      page = '1',
      limit = '20'
    } = req.query;

    // Input validation
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20)); // Max 50 items per page
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Status filter - exclude UNDER_REVIEW from public view
    if (status && typeof status === 'string') {
      const validStatuses = ['ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED'];
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }
    } else {
      // If no status specified, show all EXCEPT UNDER_REVIEW
      where.status = {
        not: 'UNDER_REVIEW'
      };
    }

    // Simple search functionality (SQLite compatible)
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = search.trim();

      // Search only in title and description (category is enum-based)
      where.OR = [
        { title: { startsWith: searchTerm } },
        { description: { startsWith: searchTerm } }
      ];
    }

    // Category filter
    if (category && typeof category === 'string') {
      const validCategories = ['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER'];
      if (validCategories.includes(category.toUpperCase())) {
        where.category = category.toUpperCase();
      }
    }

    // Condition filter
    if (condition && typeof condition === 'string') {
      const validConditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];
      if (validConditions.includes(condition.toUpperCase())) {
        where.condition = condition.toUpperCase();
      }
    }

    // Type filter
    if (type && typeof type === 'string') {
      const validTypes = ['DIRECT_SALE', 'AUCTION'];
      if (validTypes.includes(type.toUpperCase())) {
        where.type = type.toUpperCase();
      }
    }

    // Price range filter with validation
    if (minPrice || maxPrice) {
      where.price = {};

      if (minPrice) {
        const min = parseFloat(minPrice as string);
        if (!isNaN(min) && min >= 0) {
          where.price.gte = min;
        }
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        if (!isNaN(max) && max >= 0) {
          where.price.lte = max;

          // Ensure minPrice <= maxPrice
          if (where.price.gte && max < where.price.gte) {
            return res.status(400).json({
              error: 'Maximum price must be greater than or equal to minimum price'
            });
          }
        }
      }
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' }; // Default: newest first

    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'price_low':
        orderBy = { price: 'asc' };
        break;
      case 'price_high':
        orderBy = { price: 'desc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'popular':
        // Sort by wishlist count (most wishlisted first)
        orderBy = { wishlists: { _count: 'desc' } };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute queries in parallel for better performance
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              rating: true,
              ratingCount: true,
              location: true
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
          },
          _count: {
            select: { 
              bids: true,
              wishlists: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.listing.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      listings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search: search || null,
        category: category || null,
        condition: condition || null,
        status: status || 'ALL',
        minPrice: minPrice ? parseFloat(minPrice as string) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : null,
        type: type || null,
        sortBy: sortBy || 'newest'
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('Invalid')) {
        return res.status(400).json({ error: 'Invalid search parameters' });
      }
    }

    res.status(500).json({
      error: 'Failed to fetch listings',
      message: process.env.NODE_ENV === 'development' ? error : 'Internal server error'
    });
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

// Update listing status (seller only - for their own listings)
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { status } = req.body;

    // Validate status
    if (!['ACTIVE', 'SOLD', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Allowed: ACTIVE, SOLD, CANCELLED' });
    }

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

    // Update the listing status
    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
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
          select: {
            bidderId: true,
            bidder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Send notifications to bidders if status changed to SOLD or CANCELLED
    if ((status === 'SOLD' || status === 'CANCELLED') && listing.bids.length > 0) {
      const uniqueBidders = Array.from(new Set(listing.bids.map(bid => bid.bidderId)));

      const notificationTitle = status === 'SOLD'
        ? 'Item Sold'
        : 'Listing Cancelled';

      const notificationMessage = status === 'SOLD'
        ? `The item "${listing.title}" you bid on has been sold.`
        : `The listing "${listing.title}" you bid on has been cancelled by the seller.`;

      // Create notifications for all bidders
      await Promise.all(
        uniqueBidders.map(bidderId =>
          prisma.notification.create({
            data: {
              userId: bidderId,
              title: notificationTitle,
              message: notificationMessage,
              type: status === 'SOLD' ? 'LISTING_SOLD' : 'LISTING_CANCELLED',
              listingId: id
            }
          })
        )
      );

      console.log(`📢 Sent ${status} notifications to ${uniqueBidders.length} bidders for listing: ${listing.title}`);
    }

    res.json({
      message: `Listing marked as ${status}`,
      listing
    });
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({ error: 'Failed to update listing status' });
  }
});

// Delete listing
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if listing exists and belongs to user
    const existingListing = await prisma.listing.findUnique({
      where: { id },
      include: {
        bids: {
          select: {
            bidderId: true
          }
        }
      }
    });

    if (!existingListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (existingListing.sellerId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    // Update listing status to CANCELLED
    const listing = await prisma.listing.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Send notifications to bidders
    if (existingListing.bids.length > 0) {
      const uniqueBidders = Array.from(new Set(existingListing.bids.map(bid => bid.bidderId)));

      // Create notifications for all bidders
      await Promise.all(
        uniqueBidders.map(bidderId =>
          prisma.notification.create({
            data: {
              userId: bidderId,
              title: '❌ Listing Cancelled',
              message: `The listing "${existingListing.title}" you bid on has been cancelled by the seller.`,
              type: 'LISTING_CANCELLED',
              listingId: id
            }
          })
        )
      );

      console.log(`📢 Sent CANCELLED notifications to ${uniqueBidders.length} bidders for listing: ${existingListing.title}`);
    }

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
    const [bid, updatedListing] = await Promise.all([
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
        data: { currentBid: amount },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            include: {
              bidder: {
                select: { id: true, name: true }
              }
            }
          },
          _count: {
            select: { bids: true }
          }
        }
      })
    ]);

    // Emit real-time update to all users viewing this listing
    emitBidUpdate(id, {
      bid: {
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        bidder: bid.bidder
      },
      listing: {
        id: updatedListing.id,
        currentBid: updatedListing.currentBid,
        bidCount: updatedListing._count.bids
      },
      bids: updatedListing.bids
    });

    // Emit listing update for marketplace pages
    emitListingUpdate(id, {
      id: updatedListing.id,
      currentBid: updatedListing.currentBid,
      _count: { bids: updatedListing._count.bids }
    });

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

// Get top 10 bidding leaderboard
router.get('/leaderboard/top-bidders', async (req, res) => {
  try {
    const topBidders = await prisma.bid.groupBy({
      by: ['bidderId'],
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    });

    // Get bidder details
    const leaderboard = await Promise.all(
      topBidders.map(async (bidder) => {
        const user = await prisma.user.findUnique({
          where: { id: bidder.bidderId },
          select: {
            id: true,
            name: true,
            rating: true,
            ratingCount: true
          }
        });

        return {
          bidder: user,
          totalBidAmount: bidder._sum.amount || 0,
          totalBids: bidder._count.id
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;