'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { getSocket } from '@/lib/socket'
import NotificationBell from '@/components/NotificationBell'

interface Listing {
  id: string
  title: string
  description: string
  category: string
  condition: string
  price: number
  type: string
  status: string
  createdAt: string
  images?: string
  currentBid?: number
  startingBid?: number
  bidIncrement?: number
  seller: {
    id: string
    name: string
    rating: number | null
    ratingCount: number
  }
  bids: any[]
  _count?: {
    bids: number
  }
}

export default function ListingsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())
  const [extractedFilters, setExtractedFilters] = useState<any>(null)
  const [nlpFailed, setNlpFailed] = useState(false)

  const categories = ['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER']
  const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']
  const statuses = ['ALL', 'ACTIVE', 'SOLD', 'EXPIRED', 'CANCELLED']

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
          console.log('Image URL constructed:', fullUrl)
          return fullUrl
        }
        console.log('Image URL (absolute):', imageUrl)
        return imageUrl
      }
      return null
    } catch (error) {
      console.error('Error parsing images JSON:', error, images)
      return null
    }
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

    if (user) {
      // Read URL parameters on page load
      const urlParams = new URLSearchParams(window.location.search)
      const categoryParam = urlParams.get('category')
      const conditionParam = urlParams.get('condition')

      if (categoryParam) {
        setSelectedCategory(categoryParam)
      }
      if (conditionParam) {
        setSelectedCondition(conditionParam)
      }

      // Set up Socket.IO for real-time listing updates
      const socket = getSocket()
      if (socket) {
        socket.on('listing-update', (data: any) => {
          console.log('📢 Received listing update:', data)

          // Update the listing in state if it exists
          setListings((prevListings) => {
            return prevListings.map((listing) => {
              if (listing.id === data.listingId) {
                return {
                  ...listing,
                  currentBid: data.listing.currentBid,
                  _count: {
                    ...listing._count,
                    bids: data.listing._count?.bids || listing._count?.bids || 0
                  }
                }
              }
              return listing
            })
          })
        })

        return () => {
          socket.off('listing-update')
        }
      }
    }
  }, [user, isLoading, router])

  // Fetch listings on initial load and when manual filters change
  useEffect(() => {
    if (user) {
      fetchListings()
      fetchWishlist()
    }
  }, [user, selectedCategory, selectedCondition, selectedStatus, minPrice, maxPrice])

  const fetchWishlist = async () => {
    try {
      const response = await api.get('/wishlist')
      const wishlistIds = new Set<string>(response.data.map((item: any) => item.listing.id as string))
      setWishlistItems(wishlistIds)
    } catch (error) {
      console.error('Error fetching wishlist:', error)
    }
  }

  const toggleWishlist = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      if (wishlistItems.has(listingId)) {
        await api.delete(`/wishlist/${listingId}`)
        setWishlistItems(prev => {
          const newSet = new Set<string>(prev)
          newSet.delete(listingId)
          return newSet
        })
        toast.success('Removed from wishlist')
      } else {
        await api.post(`/wishlist/${listingId}`)
        setWishlistItems(prev => {
          const newSet = new Set<string>(prev)
          newSet.add(listingId)
          return newSet
        })
        toast.success('Added to wishlist')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update wishlist')
    }
  }

  const fetchListings = async () => {
    if (!searchQuery && !selectedCategory && !selectedCondition && !minPrice && !maxPrice && (selectedStatus === 'ACTIVE' || selectedStatus === 'ALL')) {
      // If no search query and no filters (except status), fetch listings
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (selectedStatus && selectedStatus !== 'ALL') {
          params.append('status', selectedStatus)
        }
        const response = await api.get(`/listings?${params.toString()}`)
        setListings(response.data.listings)
        setExtractedFilters(null)
        setNlpFailed(false)
      } catch (error) {
        toast.error('Failed to fetch listings')
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
      return
    }

    // Always try NLP search first if there's a search query
    if (searchQuery) {
      try {
        setLoading(true)
        const response = await api.post('/listings/nlp-search', {
          query: searchQuery
        })

        // Apply manual filters on top of NLP results if user has set them
        const manualFilters: any = {}
        if (selectedCategory) manualFilters.category = selectedCategory
        if (selectedCondition) manualFilters.condition = selectedCondition
        if (selectedStatus) manualFilters.status = selectedStatus
        if (minPrice) manualFilters.minPrice = parseFloat(minPrice)
        if (maxPrice) manualFilters.maxPrice = parseFloat(maxPrice)

        // Filter the NLP results with manual filters
        let filteredListings = response.data.listings
        if (Object.keys(manualFilters).length > 0) {
          filteredListings = filteredListings.filter((listing: Listing) => {
            if (manualFilters.category && listing.category !== manualFilters.category) return false
            if (manualFilters.condition && listing.condition !== manualFilters.condition) return false
            if (manualFilters.status && listing.status !== manualFilters.status) return false
            if (manualFilters.minPrice && listing.price < manualFilters.minPrice) return false
            if (manualFilters.maxPrice && listing.price > manualFilters.maxPrice) return false
            return true
          })
        }

        setListings(filteredListings)
        setExtractedFilters(response.data.extractedFilters)

        // Show message if NLP failed
        if (response.data.fallbackUsed) {
          setNlpFailed(true)
          toast('Smart search unavailable, using standard search', { icon: 'ℹ️' })
        } else {
          setNlpFailed(false)
        }
      } catch (error) {
        toast.error('Failed to fetch listings')
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    } else {
      // Use manual filters
      try {
        setLoading(true)
        const params = new URLSearchParams()

        if (selectedCategory) params.append('category', selectedCategory)
        if (selectedCondition) params.append('condition', selectedCondition)
        if (selectedStatus && selectedStatus !== 'ALL') params.append('status', selectedStatus)
        if (minPrice) params.append('minPrice', minPrice)
        if (maxPrice) params.append('maxPrice', maxPrice)

        const response = await api.get(`/listings?${params.toString()}`)
        setListings(response.data.listings)
        setExtractedFilters(null)
        setNlpFailed(false)
      } catch (error) {
        toast.error('Failed to fetch listings')
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedCondition('')
    setSelectedStatus('ALL')
    setMinPrice('')
    setMaxPrice('')
    setExtractedFilters(null)
    setNlpFailed(false)
    setTimeout(() => fetchListings(), 100)
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/marketplace" className="text-xl font-bold text-umass-maroon">
                UniTrade
              </Link>
              <button
                onClick={clearFilters}
                className="text-gray-700 hover:text-umass-maroon font-medium"
              >
                Browse Listings
              </button>
              <Link href="/marketplace/my-listings" className="text-gray-700 hover:text-umass-maroon">
                My Listings
              </Link>
              <Link href="/marketplace/wishlist" className="text-gray-700 hover:text-umass-maroon">
                Wishlist
              </Link>
              <Link href="/messages" className="text-gray-700 hover:text-umass-maroon">
                Messages
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-700 hover:text-umass-maroon">
                  Admin Panel
                </Link>
              )}
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
              <button
                onClick={logout}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Listings</h1>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <form onSubmit={handleSearch} className="space-y-4">
                {/* Smart Search Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      🤖 Smart Search
                    </label>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Try: "laptop in good condition under $500"'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  />
                  {nlpFailed && (
                    <p className="mt-1 text-sm text-orange-600">
                      ⚠️ Smart search unavailable - using standard search
                    </p>
                  )}
                  {extractedFilters && extractedFilters.confidence > 0 && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-900 mb-1">Filters applied:</p>
                      <div className="flex flex-wrap gap-2">
                        {extractedFilters.keywords && extractedFilters.keywords.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {extractedFilters.keywords.join(', ')}
                          </span>
                        )}
                        {(selectedCategory || extractedFilters.category) && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {selectedCategory || extractedFilters.category}
                          </span>
                        )}
                        {(selectedCondition || extractedFilters.condition) && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            {selectedCondition || extractedFilters.condition}
                          </span>
                        )}
                        {(minPrice || maxPrice || extractedFilters.minPrice || extractedFilters.maxPrice) && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            ${minPrice || extractedFilters.minPrice || 0} - ${maxPrice || extractedFilters.maxPrice || '∞'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Manual Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    >
                      <option value="">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    >
                      <option value="">All Conditions</option>
                      {conditions.map(condition => (
                        <option key={condition} value={condition}>
                          {condition.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Price
                    </label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="$0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Price
                    </label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="$1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-umass-maroon text-white px-6 py-2 rounded-md hover:bg-red-800"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                  >
                    Clear Filters
                  </button>
                </div>
              </form>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No listings found matching your criteria.</p>
                <Link
                  href="/marketplace/create-listing"
                  className="mt-4 inline-block bg-umass-maroon text-white px-6 py-2 rounded-md hover:bg-red-800"
                >
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => {
                  const firstImage = getFirstImage(listing.images)
                  const hasBids = listing._count && listing._count.bids > 0

                  return (
                    <div
                      key={listing.id}
                      className={`bg-white rounded-lg shadow hover:shadow-lg transition-all ${hasBids ? 'animate-shine-border' : ''}`}
                    >
                      {/* Image Section */}
                      <div className="relative h-48 bg-gray-100">
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                            onLoad={() => {
                              console.log('Image loaded successfully:', firstImage)
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', firstImage)
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}

                        {/* Fallback placeholder */}
                        <div className={`${firstImage ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}>
                          <div className="text-center">
                            <div className="text-4xl mb-2">{getCategoryIcon(listing.category)}</div>
                            <div className="text-sm text-gray-500 font-medium">
                              {listing.category.replace('_', ' ')}
                            </div>
                          </div>
                        </div>

                        {/* Wishlist Heart Button */}
                        <button
                          onClick={(e) => toggleWishlist(listing.id, e)}
                          className="absolute top-3 left-3 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform z-10"
                          title={wishlistItems.has(listing.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <svg
                            className={`w-5 h-5 ${wishlistItems.has(listing.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                            fill={wishlistItems.has(listing.id) ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>

                        {/* Listing Type and Status Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${listing.type === 'AUCTION'
                            ? 'bg-orange-100/90 text-orange-800'
                            : 'bg-green-100/90 text-green-800'
                            }`}>
                            {listing.type === 'AUCTION' ? 'Auction' : 'Direct Sale'}
                          </span>
                          {listing.status !== 'ACTIVE' && (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${listing.status === 'SOLD' ? 'bg-blue-100/90 text-blue-800' :
                              listing.status === 'CANCELLED' ? 'bg-red-100/90 text-red-800' :
                                'bg-gray-100/90 text-gray-800'
                              }`}>
                              {listing.status}
                            </span>
                          )}
                        </div>

                        {/* Price Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-lg font-bold text-umass-maroon">
                            ${listing.price}
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                            {listing.title}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                            {listing.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                          <span className="flex items-center">
                            <span className="mr-1">{getCategoryIcon(listing.category)}</span>
                            {listing.category.replace('_', ' ')}
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {listing.condition.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                          <span>by {listing.seller.name}</span>
                          {listing.seller.rating && (
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-1">★</span>
                              <span>{listing.seller.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Bid Info for Auctions */}
                        {listing.type === 'AUCTION' && (
                          <div className="mb-3 p-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {listing.currentBid ? 'Current Bid' : 'Starting Bid'}
                              </span>
                              <span className="font-bold text-green-600">
                                ${listing.currentBid || listing.startingBid}
                              </span>
                            </div>
                            {listing._count && listing._count.bids > 0 && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <span className="mr-1">🔥</span>
                                {listing._count.bids} bid{listing._count.bids !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Link
                            href={`/marketplace/listings/${listing.id}`}
                            className="flex-1 bg-umass-maroon text-white text-center py-2 px-3 rounded-md hover:bg-red-800 transition-colors text-sm font-medium"
                          >
                            {listing.type === 'AUCTION' && listing.seller.id !== user.id ? 'Place Bid' : 'View Details'}
                          </Link>
                          {listing.seller.id !== user.id && (
                            <Link
                              href={`/messages/${listing.id}/${listing.seller.id}`}
                              className="bg-gray-300 text-white py-2 px-3 rounded-md hover:bg-gray-400 transition-colors text-sm"
                            >
                              💬
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}