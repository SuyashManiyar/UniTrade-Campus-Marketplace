'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
  seller: {
    id: string
    name: string
    rating: number | null
    ratingCount: number
  }
  bids: any[]
}

export default function ListingsPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCondition, setSelectedCondition] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const categories = ['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER']
  const conditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']

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
      fetchListings()
    }
  }, [user, isLoading, router])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedCondition) params.append('condition', selectedCondition)
      if (minPrice) params.append('minPrice', minPrice)
      if (maxPrice) params.append('maxPrice', maxPrice)

      const response = await api.get(`/listings?${params.toString()}`)
      setListings(response.data.listings)
    } catch (error) {
      toast.error('Failed to fetch listings')
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedCondition('')
    setMinPrice('')
    setMaxPrice('')
    setTimeout(fetchListings, 100)
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
                UMass Marketplace
              </Link>
              <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon font-medium">
                Browse Listings
              </Link>
              <Link href="/marketplace/my-listings" className="text-gray-700 hover:text-umass-maroon">
                My Listings
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-700 hover:text-umass-maroon">
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}!</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search listings..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    />
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

                  return (
                    <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
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

                        {/* Listing Type Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${listing.type === 'AUCTION'
                              ? 'bg-orange-100/90 text-orange-800'
                              : 'bg-green-100/90 text-green-800'
                            }`}>
                            {listing.type === 'AUCTION' ? 'Auction' : 'Direct Sale'}
                          </span>
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

                        <div className="flex space-x-2">
                          <Link
                            href={`/marketplace/listings/${listing.id}`}
                            className="flex-1 bg-umass-maroon text-white text-center py-2 px-3 rounded-md hover:bg-red-800 transition-colors text-sm font-medium"
                          >
                            View Details
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