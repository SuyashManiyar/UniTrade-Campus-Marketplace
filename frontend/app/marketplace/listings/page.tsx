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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
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
                {listings.map((listing) => (
                  <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          listing.type === 'AUCTION' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {listing.type === 'AUCTION' ? 'Auction' : 'Direct Sale'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-umass-maroon">
                          ${listing.price}
                        </span>
                        <span className="text-sm text-gray-500">
                          {listing.condition.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <span>{listing.category.replace('_', ' ')}</span>
                        <span>by {listing.seller.name}</span>
                      </div>
                      
                      {listing.seller.rating && (
                        <div className="flex items-center mb-4">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {listing.seller.rating.toFixed(1)} ({listing.seller.ratingCount} reviews)
                          </span>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Link
                          href={`/marketplace/listings/${listing.id}`}
                          className="flex-1 bg-umass-maroon text-white text-center py-2 px-4 rounded-md hover:bg-red-800 transition-colors"
                        >
                          View Details
                        </Link>
                        {listing.seller.id !== user.id && (
                          <Link
                            href={`/marketplace/messages?listing=${listing.id}&seller=${listing.seller.id}`}
                            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Message
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}