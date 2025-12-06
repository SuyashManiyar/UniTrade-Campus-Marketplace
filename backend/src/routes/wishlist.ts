import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Get user's wishlist
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                rating: true,
                ratingCount: true,
              },
            },
            bids: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(wishlistItems)
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    res.status(500).json({ error: 'Failed to fetch wishlist' })
  }
})

// Add item to wishlist
router.post('/:listingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { listingId } = req.params

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    })

    if (existing) {
      return res.status(400).json({ error: 'Item already in wishlist' })
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        listingId,
      },
    })

    res.status(201).json(wishlistItem)
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    res.status(500).json({ error: 'Failed to add to wishlist' })
  }
})

// Remove item from wishlist
router.delete('/:listingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { listingId } = req.params

    await prisma.wishlist.delete({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    })

    res.json({ message: 'Removed from wishlist' })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    res.status(500).json({ error: 'Failed to remove from wishlist' })
  }
})

// Check if item is in wishlist
router.get('/check/:listingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { listingId } = req.params

    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    })

    res.json({ inWishlist: !!wishlistItem })
  } catch (error) {
    console.error('Error checking wishlist:', error)
    res.status(500).json({ error: 'Failed to check wishlist' })
  }
})

export default router
