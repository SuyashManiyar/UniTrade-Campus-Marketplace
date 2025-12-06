'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Listing {
  id: string
  title: string
  price?: number
  category: string
  condition: string
  images?: string | null
  type: string
  currentBid?: number
  startingBid?: number
}

export default function Marketplace() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [recentListings, setRecentListings] = useState<Listing[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0 })
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    } else if (user) {
      fetchRecentListings()
      fetchWishlist()
    }
  }, [user, isLoading, router])

  const fetchRecentListings = async () => {
    try {
      const response = await api.get('/listings?limit=6')
      setRecentListings(response.data.listings || [])
      setStats({
        total: response.data.total || 0,
        active: response.data.listings?.filter((l: Listing) => l).length || 0
      })
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    }
  }

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

  const getFirstImage = (images: string | null | undefined): string | null => {
    if (!images) return null
    try {
      const imageArray = JSON.parse(images)
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        const imageUrl = imageArray[0]
        if (imageUrl.startsWith('/uploads/')) {
          const filename = imageUrl.replace('/uploads/', '')
          const encodedFilename = encodeURIComponent(filename)
          return `http://localhost:8080/uploads/${encodedFilename}`
        }
        return imageUrl
      }
    } catch {}
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const categories = [
    { name: 'Electronics', icon: '💻', color: 'from-blue-500 to-blue-600', category: 'ELECTRONICS' },
    { name: 'Furniture', icon: '🛋️', color: 'from-amber-500 to-amber-600', category: 'FURNITURE' },
    { name: 'Textbooks', icon: '📖', color: 'from-green-500 to-green-600', category: 'TEXTBOOKS' },
    { name: 'Bikes', icon: '🚴', color: 'from-purple-500 to-purple-600', category: 'BIKES' },
    { name: 'Clothing', icon: '👔', color: 'from-pink-500 to-pink-600', category: 'CLOTHING' },
    { name: 'Other', icon: '🏷️', color: 'from-gray-500 to-gray-600', category: 'OTHER' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/marketplace" className="text-2xl font-bold text-umass-maroon">
                UniTrade
              </Link>
              <Link href="/marketplace/listings" className="text-gray-700 hover:text-umass-maroon font-medium transition-colors">
                Browse
              </Link>
              <Link href="/marketplace/my-listings" className="text-gray-700 hover:text-umass-maroon transition-colors">
                My Listings
              </Link>
              <Link href="/marketplace/wishlist" className="text-gray-700 hover:text-umass-maroon transition-colors">
                Wishlist
              </Link>
              <Link href="/messages" className="text-gray-700 hover:text-umass-maroon transition-colors">
                Messages
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-gray-700 hover:text-umass-maroon transition-colors">
                  Admin
                </Link>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 hidden md:block">{user.name}</span>
              <Link 
                href="/marketplace/create-listing"
                className="bg-umass-maroon text-white px-5 py-2 rounded-lg hover:bg-red-800 font-medium shadow-md hover:shadow-lg transition-all"
              >
                Sell Item
              </Link>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="px-4 mb-12">
          <div className="bg-gradient-to-r from-umass-maroon to-red-800 rounded-2xl shadow-xl p-8 md:p-12 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to UniTrade
              </h1>
              <p className="text-xl mb-8 text-red-50">
                Buy, sell, and trade with fellow UMass students in a trusted community.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/marketplace/listings"
                  className="bg-white text-umass-maroon px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Browse Listings
                </Link>
                <Link
                  href="/marketplace/create-listing"
                  className="bg-transparent text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors border-2 border-white"
                >
                  Sell an Item
                </Link>
              </div>
              
              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-red-100 text-sm">Total Listings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.active}</div>
                  <div className="text-red-100 text-sm">Active Now</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-red-100 text-sm">Verified Students</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.category}
                href={`/marketplace/listings?category=${cat.category}`}
                className="group"
              >
                <div className={`bg-gradient-to-br ${cat.color} rounded-xl p-6 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer`}>
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <div className="font-semibold text-sm">{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="px-4 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
            <Link href="/marketplace/listings" className="text-umass-maroon hover:text-red-800 font-medium">
              View All →
            </Link>
          </div>
          
          {recentListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/listings/${listing.id}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden transform hover:-translate-y-1">
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {getFirstImage(listing.images) ? (
                        <img
                          src={getFirstImage(listing.images)!}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-6xl">{getCategoryIcon(listing.category)}</div>
                        </div>
                      )}
                      
                      {/* Wishlist Heart Button */}
                      <button
                        onClick={(e) => toggleWishlist(listing.id, e)}
                        className="absolute top-2 left-2 bg-white rounded-full p-2 shadow-md hover:scale-110 transition-transform z-10"
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
                      
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-semibold">
                        {listing.condition.replace('_', ' ')}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-umass-maroon transition-colors line-clamp-1">
                          {listing.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center">
                          {getCategoryIcon(listing.category)} {listing.category.replace('_', ' ')}
                        </span>
                        <span className="text-lg font-bold text-umass-maroon">
                          {listing.type === 'DIRECT_SALE' 
                            ? `$${listing.price}` 
                            : `$${listing.currentBid || listing.startingBid}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">Be the first to post something!</p>
              <Link
                href="/marketplace/create-listing"
                className="inline-block bg-umass-maroon text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
              >
                Create First Listing
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Secure & Trusted</h3>
              <p className="text-gray-600 text-sm">Only verified UMass students can access UniTrade</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Direct Messaging</h3>
              <p className="text-gray-600 text-sm">Chat directly with buyers and sellers in-app</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-lg">Fast & Easy</h3>
              <p className="text-gray-600 text-sm">List items quickly and start selling immediately</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}