'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Marketplace() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-umass-maroon">UMass Marketplace</h1>
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to UMass Marketplace!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Your secure platform for buying and selling within the UMass community.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Electronics</h3>
                <p className="text-gray-600">Laptops, phones, and gadgets</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Furniture</h3>
                <p className="text-gray-600">Desks, chairs, and dorm essentials</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Textbooks</h3>
                <p className="text-gray-600">Course materials and study guides</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Transportation</h3>
                <p className="text-gray-600">Bikes and campus mobility</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}