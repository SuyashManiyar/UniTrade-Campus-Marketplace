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
      
      toast.success('Bid placed successfully!')
      setBidAmount('')
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
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(listing.status)}`}>
                      {listing.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {listing.category.replace('_', ' ')} • {listing.condition.replace('_', ' ')}
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Seller Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-900">{listing.seller.name}</span>
                      {listing.seller.pronouns && (
                        <span className="text-gray-600 ml-2">({listing.seller.pronouns})</span>
                      )}
                    </div>
                    {listing.seller.major && (
                      <div className="text-sm text-gray-600">
                        Major: {listing.seller.major}
                      </div>
                    )}
                    {listing.seller.location && (
                      <div className="text-sm text-gray-600">
                        Location: {listing.seller.location}
                      </div>
                    )}
                    {listing.seller.rating && (
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-400">★</span>
                        <span className="text-gray-600 ml-1">
                          {listing.seller.rating.toFixed(1)} ({listing.seller.ratingCount} reviews)
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Member since {new Date(listing.seller.createdAt).toLocaleDateString()}
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
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-center block hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      💬 Message Seller
                    </Link>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Listing Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posted:</span>
                      <span className="text-gray-900">{formatDate(listing.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="text-gray-900">{formatDate(listing.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900">
                        {listing.type === 'DIRECT_SALE' ? 'Direct Sale' : 'Auction'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="text-gray-900 font-mono text-xs">{listing.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}