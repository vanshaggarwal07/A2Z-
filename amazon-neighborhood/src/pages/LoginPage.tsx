import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  if (user) {
    navigate(from, { replace: true })
    return null
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error: err } = await signUpWithEmail(email, password, name)
      if (err) setError(err)
      else setError('Check your email for verification link.')
    } else {
      const { error: err } = await signInWithEmail(email, password)
      if (err) setError(err)
      else navigate(from, { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-8 px-4">
      {/* Amazon logo */}
      <div className="mb-6">
        <svg className="h-10 w-auto" viewBox="0 0 120 36" fill="none">
          <text x="2" y="26" fill="#0F1111" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24">amazon</text>
          <text x="98" y="26" fill="#FF9900" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14">.in</text>
          <path d="M18 30 C32 36, 64 38, 106 32" stroke="#FF9900" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <polygon points="103,29 109,32 103,35" fill="#FF9900"/>
        </svg>
      </div>

      {/* Login card */}
      <div className="w-full max-w-sm border border-gray-300 rounded-lg p-5">
        <h1 className="text-2xl font-normal text-[#0F1111] mb-4">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h1>

        {error && (
          <div className="mb-3 p-3 border border-red-300 bg-red-50 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-[#0F1111] mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First and last name"
                className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#0F1111] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1111] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
              className="w-full border border-gray-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e77600] focus:border-[#e77600]"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD814] hover:bg-[#f7ca00] border border-[#FCD200] text-[#0F1111] font-medium py-2 rounded text-sm transition-colors disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create your Amazon account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-500">or</span></div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded py-2.5 px-4 text-sm font-medium text-[#0F1111] hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Terms */}
        <p className="text-xs text-gray-600 mt-4 leading-relaxed">
          By continuing, you agree to Amazon's{' '}
          <button className="text-[#0066c0] hover:underline">Conditions of Use</button> and{' '}
          <button className="text-[#0066c0] hover:underline">Privacy Notice</button>.
        </p>
      </div>

      {/* Toggle mode */}
      <div className="mt-4 w-full max-w-sm">
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-500">
            {mode === 'signin' ? 'New to Amazon?' : 'Already have an account?'}
          </span></div>
        </div>
        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          className="w-full border border-gray-300 rounded py-2 text-sm font-medium text-[#0F1111] hover:bg-gray-50 transition-colors"
        >
          {mode === 'signin' ? 'Create your Amazon account' : 'Sign in to existing account'}
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500 w-full max-w-sm">
        <div className="flex justify-center gap-4 mb-2">
          <button className="text-[#0066c0] hover:underline">Conditions of Use</button>
          <button className="text-[#0066c0] hover:underline">Privacy Notice</button>
          <button className="text-[#0066c0] hover:underline">Help</button>
        </div>
        <p>Amazon Neighbourhood, India</p>
      </div>
    </div>
  )
}
