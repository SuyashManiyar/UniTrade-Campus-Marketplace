'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: string
  isVerified: boolean
  createdAt: string
  _count: {
    listings: number
    receivedReviews: number
  }
}

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
    email: string
  }
}

interface Report {
  id: string
  reason: string
  details: string | null
  createdAt: string
  reporter: {
    id: string
    name: string
    email: string
  }
  listing: {
    id: string
    title: string
    status: string
    seller: {
      id: string
      name: string
      email: string
    }
  }
}

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'listings' | 'reports'>('overview')
  const [users, setUsers] = useState<User[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeListings: 0,
    totalReports: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/marketplace')
      return
    }
    
    if (user && user.role === 'ADMIN') {
      fetchData()
    }
  }, [user, isLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch admin stats
      const statsResponse = await api.get('/admin/stats')
      setStats(statsResponse.data)
      
      // Fetch all listings for admin view
      const listingsResponse = await api.get('/admin/listings')
      setListings(listingsResponse.data.listings)
      
      // Fetch reports
      const reportsResponse = await api.get('/reports')
      setReports(reportsResponse.data)
      
    } catch (error) {
      toast.error('Failed to fetch admin data')
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (reportId: string) => {
    try {
      await api.delete(`/reports/${reportId}`)
      toast.success('Report dismissed')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete report')
    }
  }

  const updateListingStatus = async (listingId: string, status: string) => {
    try {
      await api.put(`/admin/listings/${listingId}/status`, { status })
      toast.success(`Listing ${status.toLowerCase()} successfully`)
      fetchData() // Refresh data
    } catch (error) {
      toast.error('Failed to update listing status')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-umass-maroon"></div>
      </div>
    )
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/marketplace" className="bg-umass-maroon text-white px-4 py-2 rounded-md">
            Go to Marketplace
          </Link>
        </div>
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
              <span className="text-red-600 font-medium">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Admin: {user.name}</span>
              <Link 
                href="/marketplace"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Back to Marketplace
              </Link>
              <button
                onClick={logout}
                className="bg-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview' },
                { id: 'users', name: 'Users' },
                { id: 'listings', name: 'Listings' },
                { id: 'reports', name: 'Reports' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-umass-maroon text-umass-maroon'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umass-maroon"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-umass-maroon">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Listings</h3>
                    <p className="text-3xl font-bold text-umass-maroon">{stats.totalListings}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Listings</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.activeListings}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports</h3>
                    <p className="text-3xl font-bold text-red-600">{stats.totalReports}</p>
                  </div>
                </div>
              )}

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">All Listings</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seller
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {listings.map((listing) => (
                          <tr key={listing.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">{listing.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{listing.seller.name}</div>
                              <div className="text-sm text-gray-500">{listing.seller.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {listing.category.replace('_', ' ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${listing.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                listing.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                listing.status === 'SOLD' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {listing.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(listing.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <Link
                                href={`/marketplace/listings/${listing.id}`}
                                className="text-umass-maroon hover:text-red-800"
                              >
                                View
                              </Link>
                              {listing.status === 'ACTIVE' && (
                                <button
                                  onClick={() => updateListingStatus(listing.id, 'CANCELLED')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      User management features coming soon. For now, you can view user details through listings.
                    </p>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Reports & Moderation</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Review and manage user-reported listings
                    </p>
                  </div>
                  
                  {/* Alert Summary */}
                  {reports.length > 0 && (() => {
                    const listingReports = reports.reduce((acc, report) => {
                      acc[report.listing.id] = (acc[report.listing.id] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                    
                    const criticalListings = Object.entries(listingReports).filter(([_, count]) => count >= 5).length
                    const warningListings = Object.entries(listingReports).filter(([_, count]) => count >= 3 && count < 5).length
                    
                    if (criticalListings > 0 || warningListings > 0) {
                      return (
                        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Action Required
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                {criticalListings > 0 && (
                                  <p className="mb-1">
                                    🚨 <strong>{criticalListings}</strong> listing{criticalListings > 1 ? 's' : ''} with 5+ reports (auto-suspended)
                                  </p>
                                )}
                                {warningListings > 0 && (
                                  <p>
                                    ⚠️ <strong>{warningListings}</strong> listing{warningListings > 1 ? 's' : ''} with 3-4 reports (needs review)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                  
                  <div className="overflow-x-auto">
                    {reports.length === 0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="text-4xl mb-2">✅</div>
                        <p className="text-gray-500">No reports to review</p>
                      </div>
                    ) : (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reports.map((report) => {
                            // Count reports for this listing
                            const listingReportCount = reports.filter(r => r.listing.id === report.listing.id).length
                            const isHighPriority = listingReportCount >= 3
                            
                            return (
                            <tr key={report.id} className={isHighPriority ? 'bg-red-50' : ''}>
                              <td className="px-6 py-4">
                                <div>
                                  <Link 
                                    href={`/marketplace/listings/${report.listing.id}`}
                                    className="text-sm font-medium text-umass-maroon hover:text-red-800"
                                  >
                                    {report.listing.title}
                                  </Link>
                                  <div className="text-xs text-gray-500">
                                    by {report.listing.seller.name}
                                  </div>
                                  {listingReportCount > 1 && (
                                    <div className="mt-1">
                                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                                        listingReportCount >= 5 ? 'bg-red-600 text-white' :
                                        listingReportCount >= 3 ? 'bg-orange-500 text-white' :
                                        'bg-yellow-400 text-gray-900'
                                      }`}>
                                        {listingReportCount} reports
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                    {report.reason}
                                  </span>
                                  {report.details && (
                                    <div className="text-xs text-gray-600 mt-1 max-w-xs">
                                      {report.details}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{report.reporter.name}</div>
                                <div className="text-xs text-gray-500">{report.reporter.email}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm space-x-2">
                                <Link
                                  href={`/marketplace/listings/${report.listing.id}`}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  View
                                </Link>
                                <button
                                  onClick={() => deleteReport(report.id)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  Dismiss
                                </button>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}