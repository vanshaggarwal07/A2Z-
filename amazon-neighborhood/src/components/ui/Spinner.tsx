import React from 'react'

interface SpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ message, size = 'md' }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <svg
        className={`animate-spin ${sizes[size]} text-[#FF9900]`}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Loading"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      {message && <p className="text-sm text-gray-500 text-center">{message}</p>}
    </div>
  )
}
