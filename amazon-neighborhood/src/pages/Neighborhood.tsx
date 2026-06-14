import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useListings } from '../hooks/useListings'
import { useLocation } from '../hooks/useLocation'
import { useAuth } from '../context/AuthContext'
import { useAppContext } from '../context/AppContext'
import { ListingGrid } from '../components/listing/ListingGrid'
import { NeighborhoodChatbar } from '../components/chatbot/NeighborhoodChatbar'
import { getProductFitScoreSync, type CustomerProfile } from '../lib/productFit'

const RADIUS_PRESETS = [2, 5, 10, 25]

const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'resell',    label: 'Resell' },
  { id: 'refurbish', label: 'Refurbish' },
  { id: 'donate',    label: 'Donate' },
  { id: 'exchange',  label: 'Exchange' },
]

type ChatFilters = {
  category: string
  max_price: number | null
  keywords: string[]
  listing_type_preference: string
}

// ── Location permission banner ────────────────────────────────────────────────
function LocationBanner({
  permission, loading, area, accuracy, onRequest,
}: {
  permission: string
  loading: boolean
  area: string
  accuracy: number | null
  onRequest: () => void
}) {
  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 bg-[#f0f9f4] border border-[#c3e6cb] rounded px-3 py-2 text-xs text-[#0a6245] mb-3">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">{area}</span>
        {accuracy && <span className="text-[#0a6245]/60">±{Math.round(accuracy)}m</span>}
        <span className="ml-auto text-[#0a6245]/60">Live GPS</span>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 bg-[#FFF3CD] border border-[#FF9900] rounded px-3 py-2 text-xs text-gray-700 mb-3">
        <svg className="w-3.5 h-3.5 text-[#FF9900] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Location access denied. Showing Delhi NCR listings.
        <button onClick={onRequest} className="ml-auto text-[#007185] hover:underline font-medium whitespace-nowrap">
          Enable location
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded px-3 py-2.5 text-sm mb-3 shadow-sm">
      <svg className="w-4 h-4 text-[#0a6245] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-gray-600 flex-1">Allow location to see listings near you</span>
      <button
        onClick={onRequest}
        disabled={loading}
        className="bg-[#0a6245] text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#085436] transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? 'Locating…' : 'Use my location'}
      </button>
    </div>
  )
}

// ── Custom radius modal ───────────────────────────────────────────────────────
function CustomRadiusButton({ value, onSet }: { value: number; onSet: (v: number) => void }) {
  const [open, setOpen]     = useState(false)
  const [input, setInput]   = useState(String(value))
  const isCustom = !RADIUS_PRESETS.includes(value)

  const handleApply = () => {
    const n = parseInt(input, 10)
    if (n >= 1 && n <= 100) { onSet(n); setOpen(false) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-pressed={isCustom}
        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
          isCustom
            ? 'bg-[#FF9900] border-[#FF9900] text-white font-bold'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
        }`}
      >
        {isCustom ? `${value} km` : 'Custom'}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg p-3 z-50 w-44">
          <p className="text-xs font-semibold text-gray-700 mb-2">Custom radius (km)</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900] w-0"
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              autoFocus
            />
            <button onClick={handleApply} className="bg-[#FF9900] text-black text-xs font-bold px-2 py-1 rounded">
              Set
            </button>
          </div>
          <input
            type="range" min={1} max={100} value={parseInt(input) || 10}
            onChange={e => setInput(e.target.value)}
            className="w-full mt-2 accent-[#FF9900]"
          />
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function Neighborhood() {
  const [searchParams] = useSearchParams()
  const defaultTab     = searchParams.get('tab') || 'all'
  const searchQuery    = searchParams.get('q') || ''

  const [radius, setRadius]         = useState(10)
  const [tab, setTab]               = useState(defaultTab)
  const [chatFilters, setChatFilters] = useState<ChatFilters | null>(null)
  const [chatSentence, setChatSentence] = useState('')
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'popularity' | 'best_match' | 'likelihood'>('relevance')
  const [primeOnly, setPrimeOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCondition, setFilterCondition] = useState('')
  const [filterItemType, setFilterItemType] = useState('')

  const { lat, lng, permission, loading, area, accuracy, requestLocation } = useLocation()
  const { user } = useAuth()
  const { cart, wishlist } = useAppContext()

  const { listings } = useListings({
    radiusKm:     radius,
    userLat:      lat,
    userLng:      lng,
    tab,
    searchFilters: chatFilters,
  })

  // Sync tab from URL param
  useEffect(() => {
    const t = searchParams.get('tab')
    if (t) setTab(t)
  }, [searchParams])

  const handleChatResults = (filters: ChatFilters, sentence: string) => {
    const hasFilter = filters.category || filters.max_price || filters.keywords.length
    setChatFilters(hasFilter ? filters : null)
    setChatSentence(sentence)
  }

  const sortedListings = useMemo(() => {
    let sorted = [...listings]

    // Apply search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      sorted = sorted.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.seller_name.toLowerCase().includes(q) ||
        l.condition_summary.toLowerCase().includes(q) ||
        (l.brand && l.brand.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q))
      )
    }

    // Prime filter
    if (primeOnly) {
      sorted = sorted.filter(l => l.seller_rating >= 4.5)
    }
    // Item type filter
    if (filterItemType === 'vintage') {
      // Vintage: products purchased more than 2 years ago or with "vintage" in title
      sorted = sorted.filter(l => {
        const title = l.title.toLowerCase()
        if (title.includes('vintage') || title.includes('antique') || title.includes('retro')) return true
        // Check if purchase date is older than 2 years
        const yearMatch = l.purchase_date.match(/(\d{4})/)
        if (yearMatch && parseInt(yearMatch[1]) <= 2022) return true
        return false
      })
    } else if (filterItemType === 'refurbished') {
      sorted = sorted.filter(l => l.listing_type === 'refurbish' || l.condition_grade === 'Refurbished')
    } else if (filterItemType === 'like_new') {
      sorted = sorted.filter(l => l.condition_grade === 'Like New')
    } else if (filterItemType === 'good') {
      sorted = sorted.filter(l => l.condition_grade === 'Good')
    }

    // Sort
    switch (sortBy) {
      case 'price_low': sorted.sort((a, b) => a.asking_price - b.asking_price); break
      case 'price_high': sorted.sort((a, b) => b.asking_price - a.asking_price); break
      case 'popularity': sorted.sort((a, b) => b.seller_rating - a.seller_rating); break
      case 'best_match':
      case 'likelihood':
        if (user) {
          // Build a mock profile from user's cart and wishlist
          const mockProfile: CustomerProfile = {
            orderHistory: cart.map(c => ({ title: c.title, category: 'other', price: c.price })),
            cartItems: cart.map(c => ({ title: c.title, category: 'other', price: c.price })),
            wishlistItems: wishlist.map(w => ({ title: w.title, category: 'other', price: w.asking_price })),
            preferences: { avgPrice: 2500, topCategories: ['electronics', 'fashion', 'appliances'] },
          }
          sorted.sort((a, b) => {
            const scoreA = getProductFitScoreSync({ title: a.title, category: a.category, price: a.asking_price }, mockProfile)
            const scoreB = getProductFitScoreSync({ title: b.title, category: b.category, price: b.asking_price }, mockProfile)
            return (scoreB?.matchPercentage || 0) - (scoreA?.matchPercentage || 0)
          })
        }
        break
      default: break // relevance = distance-based (already sorted)
    }
    return sorted
  }, [listings, sortBy, primeOnly, filterItemType, user, cart, wishlist, searchQuery])

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero Banner ── */}
      <div className="w-full bg-[#0a6245]" style={{ height: '400px' }}>
        <img 
          src="/neighbour gif.gif" 
          alt="Amazon Neighborhood banner" 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        <div className="max-w-screen-2xl mx-auto px-5 py-5">
          {/* Chatbar with voice */}
          <NeighborhoodChatbar onResults={handleChatResults} />
        </div>
      </div>

      {/* ── Sticky filter bar ── */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 sticky top-[88px] z-30">
        <div className="max-w-screen-2xl mx-auto">

          {/* Location banner */}
          <LocationBanner
            permission={permission}
            loading={loading}
            area={area}
            accuracy={accuracy}
            onRequest={requestLocation}
          />

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Listing-type tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tab === t.id
                      ? 'bg-[#0a6245] border-[#0a6245] text-white font-bold'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Sort & Filter */}
            <div className="flex items-center gap-2">
              {/* Prime toggle */}
              <button
                onClick={() => setPrimeOnly(p => !p)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  primeOnly ? 'bg-[#0066C0] border-[#0066C0] text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>
                Prime
              </button>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={e => {
                  const val = e.target.value as typeof sortBy
                  if ((val === 'best_match' || val === 'likelihood') && !user) {
                    alert('Please sign in to see personalized sorting.')
                    return
                  }
                  setSortBy(val)
                }}
                className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popularity">Popularity</option>
                <option value="best_match">Best Match for You</option>
                <option value="likelihood">Likelihood to Buy</option>
              </select>

              {/* Filter button + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    (filterCategory || filterCondition)
                      ? 'bg-[#0a6245] border-[#0a6245] text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  Filter{(filterCategory || filterCondition) ? ' ●' : ''}
                </button>

                {filterOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 w-56">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-800">Filters</span>
                      {(filterCategory || filterCondition || filterItemType) && (
                        <button
                          onClick={() => { setFilterCategory(''); setFilterCondition(''); setFilterItemType('') }}
                          className="text-xs text-[#CC0C39] hover:underline"
                        >Clear all</button>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Item Type</p>
                    <div className="space-y-1 mb-3">
                      {[
                        { value: '', label: 'All' },
                        { value: 'vintage', label: 'Vintage' },
                        { value: 'refurbished', label: 'Refurbished' },
                        { value: 'like_new', label: 'Like New' },
                        { value: 'good', label: 'Good Condition' },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-[#0a6245]">
                          <input
                            type="radio"
                            name="itemType"
                            checked={filterItemType === opt.value}
                            onChange={() => setFilterItemType(opt.value)}
                            className="accent-[#0a6245] w-3.5 h-3.5"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</p>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-[#0a6245] text-gray-700"
                    >
                      <option value="">All Categories</option>
                      <option value="electronics">Electronics</option>
                      <option value="furniture">Furniture</option>
                      <option value="clothing">Clothing</option>
                      <option value="books">Books</option>
                      <option value="appliances">Appliances</option>
                      <option value="sports">Sports & Outdoors</option>
                      <option value="toys">Toys & Games</option>
                    </select>

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Condition</p>
                    <select
                      value={filterCondition}
                      onChange={e => setFilterCondition(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-[#0a6245] text-gray-700"
                    >
                      <option value="">Any Condition</option>
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>

                    <button
                      onClick={() => setFilterOpen(false)}
                      className="w-full bg-[#0a6245] text-white text-sm font-semibold py-1.5 rounded-lg hover:bg-[#085436] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Count */}
            <span className="text-sm text-gray-500 flex-shrink-0">
              {listings.length} listing{listings.length !== 1 ? 's' : ''} near you
            </span>
          </div>

          {/* AI result sentence */}
          {chatSentence && chatFilters && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-[#0a6245] font-medium">{chatSentence}</p>
              <button
                onClick={() => { setChatFilters(null); setChatSentence('') }}
                className="text-xs text-gray-400 hover:text-gray-600 ml-4"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-screen-2xl mx-auto px-5 pt-5 pb-28 md:pb-10">
        {/* Vintage Marketplace Banner */}
        {filterItemType === 'vintage' && (
          <div className="mb-5 bg-gradient-to-r from-[#3e2723] to-[#5d4037] rounded-xl p-5 text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🏺</span>
            </div>
            <div>
              <h2 className="text-lg font-bold">Vintage Marketplace</h2>
              <p className="text-sm text-white/80">Discover rare finds, antiques, and timeless products with character and history.</p>
            </div>
          </div>
        )}

        {/* Personalized sort notice */}
        {(sortBy === 'best_match' || sortBy === 'likelihood') && user && (
          <div className="mb-4 bg-[#f0f9f4] border border-[#c3e6cb] rounded-lg px-4 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#0a6245]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            <p className="text-sm text-[#0a6245] font-medium">
              {sortBy === 'best_match' ? 'Sorted by best match for you based on your wishlist, cart, and history.' : 'Sorted by likelihood to buy based on your preferences.'}
            </p>
          </div>
        )}

        <ListingGrid listings={sortedListings} />
      </div>

      {/* ── FAB ── */}
      <Link
        to="/neighborhood/list"
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 flex items-center gap-2 bg-[#FF9900] hover:bg-[#e68900] text-black font-bold px-5 py-3 rounded-full shadow-xl transition-all hover:scale-105 z-30 text-sm"
        aria-label="List an item"
      >
        <span className="text-lg font-light leading-none">+</span>
        List an Item
      </Link>
    </div>
  )
}
