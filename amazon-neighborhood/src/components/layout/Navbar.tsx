import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useLocation as useGeoLocation } from '../../hooks/useLocation'

const SEARCH_CATEGORIES = [
  'All', 'Electronics', 'Fashion', 'Books', 'Mobiles', 'Computers',
  'Home & Kitchen', 'Toys & Games', 'Sports', 'Grocery', 'Beauty',
]

interface NavbarProps {
  locationArea?: string
}

// ── "All" Sidebar ─────────────────────────────────────────────────────────────
function AllSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        {/* Header */}
        <div className="bg-[#232F3E] text-white px-4 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
          </div>
          <span className="font-bold text-base">Hello, sign in</span>
          <button
            onClick={onClose}
            className="ml-auto text-gray-300 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Trending */}
          <div className="border-b border-gray-200 py-4 px-4">
            <h2 className="font-bold text-base text-gray-900 mb-3">Trending</h2>
            <Link to="/best-sellers" onClick={onClose} className="block py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded">Bestsellers</Link>
            <Link to="/deals" onClick={onClose} className="block py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded">New Releases</Link>
            <Link to="/deals" onClick={onClose} className="block py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded">Today's Deals</Link>
          </div>

          {/* Digital Content & Devices */}
          <div className="border-b border-gray-200 py-4 px-4">
            <h2 className="font-bold text-base text-gray-900 mb-3">Digital Content and Devices</h2>
            {[
              { label: 'Echo & Alexa' },
              { label: 'Fire TV' },
              { label: 'Kindle E-Readers & eBooks' },
              { label: 'Audible Audiobooks' },
              { label: 'Amazon Prime Video' },
              { label: 'Amazon Music' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 hover:bg-gray-50 px-2 rounded cursor-pointer group">
                <span className="text-sm text-gray-700 group-hover:text-[#007185]">{item.label}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#007185]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>

          {/* Shop by Category */}
          <div className="border-b border-gray-200 py-4 px-4">
            <h2 className="font-bold text-base text-gray-900 mb-3">Shop by Category</h2>
            {[
              { label: 'Mobiles, Computers', to: '/electronics' },
              { label: 'TV, Appliances, Electronics', to: '/electronics' },
              { label: "Men's Fashion", to: '/fashion' },
              { label: "Women's Fashion", to: '/fashion' },
            ].map(item => (
              <Link key={item.label} to={item.to} onClick={onClose} className="flex items-center justify-between py-2.5 hover:bg-gray-50 px-2 rounded group">
                <span className="text-sm text-gray-700 group-hover:text-[#007185]">{item.label}</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#007185]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Programs & Features */}
          <div className="border-b border-gray-200 py-4 px-4">
            <h2 className="font-bold text-base text-gray-900 mb-3">Programs & Features</h2>
            {[
              { label: 'Gift Cards & Mobile Recharges', to: '/gift-cards', arrow: true },
              { label: 'Amazon Launchpad', to: '/launchpad' },
              { label: 'Amazon Business', to: '/business' },
              { label: 'Handloom and Handicrafts', to: '/handicrafts' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 hover:bg-gray-50 px-2 rounded group cursor-pointer">
                <span className="text-sm text-gray-700 group-hover:text-[#007185]">{item.label}</span>
                {item.arrow && (
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-[#007185]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            ))}

            {/* Amazon Neighbourhood */}
            <Link
              to="/neighborhood"
              onClick={onClose}
              className="flex items-center gap-2 py-2.5 hover:bg-[#f0f9f4] px-2 rounded group"
            >
              <div className="w-5 h-5 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#0a6245] group-hover:underline">Amazon Neighbourhood</span>
            </Link>

            {/* Vocal for Local */}
            <Link
              to="/vocal-for-local"
              onClick={onClose}
              className="flex items-center gap-2 py-2.5 hover:bg-[#fff8e7] px-2 rounded group"
            >
              <div className="w-5 h-5 rounded-full bg-[#e07b00] flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-[#e07b00] group-hover:underline">Amazon Vocal for Local</span>
            </Link>
          </div>

          {/* Help */}
          <div className="py-4 px-4">
            <h2 className="font-bold text-base text-gray-900 mb-3">Help & Settings</h2>
            <Link to="/account" onClick={onClose} className="block py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded">Your Account</Link>
            <Link to="/orders" onClick={onClose} className="block py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded">Your Orders</Link>
            <div className="py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded cursor-pointer">Customer Service</div>
            <div className="py-2 text-sm text-gray-700 hover:text-[#007185] hover:bg-gray-50 px-2 rounded cursor-pointer">Sign In</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
export function Navbar({ locationArea = 'New Delhi 110001' }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const navigate = useNavigate()
  const { cartCount, wishlist, totalCredits } = useAppContext()
  const { user, profile, signOut } = useAuth()
  const { area, loading: locLoading, requestLocation } = useGeoLocation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/neighborhood?q=${encodeURIComponent(searchQuery)}`)
  }

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.')
      return
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-IN'

    if (isListening) {
      setIsListening(false)
      return
    }

    setIsListening(true)
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setSearchQuery(transcript)
      setIsListening(false)
      // Auto-submit after voice input
      if (transcript.trim()) navigate(`/neighborhood?q=${encodeURIComponent(transcript)}`)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <>
      <AllSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="bg-[#131A22] text-white sticky top-0 z-40">

        {/* ── Main row ── */}
        <div className="max-w-screen-2xl mx-auto px-3 py-2 flex items-center gap-2">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 mr-1" aria-label="Amazon India Home">
            <img src="/images.png" alt="Amazon.in" className="h-8 w-auto mix-blend-lighten" style={{ minWidth: 88 }} />
          </Link>

          {/* Deliver to */}
          <button onClick={requestLocation} className="hidden lg:flex flex-col text-xs hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all flex-shrink-0 text-left">
            <span className="text-gray-300 text-[11px] leading-none">Delivering to {area}</span>
            <span className="font-bold text-sm leading-snug flex items-center gap-1 mt-0.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {locLoading ? 'Locating...' : 'Update location'}
            </span>
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex max-w-3xl mx-2" role="search">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-[#e3e6e6] text-gray-700 text-xs px-2 rounded-l-md border-r border-gray-300 focus:outline-none h-10 flex-shrink-0 cursor-pointer"
              aria-label="Search category"
            >
              {SEARCH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Amazon.in"
              className="flex-1 px-3 py-2 text-black text-sm focus:outline-none h-10 min-w-0"
              aria-label="Search Amazon"
            />
            {/* Mic button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`px-3 h-10 flex items-center justify-center transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-gray-500 hover:text-gray-700'}`}
              aria-label="Voice search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              type="submit"
              className="bg-[#febd69] hover:bg-[#f3a847] text-black px-4 rounded-r-md transition-colors h-10 flex items-center justify-center"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Right items */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-1">

            {/* Language selector */}
            <div className="relative group/lang">
              <button className="hidden md:flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all">
                <img src="/indian flag.png" alt="IN" className="w-5 h-4 object-cover rounded-sm" />
                <span className="text-sm font-bold text-white">EN</span>
                <svg className="w-2.5 h-2.5 text-gray-400" fill="currentColor" viewBox="0 0 10 6">
                  <path d="M0 0l5 6 5-6H0z"/>
                </svg>
              </button>
              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-xl p-4 w-56 hidden group-hover/lang:block z-50">
                <p className="font-bold text-sm text-gray-900 mb-2">Change Language</p>
                <label className="flex items-center gap-2 text-sm text-gray-800 mb-2 cursor-pointer">
                  <input type="radio" name="lang" defaultChecked className="accent-[#FF9900]" />
                  English - EN
                </label>
                <div className="border-t border-gray-200 my-2" />
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  हिन्दी - HI
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  தமிழ் - TA
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  తెలుగు - TE
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  ಕನ್ನಡ - KN
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  മലയാളം - ML
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  বাংলা - BN
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-1.5 cursor-pointer">
                  <input type="radio" name="lang" className="accent-[#FF9900]" />
                  मराठी - MR
                </label>
                <div className="border-t border-gray-200 my-2" />
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <span>🇮🇳</span> You are shopping on Amazon.in
                </p>
                <p className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline cursor-pointer mt-1">
                  Change country/region
                </p>
              </div>
            </div>

            {/* Green Credits pill */}
            <Link
              to="/account/green-credits"
              className="flex flex-col items-center hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all"
              aria-label={`Green Credits: ${totalCredits}`}
            >
              <div className="flex items-center gap-1">
                <img src="/hilta hua leaf.gif" alt="Credits" className="w-8 h-8 object-contain flex-shrink-0" />
                <span className="text-[#febd69] font-bold text-sm leading-none">{totalCredits}</span>
              </div>
              <span className="text-gray-400 text-[10px] leading-none mt-0.5">Credits</span>
            </Link>

            {/* Account */}
            {user ? (
              <div className="hidden md:flex flex-col text-xs hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all relative group">
                <span className="text-gray-300 text-[10px] leading-none">Hello, {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                <span className="font-bold text-sm leading-snug">Account &amp; Lists</span>
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded shadow-xl p-3 w-56 hidden group-hover:block z-50">
                  <Link to="/account" className="block text-sm text-gray-800 hover:text-[#007185] py-1">Your Account</Link>
                  <Link to="/orders" className="block text-sm text-gray-800 hover:text-[#007185] py-1">Your Orders</Link>
                  <Link to="/account/profile" className="block text-sm text-gray-800 hover:text-[#007185] py-1">Your Profile</Link>
                  <Link to="/account/wishlist" className="block text-sm text-gray-800 hover:text-[#007185] py-1">Wishlist</Link>
                  <div className="border-t border-gray-200 my-2" />
                  <button onClick={signOut} className="w-full text-left text-sm text-[#CC0C39] hover:underline py-1">Sign Out</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex flex-col text-xs hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all">
                <span className="text-gray-300 text-[10px] leading-none">Hello, sign in</span>
                <span className="font-bold text-sm leading-snug">Account &amp; Lists</span>
              </Link>
            )}

            {/* Returns & Orders */}
            <Link to="/orders" className="hidden md:flex flex-col text-xs hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all">
              <span className="text-gray-300 text-[10px] leading-none">Returns</span>
              <span className="font-bold text-sm leading-snug">&amp; Orders</span>
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="flex items-end gap-1 hover:outline hover:outline-1 hover:outline-white rounded px-2 py-1 transition-all"
              aria-label={`Cart: ${cartCount} items`}
            >
              <div className="relative">
                <svg className="w-9 h-8" viewBox="0 0 40 34" fill="none">
                  <text x="22" y="10" fill="#f08804" fontSize="13" fontWeight="bold" textAnchor="middle">
                    {cartCount > 99 ? '99+' : cartCount}
                  </text>
                  <path d="M4 4h3l4.5 18h18l3-12H10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <circle cx="15" cy="28" r="2" fill="white"/>
                  <circle cx="25" cy="28" r="2" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-sm leading-none pb-1">Cart</span>
            </Link>
          </div>
        </div>

        {/* ── Sub-nav ── */}
        <div className="bg-[#232F3E] px-3">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-0 text-sm overflow-x-auto scrollbar-none">

            {/* All button — opens sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 hover:outline hover:outline-1 hover:outline-white rounded transition-all whitespace-nowrap font-bold flex-shrink-0"
              aria-label="Open all categories"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              All
            </button>

            <Link to="/neighborhood" className="flex items-center gap-1.5 px-3 py-2 mx-0.5 rounded text-sm font-bold whitespace-nowrap flex-shrink-0 bg-[#067D62] text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Neighbourhood
            </Link>

            {/* Seller Hub */}
            <a href="/seller-central" target="_blank" rel="noopener noreferrer" className="px-3 py-2.5 text-sm whitespace-nowrap hover:outline hover:outline-1 hover:outline-white rounded transition-all flex-shrink-0 font-semibold text-[#febd69]">
              Seller Hub
            </a>

            {[
              { label: 'Vocal for Local',  to: '/vocal-for-local' },
              { label: 'Fresh',            to: '/fresh' },
              { label: 'Best Sellers',     to: '/best-sellers' },
              { label: 'Mobiles',          to: '/mobiles' },
              { label: "Today's Deals",    to: '/deals' },
              { label: 'Customer Service', to: '/help' },
              { label: 'Electronics',      to: '/electronics' },
              { label: 'Prime',            to: '/prime' },
            ].map(item => {
              const isLocal = item.label === 'Vocal for Local'
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={isLocal
                    ? 'flex items-center px-3 py-2 mx-0.5 rounded text-sm font-bold whitespace-nowrap flex-shrink-0 bg-[#e07b00] text-white hover:outline hover:outline-1 hover:outline-white transition-all'
                    : 'px-3 py-2.5 text-sm whitespace-nowrap hover:outline hover:outline-1 hover:outline-white rounded transition-all flex-shrink-0'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>
    </>
  )
}
