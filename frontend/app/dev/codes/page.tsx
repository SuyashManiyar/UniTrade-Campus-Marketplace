'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface VerificationCode {
  email: string
  code: string
  expires: string
  hasUserData: boolean
}

export default function DevCodesPage() {
  const [codes, setCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCodes()
    // Refresh every 5 seconds
    const interval = setInterval(fetchCodes, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCodes = async () => {
    try {
      const response = await api.get('/auth/dev/codes')
      setCodes(response.data.codes)
    } catch (error) {
      console.error('Failed to fetch codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expires: string) => {
    return new Date(expires) < new Date()
  }

  const timeRemaining = (expires: string) => {
    const now = new Date()
    const expiry = new Date(expires)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Development Only</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Development - Verification Codes</h1>
            <p className="text-sm text-gray-600 mt-1">
              Active verification codes for testing (auto-refreshes every 5 seconds)
            </p>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-umass-maroon"></div>
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No active verification codes</p>
                <p className="text-sm text-gray-400 mt-2">
                  Try registering or logging in to generate codes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {codes.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-2 ${
                      isExpired(item.expires) 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.email}</h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Code:</span>
                            <span className="font-mono text-lg font-bold text-umass-maroon bg-white px-3 py-1 rounded border">
                              {item.code}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Type:</span>
                            <span className={`text-sm px-2 py-1 rounded ${
                              item.hasUserData 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.hasUserData ? 'Registration' : 'Login'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          isExpired(item.expires) ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {isExpired(item.expires) ? 'Expired' : 'Active'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {timeRemaining(item.expires)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Go to login/register page</li>
                <li>2. Enter your @umass.edu email</li>
                <li>3. Check this page for the verification code</li>
                <li>4. Copy and paste the code to complete authentication</li>
              </ol>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={fetchCodes}
                className="bg-umass-maroon text-white px-4 py-2 rounded hover:bg-red-800"
              >
                Refresh Now
              </button>
              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}