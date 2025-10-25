'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SimpleRegister() {
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.endsWith('@umass.edu')) {
      toast.error('Please use a UMass email address')
      return
    }
    
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/register', { email, name })
      setStep('verify')
      toast.success('Verification code sent to your email!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/verify', { email, code })
      login(response.data.token, response.data.user)
      toast.success('Registration successful!')
      router.push('/marketplace')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent a verification code to {email}
          </p>
          <p className="mt-2 text-center text-sm text-blue-600">
            <a href="/dev/codes" target="_blank" className="underline">
              Check verification codes here
            </a>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-umass-maroon hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Simple Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Simplified form for testing
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                UMass Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-name@umass.edu"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-umass-maroon hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}