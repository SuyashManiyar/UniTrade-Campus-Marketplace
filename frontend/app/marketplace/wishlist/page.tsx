'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface WishlistItem {
  id: string
  createdAt: string
  listing: {
    id: string
    title: string
    description: string
    category: string
    condition: string
    price: number
    type: string
    status: string
    images?: string
    seller: {
      id: string
      name: string
      rating: number | null
      ratingCount: number
    }
  }
}

export default function WishlistPage() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchWishlist()
    }
  }, [user, isLoading, router])

  const fetchWishlist = async () => {
    try {
      setLoading(true)
      const response = await api.get('/wishlist')
      setWishlist(response.data)
    } catch (error) {
      toast.error('Failed to fetch wishlist')
      console.error('Error fetching wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (listingId: string) => {
    try {
      await api.delete(`/wishlist/${listingId}`)
      toast.success('Removed from wishlist')
      fetchWishlist()
    } catch (error) {
      toast.error('Failed to remove from wishlist')
    }
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

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'ELECTRONICS': '💻',
      'FURNITURE': '🛋️',
      'TEXTBOOKS': '📖',
      'BIKES': '🚴',
      'CLOTHING': '👔',
      'OTHER': '🏷️'
    }
    return icons[category] || '🏷️'
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
      <nav className="bg-white shadow-md">
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
              <Link href="/marketplace/wishlist" className="text-umass-maroon font-medium">
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
        <div className="px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">Items you've saved for later</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-6">Start adding items you're interested in!</p>
              <Link
                href="/marketplace/listings"
                className="inline-block bg-umass-maroon text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800 transition-colors"
              >
                Browse Listings
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item) => {
                const firstImage = getFirstImage(item.listing.images)

                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={item.listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-6xl">{getCategoryIcon(item.listing.category)}</div>
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromWishlist(item.listing.id)}
                        className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"
                        title="Remove from wishlist"
                      >
                        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Status badge */}
                      {item.listing.status !== 'ACTIVE' && (
                        <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-semibold">
                          {item.listing.status}
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                        {item.listing.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {item.listing.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 flex items-center">
                          {getCategoryIcon(item.listing.category)} {item.listing.category.replace('_', ' ')}
                        </span>
                        <span className="text-lg font-bold text-umass-maroon">
                          ${item.listing.price}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mb-4">
                        <span>by {item.listing.seller.name}</span>
                      </div>

                      <Link
                        href={`/marketplace/listings/${item.listing.id}`}
                        className="block w-full bg-umass-maroon text-white text-center py-2 px-3 rounded-lg hover:bg-red-800 transition-colors font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
