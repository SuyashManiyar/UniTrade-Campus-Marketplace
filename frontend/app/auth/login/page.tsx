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

const loginSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@umass.edu'), {
    message: 'Must be a valid UMass email address'
  }),
})

const verifySchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

type LoginForm = z.infer<typeof loginSchema>
type VerifyForm = z.infer<typeof verifySchema>

export default function Login() {
  const [step, setStep] = useState<'login' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  })

  const onLogin = async (data: LoginForm) => {
    try {
      await api.post('/auth/login', data)
      setEmail(data.email)
      setStep('verify')
      toast.success('Verification code sent to your email!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed')
    }
  }

  const onVerify = async (data: VerifyForm) => {
    try {
      const response = await api.post('/auth/verify', {
        email,
        code: data.code,
      })

      login(response.data.token, response.data.user)
      toast.success('Login successful!')
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
                  {verifyForm.formState.isSubmitting ? 'Verifying...' : 'Sign In'}
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/register" className="font-medium text-umass-maroon hover:text-red-800">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                UMass Email Address
              </label>
              <div className="mt-1">
                <input
                  {...loginForm.register('email')}
                  type="email"
                  placeholder="your-name@umass.edu"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-umass-maroon focus:border-umass-maroon"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-2 text-sm text-red-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-umass-maroon hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umass-maroon disabled:opacity-50"
              >
                {loginForm.formState.isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Secure login with email verification
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}