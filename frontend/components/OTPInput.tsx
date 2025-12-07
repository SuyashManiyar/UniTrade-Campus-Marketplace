'use client'

import { useState, useRef, useEffect } from 'react'

interface OTPInputProps {
  length?: number
  onComplete: (otp: string) => void
  loading?: boolean
}

export default function OTPInput({ length = 6, onComplete, loading = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete when all digits are filled
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === length) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        // Move to previous input and clear it
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      }
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    // Handle paste
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (otp.every(digit => digit !== '')) {
        onComplete(otp.join(''))
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)

    if (pastedData) {
      const newOtp = [...otp]
      for (let i = 0; i < length; i++) {
        newOtp[i] = pastedData[i] || ''
      }
      setOtp(newOtp)

      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '')
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex
      inputRefs.current[focusIndex]?.focus()

      // Auto-complete if all digits are filled
      if (pastedData.length === length) {
        onComplete(pastedData)
      }
    }
  }

  const clearOtp = () => {
    setOtp(new Array(length).fill(''))
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center space-x-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className={`
              w-12 h-12 text-center text-xl font-bold border-2 rounded-lg text-gray-900
              focus:outline-none focus:ring-2 focus:ring-umass-maroon focus:border-umass-maroon
              transition-all duration-200
              ${digit ? 'border-umass-maroon bg-red-50' : 'border-gray-300'}
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            `}
            placeholder="•"
          />
        ))}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={clearOtp}
          disabled={loading}
          className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      <div className="text-center text-xs text-gray-500">
        💡 Tip: You can paste the 6-digit code directly
      </div>
    </div>
  )
}