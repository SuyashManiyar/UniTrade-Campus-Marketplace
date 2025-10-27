'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const editListingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER']),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive('Price must be positive').optional(),
  type: z.enum(['DIRECT_SALE', 'AUCTION']).default('DIRECT_SALE'),
  startingBid: z.number().positive().optional(),
  bidIncrement: z.number().positive().optional(),
  auctionEndTime: z.string().optional(),
})

type EditListingForm = z.infer<typeof editListingSchema>

interface Listing {
  id: string
  title: string
  description: string
  category: string
  condition: string
  price?: number
  type: string
  startingBid?: number
  bidIncrement?: number
  auctionEndTime?: string
}

export default function EditListing() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string
  
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)

  const form = useForm<EditListingForm>({
    resolver: zodResolver(editListingSchema),
  })

  const watchType = form.watch('type')

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
      const listingData = response.data
      
      // Check if user owns this listing
      if (listingData.seller.id !== user?.id) {
        toast.error('You can only edit your own listings')
        router.push('/marketplace/my-listings')
        return
      }

      setListing(listingData)
      
      // Set form values
      form.reset({
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        condition: listingData.condition,
        price: listingData.price || undefined,
        type: listingData.type,
        startingBid: listingData.startingBid || undefined,
        bidIncrement: listingData.bidIncrement || undefined,
        auctionEndTime: listingData.auctionEndTime ? new Date(listingData.auctionEndTime).toISOString().slice(0, 16) : undefined,
      })
    } catch (error) {
      toast.error('Failed to fetch listing')
      router.push('/marketplace/my-listings')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: EditListingForm) => {
    try {
      const updateData = { ...data }
      
      // Handle auction-specific validation
      if (data.type === 'AUCTION') {
        if (!data.startingBid) {
          toast.error('Starting bid is required for auctions')
          return
        }
        if (!data.auctionEndTime) {
          toast.error('Auction end time is required for auctions')
          return
        }
        // Remove price for auctions
        delete updateData.price
      } else {
        // Remove auction fields for direct sales
        delete updateData.startingBid
        delete updateData.bidIncrement
        delete updateData.auctionEndTime
        
        if (!data.price) {
          toast.error('Price is required for direct sales')
          return
        }
      }

      await api.put(`/listings/${listingId}`, updateData)
      toast.success('Listing updated successfully!')
      router.push('/marketplace/my-listings')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update listing')
    }
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

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Link 
              href="/marketplace/my-listings"
              className="text-umass-maroon hover:text-red-800 mb-4 inline-block"
            >
              ← Back to My Listings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  {...form.register('title')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
                {form.formState.errors.title && (
                  <p className="mt-2 text-sm text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  {...form.register('description')}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
                {form.formState.errors.description && (
                  <p className="mt-2 text-sm text-red-600">{form.formState.errors.description.message}</p>
                )}
              </div>

              {/* Category and Condition */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    {...form.register('category')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  >
                    <option value="ELECTRONICS">Electronics</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="TEXTBOOKS">Textbooks</option>
                    <option value="BIKES">Bikes</option>
                    <option value="CLOTHING">Clothing</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {form.formState.errors.category && (
                    <p className="mt-2 text-sm text-red-600">{form.formState.errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                    Condition *
                  </label>
                  <select
                    {...form.register('condition')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                  {form.formState.errors.condition && (
                    <p className="mt-2 text-sm text-red-600">{form.formState.errors.condition.message}</p>
                  )}
                </div>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Listing Type *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      {...form.register('type')}
                      type="radio"
                      value="DIRECT_SALE"
                      className="h-4 w-4 text-umass-maroon focus:ring-umass-maroon border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Direct Sale - Set a fixed price</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...form.register('type')}
                      type="radio"
                      value="AUCTION"
                      className="h-4 w-4 text-umass-maroon focus:ring-umass-maroon border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-900">Auction - Let buyers bid</span>
                  </label>
                </div>
              </div>

              {/* Direct Sale Price */}
              {watchType === 'DIRECT_SALE' && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price ($) *
                  </label>
                  <input
                    {...form.register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  />
                  {form.formState.errors.price && (
                    <p className="mt-2 text-sm text-red-600">{form.formState.errors.price.message}</p>
                  )}
                </div>
              )}

              {/* Auction Fields */}
              {watchType === 'AUCTION' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="startingBid" className="block text-sm font-medium text-gray-700">
                        Starting Bid ($) *
                      </label>
                      <input
                        {...form.register('startingBid', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                      />
                      {form.formState.errors.startingBid && (
                        <p className="mt-2 text-sm text-red-600">{form.formState.errors.startingBid.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700">
                        Bid Increment ($)
                      </label>
                      <input
                        {...form.register('bidIncrement', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1.00"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                      />
                      {form.formState.errors.bidIncrement && (
                        <p className="mt-2 text-sm text-red-600">{form.formState.errors.bidIncrement.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auctionEndTime" className="block text-sm font-medium text-gray-700">
                      Auction End Time *
                    </label>
                    <input
                      {...form.register('auctionEndTime')}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                    />
                    {form.formState.errors.auctionEndTime && (
                      <p className="mt-2 text-sm text-red-600">{form.formState.errors.auctionEndTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="flex-1 bg-umass-maroon text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
                >
                  {form.formState.isSubmitting ? 'Updating...' : 'Update Listing'}
                </button>
                <Link
                  href="/marketplace/my-listings"
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-center hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}