'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface Listing {
  id: string
  title: string
  description: string
  category: string
  condition: string
  price?: number
  type: string
  status: string
  startingBid?: number
  currentBid?: number
  bidIncrement?: number
  auctionEndTime?: string
  createdAt: string
  updatedAt: string
  images?: string | null
  seller: {
    id: string
    name: string
    pronouns?: string
    major?: string
    location?: string
    rating?: number
    ratingCount: number
    createdAt: string
  }
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      id: string
      name: string
    }
  }>
}



export default function ListingDetail() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)
  const [showBidLeaderboard, setShowBidLeaderboard] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Helper function to get all images from images JSON
  const getAllImages = (images: string | null | undefined): string[] => {
    if (!images) return []
    try {
      const imageArray = JSON.parse(images)
      if (Array.isArray(imageArray)) {
        return imageArray.map(imageUrl => {
          // If URL is relative, make it absolute
          if (imageUrl.startsWith('/uploads/')) {
            const filename = imageUrl.replace('/uploads/', '')
            const encodedFilename = encodeURIComponent(filename)
            return `http://localhost:8080/uploads/${encodedFilename}`
          }
          return imageUrl
        })
      }
      return []
    } catch {
      return []
    }
  }

  // Helper function to get the first image from images JSON
  const getFirstImage = (images: string | null | undefined): string | null => {
    const allImages = getAllImages(images)
    return allImages.length > 0 ? allImages[0] : null
  }

  // Helper function to get category icon
  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'ELECTRONICS': '📱',
      'FURNITURE': '🪑',
      'TEXTBOOKS': '📚',
      'BIKES': '🚲',
      'CLOTHING': '👕',
      'OTHER': '📦'
    }
    return icons[category] || '📦'
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && listingId) {
      fetchListing()

      // Set up polling for real-time updates (every 5 seconds)
      const pollInterval = setInterval(() => {
        fetchListing()
      }, 5000)

      // Cleanup interval on unmount
      return () => clearInterval(pollInterval)
    }
  }, [user, isLoading, router, listingId])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${listingId}`)
      setListing(response.data)
    } catch (error) {
      toast.error('Failed to fetch listing')
      router.push('/marketplace/listings')
    } finally {
      setLoading(false)
    }
  }

  const createConfetti = () => {
    const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6']
    const confettiCount = 50

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div')
      confetti.className = 'confetti'
      confetti.style.left = Math.random() * 100 + '%'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.animationDelay = Math.random() * 0.5 + 's'
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's'
      document.body.appendChild(confetti)

      setTimeout(() => confetti.remove(), 3500)
    }
  }

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    try {
      setSubmittingBid(true)
      await api.post(`/listings/${listingId}/bid`, {
        amount: parseFloat(bidAmount)
      })

      // Show celebration animation
      setShowCelebration(true)
      createConfetti()

      toast.success('Bid placed successfully!')
      setBidAmount('')

      // Hide celebration after 2 seconds
      setTimeout(() => {
        setShowCelebration(false)
      }, 2000)

      fetchListing() // Refresh listing data
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place bid')
    } finally {
      setSubmittingBid(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SOLD':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isAuctionEnded = (endTime?: string) => {
    if (!endTime) return false
    return new Date() > new Date(endTime)
  }

  const getMinimumBid = () => {
    if (!listing) return 0
    const currentBid = listing.currentBid || listing.startingBid || 0
    const increment = listing.bidIncrement || 1
    return currentBid + increment
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
      </div>
    )
  }

  if (!user || !listing) {
    return null
  }

  const isOwner = listing.seller.id === user.id
  const canBid = listing.type === 'AUCTION' &&
    listing.status === 'ACTIVE' &&
    !isOwner &&
    !isAuctionEnded(listing.auctionEndTime)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/marketplace" className="text-xl font-bold text-umass-maroon">
                UMass Marketplace
              </Link>
              <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon">
                Browse Listings
              </Link>
              <Link href="/marketplace/my-listings" className="text-gray-700 hover:text-umass-maroon">
                My Listings
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}!</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Back Button */}
          <Link
            href="/marketplace/listings"
            className="text-umass-maroon hover:text-red-800 mb-6 inline-block"
          >
            ← Back to Listings
          </Link>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{listing.title}</h1>
                  <div className="flex items-center flex-wrap gap-3">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {getCategoryIcon(listing.category)} {listing.category.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${listing.condition === 'NEW' ? 'bg-green-100 text-green-800' :
                      listing.condition === 'LIKE_NEW' ? 'bg-emerald-100 text-emerald-800' :
                        listing.condition === 'GOOD' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-orange-100 text-orange-800'
                      }`}>
                      ✨ {listing.condition.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Price/Bid Info */}
                <div className="text-right">
                  {listing.type === 'DIRECT_SALE' && listing.price && (
                    <div className="text-3xl font-bold text-umass-maroon">
                      ${listing.price}
                    </div>
                  )}
                  {listing.type === 'AUCTION' && (
                    <div>
                      {listing.currentBid ? (
                        <div>
                          <div className="text-sm text-gray-500">Current Bid</div>
                          <div className="text-3xl font-bold text-green-600">
                            ${listing.currentBid}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-500">Starting Bid</div>
                          <div className="text-3xl font-bold text-umass-maroon">
                            ${listing.startingBid}
                          </div>
                        </div>
                      )}
                      {listing.auctionEndTime && (
                        <div className="text-sm text-gray-500 mt-1">
                          {isAuctionEnded(listing.auctionEndTime) ? 'Auction Ended' : 'Ends'}: {formatDate(listing.auctionEndTime)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 p-6">
              {/* Main Content */}
              <div className="md:col-span-2 space-y-6">
                {/* Image Gallery Section */}
                <div>
                  {(() => {
                    const allImages = getAllImages(listing.images)

                    if (allImages.length === 0) {
                      // No images - show placeholder
                      return (
                        <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                          <div className="flex absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">{getCategoryIcon(listing.category)}</div>
                              <div className="text-sm">No image available</div>
                              <div className="text-xs mt-1">{listing.category.replace('_', ' ')}</div>
                            </div>
                          </div>
                        </div>
                      )
                    } else if (allImages.length === 1) {
                      // Single image - show large
                      return (
                        <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={allImages[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <div className="text-center text-gray-500">
                              <div className="text-4xl mb-2">{getCategoryIcon(listing.category)}</div>
                              <div className="text-sm">Image failed to load</div>
                            </div>
                          </div>
                        </div>
                      )
                    } else {
                      // Multiple images - show gallery
                      return (
                        <div className="space-y-4">
                          {/* Main large image */}
                          <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={allImages[0]}
                              alt={`${listing.title} - Image 1`}
                              className="main-listing-image w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                            <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <div className="text-center text-gray-500">
                                <div className="text-4xl mb-2">{getCategoryIcon(listing.category)}</div>
                                <div className="text-sm">Image failed to load</div>
                              </div>
                            </div>
                            {/* Image counter badge */}
                            <div className="image-counter absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                              1 / {allImages.length}
                            </div>
                          </div>

                          {/* Thumbnail grid */}
                          <div className="grid grid-cols-4 gap-2">
                            {allImages.map((imageUrl, index) => (
                              <div key={index} className="relative h-16 bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-75 transition-opacity">
                                <img
                                  src={imageUrl}
                                  alt={`${listing.title} - Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onClick={() => {
                                    // Update main image when thumbnail is clicked
                                    const mainImage = document.querySelector('.main-listing-image') as HTMLImageElement
                                    const counter = document.querySelector('.image-counter')
                                    if (mainImage) {
                                      mainImage.src = imageUrl
                                      mainImage.alt = `${listing.title} - Image ${index + 1}`
                                    }
                                    if (counter) {
                                      counter.textContent = `${index + 1} / ${allImages.length}`
                                    }
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                                {/* Active thumbnail indicator */}
                                {index === 0 && (
                                  <div className="absolute inset-0 border-2 border-umass-maroon rounded"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">📝</span>
                    Description
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                </div>

                {/* Auction Details */}
                {listing.type === 'AUCTION' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Starting Bid:</span>
                        <span className="font-medium text-gray-900">${listing.startingBid}</span>
                      </div>
                      {listing.currentBid && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Bid:</span>
                          <span className="font-medium text-green-600">${listing.currentBid}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bid Increment:</span>
                        <span className="font-medium text-gray-900">${listing.bidIncrement || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Bids:</span>
                        <span className="font-medium text-gray-900">{listing.bids.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bid History */}
                {listing.type === 'AUCTION' && listing.bids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bid History</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {listing.bids.map((bid) => (
                          <div key={bid.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <span className="font-medium text-gray-900">{bid.bidder.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {formatDate(bid.createdAt)}
                              </span>
                            </div>
                            <span className="font-bold text-green-600">${bid.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bidding Leaderboard for this Product */}
                {listing.type === 'AUCTION' && listing.bids.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <span className="text-2xl mr-2">🏆</span>
                        Bidding Leaderboard
                      </h3>
                      <button
                        onClick={() => setShowBidLeaderboard(!showBidLeaderboard)}
                        className="text-umass-maroon hover:text-red-800 font-medium text-sm"
                      >
                        {showBidLeaderboard ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {showBidLeaderboard && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300 shadow-lg">
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {(() => {
                            // Group bids by bidder and count their bids
                            const bidderStats = listing.bids.reduce((acc: any, bid) => {
                              const bidderId = bid.bidder.id
                              if (!acc[bidderId]) {
                                acc[bidderId] = {
                                  bidder: bid.bidder,
                                  bidCount: 0,
                                  highestBid: 0
                                }
                              }
                              acc[bidderId].bidCount++
                              if (bid.amount > acc[bidderId].highestBid) {
                                acc[bidderId].highestBid = bid.amount
                              }
                              return acc
                            }, {})

                            // Convert to array and sort by bid count, then by highest bid
                            const sortedBidders = Object.values(bidderStats).sort((a: any, b: any) => {
                              if (b.bidCount !== a.bidCount) {
                                return b.bidCount - a.bidCount
                              }
                              return b.highestBid - a.highestBid
                            })

                            const isAuctionEnded = listing.auctionEndTime && new Date() > new Date(listing.auctionEndTime)
                            const highestBidder = sortedBidders[0]

                            return sortedBidders.map((stats: any, index: number) => {
                              const isWinner = isAuctionEnded && index === 0
                              const isCurrentUser = stats.bidder.id === user.id

                              return (
                                <div
                                  key={stats.bidder.id}
                                  className={`p-3 rounded-lg ${isWinner ? 'bg-gradient-to-r from-green-200 to-green-300 border-2 border-green-500' :
                                    index === 0 ? 'bg-gradient-to-r from-yellow-200 to-yellow-300 border-2 border-yellow-400' :
                                      index === 1 ? 'bg-gradient-to-r from-gray-200 to-gray-300 border-2 border-gray-400' :
                                        index === 2 ? 'bg-gradient-to-r from-orange-200 to-orange-300 border-2 border-orange-400' :
                                          'bg-white border border-gray-200'
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <span className={`text-xl font-bold ${isWinner ? 'text-green-600' :
                                        index === 0 ? 'text-yellow-600' :
                                          index === 1 ? 'text-gray-600' :
                                            index === 2 ? 'text-orange-600' :
                                              'text-gray-500'
                                        }`}>
                                        {isWinner ? '👑' : index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                      </span>
                                      <div>
                                        <div className="font-semibold text-gray-900">
                                          {stats.bidder.name}
                                          {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                                          {isWinner && <span className="ml-2 text-xs font-bold text-green-600">WINNER!</span>}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {stats.bidCount} bid{stats.bidCount !== 1 ? 's' : ''}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right flex items-center space-x-2">
                                      <div>
                                        <div className="text-lg font-bold text-green-600">
                                          ${stats.highestBid.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">Highest Bid</div>
                                      </div>
                                      {/* Seller can message bidders */}
                                      {isOwner && !isCurrentUser && (
                                        <Link
                                          href={`/messages/${listing.id}/${stats.bidder.id}`}
                                          className={`px-3 py-1 rounded text-xs transition-colors ${isWinner
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                          title={isWinner ? 'Contact winner' : 'Message bidder'}
                                        >
                                          {isWinner ? '📧 Contact' : '💬'}
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Seller Info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">👤</span>
                    Seller Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">{listing.seller.name}</span>
                      {listing.seller.pronouns && (
                        <span className="text-gray-600 ml-2 text-sm">({listing.seller.pronouns})</span>
                      )}
                    </div>
                    {listing.seller.rating && (
                      <div className="flex items-center bg-white rounded-md px-3 py-2 border border-yellow-200">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < Math.round(listing.seller.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-700 ml-2 font-medium">
                          {listing.seller.rating.toFixed(1)} ({listing.seller.ratingCount})
                        </span>
                      </div>
                    )}
                    {listing.seller.major && (
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">🎓</span>
                        <span className="font-medium">{listing.seller.major}</span>
                      </div>
                    )}
                    {listing.seller.location && (
                      <div className="flex items-center text-sm text-gray-700">
                        <span className="mr-2">📍</span>
                        <span className="font-medium">{listing.seller.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-blue-200">
                      <span className="mr-2">📅</span>
                      Member since {new Date(listing.seller.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* Bidding Form */}
                  {canBid && (
                    <form onSubmit={handleBid} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Your Bid (minimum: ${getMinimumBid()})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={getMinimumBid()}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`$${getMinimumBid()}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingBid}
                        className="w-full bg-umass-maroon text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
                      >
                        {submittingBid ? 'Placing Bid...' : 'Place Bid'}
                      </button>
                    </form>
                  )}

                  {/* Contact Seller */}
                  {!isOwner && (
                    <Link
                      href={`/messages/${listing.id}/${listing.seller.id}`}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg text-center block hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      💬 Message Seller
                    </Link>
                  )}

                  {/* Report Listing */}
                  {!isOwner && (
                    <button
                      onClick={() => toast.error('Report feature coming soon!')}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-center hover:bg-gray-200 focus:outline-none text-sm font-medium"
                    >
                      🚩 Report Listing
                    </button>
                  )}

                  {/* Edit/Delete for Owner */}
                  {isOwner && listing.status === 'ACTIVE' && (
                    <div className="space-y-2">
                      <Link
                        href={`/marketplace/edit-listing/${listing.id}`}
                        className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-md text-center block hover:bg-blue-200"
                      >
                        Edit Listing
                      </Link>
                    </div>
                  )}
                </div>

                {/* Listing Details */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    Listing Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center">
                        <span className="mr-2">📅</span>
                        Posted
                      </span>
                      <span className="text-gray-900 font-medium text-right">
                        {new Date(listing.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center">
                        <span className="mr-2">🔄</span>
                        Updated
                      </span>
                      <span className="text-gray-900 font-medium text-right">
                        {new Date(listing.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-2">
                      <span className="text-gray-600 flex items-center">
                        <span className="mr-2">{listing.type === 'DIRECT_SALE' ? '💰' : '⚡'}</span>
                        Type
                      </span>
                      <span className="text-gray-900 font-medium">
                        {listing.type === 'DIRECT_SALE' ? 'Direct Sale' : 'Auction'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="bid-celebration-overlay">
          <div className="bid-celebration-content">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-umass-maroon mb-2">Bid Placed!</h2>
            <p className="text-gray-600 text-lg">Your bid has been successfully placed</p>
          </div>
        </div>
      )}
    </div>
  )
}