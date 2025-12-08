'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import NotificationBell from '@/components/NotificationBell'

interface Listing {
  id: string
  title: string
  description: string
  price?: number
  category: string
  condition: string
  type: string
  status: string
  createdAt: string
  images?: string | null
  currentBid?: number
  startingBid?: number
  bids: Array<{
    amount: number
    bidder: {
      id: string
      name: string
    }
  }>
}

// ListingCard component to avoid code duplication
function ListingCard({ listing, firstImage, onDelete, onMarkAsSold }: {
  listing: Listing,
  firstImage: string | null,
  onDelete: (id: string) => void,
  onMarkAsSold: (id: string) => void
}) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SOLD':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-40 bg-gray-100">
        {firstImage ? (
          <img
            src={firstImage}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}

        {/* Fallback placeholder */}
        <div className={`${firstImage ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}>
          <div className="text-center">
            <div className="text-3xl mb-1">{getCategoryIcon(listing.category)}</div>
            <div className="text-xs text-gray-500">
              {listing.category.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {listing.title}
          </h3>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {listing.description}
        </p>

        <div className="space-y-2 mb-4 flex-grow">
          {listing.type === 'DIRECT_SALE' && listing.price && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price:</span>
              <span className="font-medium text-umass-maroon">${listing.price}</span>
            </div>
          )}
          {listing.type === 'AUCTION' && (
            <>
              {listing.startingBid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Starting Bid:</span>
                  <span className="font-medium text-gray-900">${listing.startingBid}</span>
                </div>
              )}
              {listing.currentBid && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Bid:</span>
                  <span className="font-medium text-green-600">${listing.currentBid}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="flex items-center text-gray-900">
              <span className="mr-1">{getCategoryIcon(listing.category)}</span>
              {listing.category.replace('_', ' ')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Condition:</span>
            <span className="text-gray-900">{listing.condition.replace('_', ' ')}</span>
          </div>
          {listing.bids.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bids:</span>
              <span className="font-medium text-blue-600">{listing.bids.length}</span>
            </div>
          )}
        </div>

        {/* Bottom section - always at bottom */}
        <div className="mt-auto">
          <div className="text-xs text-gray-500 mb-4">
            Created: {new Date(listing.createdAt).toLocaleDateString()}
          </div>

          <div className="space-y-2">
            <div className="flex space-x-2">
              <Link
                href={`/marketplace/listings/${listing.id}`}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200"
              >
                View
              </Link>
              {listing.status === 'ACTIVE' && (
                <Link
                  href={`/marketplace/edit-listing/${listing.id}`}
                  className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm text-center hover:bg-blue-200"
                >
                  Edit
                </Link>
              )}
            </div>
            {listing.status === 'ACTIVE' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onMarkAsSold(listing.id)}
                  className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded text-sm hover:bg-green-200 font-medium"
                >
                  ✓ Mark as Sold
                </button>
                <button
                  onClick={() => onDelete(listing.id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyListings() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  // Helper function to get the first image from images JSON
  const getFirstImage = (images: string | null | undefined): string | null => {
    if (!images) return null
    try {
      const imageArray = JSON.parse(images)
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        let imageUrl = imageArray[0]

        // If URL is relative, make it absolute
        if (imageUrl.startsWith('/uploads/')) {
          // Extract filename and encode it properly
          const filename = imageUrl.replace('/uploads/', '')
          const encodedFilename = encodeURIComponent(filename)
          const fullUrl = `http://localhost:8080/uploads/${encodedFilename}`
          return fullUrl
        }
        return imageUrl
      }
      return null
    } catch {
      return null
    }
  }



  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      fetchMyListings()
    }
  }, [user])

  const fetchMyListings = async () => {
    try {
      const response = await fetch('/api/listings/user/my-listings')
      if (response.ok) {
        const data = await response.json()
        setListings(data)
      } else {
        toast.error('Failed to fetch your listings')
      }
    } catch (error) {
      toast.error('An error occurred while fetching your listings')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsSold = async (listingId: string) => {
    if (!confirm('Mark this item as SOLD? This will notify buyers that the item is no longer available.')) {
      return
    }

    try {
      const response = await fetch(`/api/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SOLD' }),
      })

      if (response.ok) {
        toast.success('Listing marked as SOLD!')
        // Update the listing in the state
        setListings(listings.map(listing =>
          listing.id === listingId
            ? { ...listing, status: 'SOLD' }
            : listing
        ))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to mark as sold')
      }
    } catch (error) {
      toast.error('An error occurred while updating the listing')
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to cancel this listing?')) {
      return
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Listing cancelled successfully')
        // Update the listing status instead of removing it
        setListings(listings.map(listing =>
          listing.id === listingId
            ? { ...listing, status: 'CANCELLED' }
            : listing
        ))
      } else {
        toast.error('Failed to cancel listing')
      }
    } catch (error) {
      toast.error('An error occurred while cancelling the listing')
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/marketplace" className="text-xl font-bold text-umass-maroon">
                UniTrade
              </Link>
              <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon">
                Browse Listings
              </Link>
              <span className="text-umass-maroon font-medium">My Listings</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}!</span>
              <NotificationBell />
              <Link
                href="/profile"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                title="Edit Profile"
              >
                👤 Profile
              </Link>
              <Link
                href="/marketplace/create-listing"
                className="bg-umass-maroon text-white px-4 py-2 rounded-md hover:bg-red-800"
              >
                Post Item
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-4">Start selling by creating your first listing!</p>
              <Link
                href="/marketplace/create-listing"
                className="bg-umass-maroon text-white px-4 py-2 rounded-md hover:bg-red-800"
              >
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Listings */}
              {(() => {
                const activeListings = listings.filter(listing => listing.status === 'ACTIVE' || listing.status === 'SOLD')
                return activeListings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Active Listings ({activeListings.length})
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {activeListings.map((listing) => {
                        const firstImage = getFirstImage(listing.images)
                        return (
                          <ListingCard
                            key={listing.id}
                            listing={listing}
                            firstImage={firstImage}
                            onDelete={handleDeleteListing}
                            onMarkAsSold={handleMarkAsSold}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Cancelled Listings */}
              {(() => {
                const cancelledListings = listings.filter(listing => listing.status === 'CANCELLED' || listing.status === 'EXPIRED')
                return cancelledListings.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-500 mb-4">
                      Cancelled Listings ({cancelledListings.length})
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {cancelledListings.map((listing) => {
                        const firstImage = getFirstImage(listing.images)
                        return (
                          <ListingCard
                            key={listing.id}
                            listing={listing}
                            firstImage={firstImage}
                            onDelete={handleDeleteListing}
                            onMarkAsSold={handleMarkAsSold}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}