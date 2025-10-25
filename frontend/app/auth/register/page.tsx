'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@umass.edu'), {
    message: 'Must be a valid UMass email address'
  }),
  name: z.string().min(1, 'Name is required'),
  pronouns: z.string().optional(),
  major: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
})

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

type RegisterForm = z.infer<typeof registerSchema>
type VerifyForm = z.infer<typeof verifySchema>

export default function Register() {
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit',
  })

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    mode: 'onSubmit',
  })

  const onRegister = async (data: RegisterForm) => {
    try {
      await api.post('/auth/register', data)
      setEmail(data.email)
      setStep('verify')
      toast.success('Verification code sent to your email!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed')
    }
  }

  const onVerify = async (data: VerifyForm) => {
    try {
      const response = await api.post('/auth/verify', {
        email,
        code: data.code,
      })

      login(response.data.token, response.data.user)
      toast.success('Registration successful!')
      router.push('/marketplace')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Verification failed')
    }
  }

  const resendCode = async () => {
    try {
      await api.post('/auth/resend-code', { email })
      toast.success('New verification code sent!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend code')
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
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    {...verifyForm.register('code')}
                    type="text"
                    placeholder="Enter 6-digit code"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  />
                  {verifyForm.formState.errors.code && (
                    <p className="mt-2 text-sm text-red-600">
                      {verifyForm.formState.errors.code.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={verifyForm.formState.isSubmitting}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-umass-maroon hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
                >
                  {verifyForm.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  className="text-sm text-umass-maroon hover:text-red-800"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
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
          Join UMass Marketplace
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/login" className="font-medium text-umass-maroon hover:text-red-800">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                UMass Email Address
              </label>
              <div className="mt-1">
                <input
                  {...registerForm.register('email')}
                  type="email"
                  placeholder="your-name@umass.edu"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  {...registerForm.register('name')}
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
                {registerForm.formState.errors.name && (
                  <p className="mt-2 text-sm text-red-600">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700">
                  Pronouns (optional)
                </label>
                <div className="mt-1">
                  <input
                    {...registerForm.register('pronouns')}
                    type="text"
                    placeholder="they/them"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="major" className="block text-sm font-medium text-gray-700">
                  Major (optional)
                </label>
                <div className="mt-1">
                  <input
                    {...registerForm.register('major')}
                    type="text"
                    placeholder="Computer Science"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location (optional)
              </label>
              <div className="mt-1">
                <input
                  {...registerForm.register('location')}
                  type="text"
                  placeholder="Southwest, Orchard Hill, etc."
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio (optional)
              </label>
              <div className="mt-1">
                <textarea
                  {...registerForm.register('bio')}
                  rows={3}
                  placeholder="Tell us a bit about yourself..."
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-umass-maroon hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
              >
                {registerForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}