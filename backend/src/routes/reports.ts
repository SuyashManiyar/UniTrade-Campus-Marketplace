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

    if (!listingId || !reason) {
      return res.status(400).json({ error: 'Listing ID and reason are required' })
    }

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
    })

    // Count total reports for this listing
    const reportCount = await prisma.report.count({
      where: { listingId },
    })

    // Auto-moderation - Hide listing from public view
    let autoAction = null
    if (reportCount >= 2 && listing.status === 'ACTIVE') {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'UNDER_REVIEW' },
      })
      autoAction = 'UNDER_REVIEW'
      console.log(`⚠️  Listing ${listingId} hidden and under review after ${reportCount} reports`)
    }

    res.status(201).json({ ...report, reportCount, autoAction })
  } catch (error) {
    console.error('Error creating report:', error)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// Get all reports (Admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!

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

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get the report to find the listing
    const report = await prisma.report.findUnique({
      where: { id },
      include: { listing: true },
    })

    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // Delete the report
    await prisma.report.delete({
      where: { id },
    })

    // Check if there are any remaining reports for this listing
    const remainingReports = await prisma.report.count({
      where: { listingId: report.listingId! },
    })

    // If no more reports and listing is under review, restore it to ACTIVE
    if (remainingReports === 0 && report.listing?.status === 'UNDER_REVIEW') {
      await prisma.listing.update({
        where: { id: report.listingId! },
        data: { status: 'ACTIVE' },
      })
      console.log(`✅ Listing ${report.listingId} restored to ACTIVE (no remaining reports)`)
    }

    res.json({ message: 'Report dismissed', remainingReports })
  } catch (error) {
    console.error('Error deleting report:', error)
    res.status(500).json({ error: 'Failed to delete report' })
  }
})

// Dismiss all reports for a listing and restore it (Admin only)
router.post('/dismiss-all/:listingId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user!
    const { listingId } = req.params

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Delete all reports for this listing
    const deleted = await prisma.report.deleteMany({
      where: { listingId },
    })

    // Restore listing to ACTIVE if it was under review
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    })

    if (listing && listing.status === 'UNDER_REVIEW') {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'ACTIVE' },
      })
    }

    res.json({ 
      message: 'All reports dismissed and listing restored', 
      deletedCount: deleted.count 
    })
  } catch (error) {
    console.error('Error dismissing all reports:', error)
    res.status(500).json({ error: 'Failed to dismiss reports' })
  }
})

export default router
