import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Create a report
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { listingId, reason, details } = req.body

    // Validate input
    if (!listingId || !reason) {
      return res.status(400).json({ error: 'Listing ID and reason are required' })
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' })
    }

    // Check if user already reported this listing
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: userId,
        listingId,
      },
    })

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this listing' })
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        listingId,
        reason,
        details: details || null,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    })

    // Count total reports for this listing
    const reportCount = await prisma.report.count({
      where: { listingId },
    })

    // Auto-moderation based on report count
    let autoAction = null
    if (reportCount >= 5 && listing.status === 'ACTIVE') {
      // 5+ reports: Auto-suspend
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'CANCELLED' },
      })
      autoAction = 'SUSPENDED'
      console.log(`🚨 Listing ${listingId} auto-suspended after ${reportCount} reports`)
    } else if (reportCount >= 3 && listing.status === 'ACTIVE') {
      // 3+ reports: Flag for review (you could add a new status like UNDER_REVIEW)
      autoAction = 'FLAGGED'
      console.log(`⚠️  Listing ${listingId} flagged for review after ${reportCount} reports`)
    }

    res.status(201).json({
      ...report,
      reportCount,
      autoAction,
    })
  } catch (error) {
    console.error('Error creating report:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// Get all reports (Admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            status: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    res.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// Delete a report (Admin only)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!
    const { id } = req.params

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    await prisma.report.delete({
      where: { id },
    })

    res.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting report:', error)
    res.status(500).json({ error: 'Failed to delete report' })
  }
})

export default router
