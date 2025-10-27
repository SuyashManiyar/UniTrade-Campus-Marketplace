'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

export default function MyListings() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

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

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Listing deleted successfully')
        setListings(listings.filter(listing => listing.id !== listingId))
      } else {
        toast.error('Failed to delete listing')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the listing')
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
      default:
        return 'bg-gray-100 text-gray-800'
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
                UMass Marketplace
              </Link>
              <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon">
                Browse Listings
              </Link>
              <span className="text-umass-maroon font-medium">My Listings</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}!</span>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <Link
              href="/marketplace/create-listing"
              className="bg-umass-maroon text-white px-4 py-2 rounded-md hover:bg-red-800"
            >
              Create New Listing
            </Link>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {listing.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                    
                    <div className="space-y-2 mb-4 flex-grow">
                      {listing.type === 'DIRECT_SALE' && listing.price && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Price:</span>
                          <span className="font-medium text-gray-900">${listing.price}</span>
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
                        <span className="text-gray-900">{listing.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Condition:</span>
                        <span className="text-gray-900">{listing.condition}</span>
                      </div>
                      {listing.bids.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Bids:</span>
                          <span className="text-gray-900">{listing.bids.length}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom section - always at bottom */}
                    <div className="mt-auto">
                      <div className="text-xs text-gray-500 mb-4">
                        Created: {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/marketplace/listings/${listing.id}`}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm text-center hover:bg-gray-200"
                        >
                          View
                        </Link>
                        {listing.status === 'ACTIVE' && (
                          <>
                            <Link
                              href={`/marketplace/edit-listing/${listing.id}`}
                              className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm text-center hover:bg-blue-200"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}