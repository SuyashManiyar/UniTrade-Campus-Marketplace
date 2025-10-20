import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  pronouns: z.string().optional(),
  major: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  revieweeId: z.string(),
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        pronouns: true,
        major: true,
        location: true,
        bio: true,
        role: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            receivedReviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        pronouns: true,
        major: true,
        location: true,
        bio: true,
        role: true,
        rating: true,
        ratingCount: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
});

// Get user by ID (public profile)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        pronouns: true,
        major: true,
        location: true,
        bio: true,
        rating: true,
        ratingCount: true,
        createdAt: true,
        _count: {
          select: {
            listings: {
              where: { status: 'ACTIVE' }
            },
            receivedReviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: id },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.review.count({
        where: { revieweeId: id }
      })
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a review
router.post('/reviews', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { rating, comment, revieweeId } = reviewSchema.parse(req.body);

    if (userId === revieweeId) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_revieweeId: {
          reviewerId: userId,
          revieweeId
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this user' });
    }

    // Verify reviewee exists
    const reviewee = await prisma.user.findUnique({
      where: { id: revieweeId }
    });

    if (!reviewee) {
      return res.status(404).json({ error: 'User to review not found' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        reviewerId: userId,
        revieweeId
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update user's average rating
    const reviews = await prisma.review.findMany({
      where: { revieweeId },
      select: { rating: true }
    });

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        rating: averageRating,
        ratingCount: reviews.length
      }
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create review' });
    }
  }
});

// Get user's active listings
router.get('/:id/listings', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: {
          sellerId: id,
          status: 'ACTIVE'
        },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.listing.count({
        where: {
          sellerId: id,
          status: 'ACTIVE'
        }
      })
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
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Failed to fetch user listings' });
  }
});

export default router;