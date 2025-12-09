'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function CreateListing() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    type: 'DIRECT_SALE',
    startingBid: '',
    bidIncrement: '',
    auctionEndTime: ''
  })
  const [images, setImages] = useState<File[]>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files)
      if (fileList.length > 5) {
        toast.error('You can upload maximum 5 images')
        return
      }
      setImages(fileList)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create the listing data object according to API contract
      const listingData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        type: formData.type
      }

      if (formData.type === 'DIRECT_SALE') {
        listingData.price = parseFloat(formData.price)
      } else {
        // For auctions, set price to starting bid to satisfy backend validation
        listingData.startingBid = parseFloat(formData.startingBid)
        listingData.price = parseFloat(formData.startingBid) // Use starting bid as price
        listingData.auctionEndTime = new Date(formData.auctionEndTime).toISOString()
        if (formData.bidIncrement) {
          listingData.bidIncrement = parseFloat(formData.bidIncrement)
        }
      }

      // Create FormData to handle both data and files
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.entries(listingData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formDataToSend.append(key, value.toString())
        }
      })
      
      // Add image files
      images.forEach((image) => {
        formDataToSend.append('images', image)
      })

      const response = await fetch('/api/listings', {
        method: 'POST',
        body: formDataToSend, // Don't set Content-Type header, let browser set it with boundary
      })

      if (response.ok) {
        toast.success('Listing created successfully!')
        router.push('/marketplace/my-listings')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create listing')
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      toast.error('An error occurred while creating the listing')
    } finally {
      setIsSubmitting(false)
    }
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

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Create New Listing</h1>
              <p className="text-gray-600">Post an item for sale in the UMass marketplace</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                  placeholder="Enter item title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                  placeholder="Describe your item in detail"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                >
                  <option value="DIRECT_SALE">Direct Sale - Fixed Price</option>
                  <option value="AUCTION">Auction - Bidding</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.type === 'DIRECT_SALE'
                    ? 'Buyers can purchase immediately at your set price'
                    : 'Buyers can place bids, highest bid wins when auction ends'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.type === 'DIRECT_SALE' ? (
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="startingBid" className="block text-sm font-medium text-gray-700 mb-2">
                        Starting Bid ($) *
                      </label>
                      <input
                        type="number"
                        id="startingBid"
                        name="startingBid"
                        required={formData.type === 'AUCTION'}
                        min="0"
                        step="0.01"
                        value={formData.startingBid}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-2">
                        Bid Increment ($)
                      </label>
                      <input
                        type="number"
                        id="bidIncrement"
                        name="bidIncrement"
                        min="0.01"
                        step="0.01"
                        value={formData.bidIncrement}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                        placeholder="1.00"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                  >
                    <option value="">Select a category</option>
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="TEXTBOOKS">Textbooks</option>
                    <option value="BIKES">Bikes</option>
                    <option value="CLOTHING">Clothing</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {formData.type === 'AUCTION' && (
                <div>
                  <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Auction End Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="auctionEndTime"
                    name="auctionEndTime"
                    required={formData.type === 'AUCTION'}
                    value={formData.auctionEndTime}
                    onChange={handleInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set when the auction should end
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                >
                  <option value="">Select condition</option>
                  <option value="NEW">New</option>
                  <option value="LIKE_NEW">Like New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                  Images
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-umass-maroon"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload up to 5 images of your item (JPG, PNG, GIF)
                </p>
                {images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {images.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  href="/marketplace"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-umass-maroon text-white rounded-md hover:bg-red-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}