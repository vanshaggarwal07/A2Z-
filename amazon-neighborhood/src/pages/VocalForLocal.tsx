import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useListings } from '../hooks/useListings'
import { useLocation } from '../hooks/useLocation'
import { ListingGrid } from '../components/listing/ListingGrid'

const RADIUS_PRESETS = [2, 5, 10, 25]

const CATEGORY_TABS = [
  { id: 'all',          label: 'All' },
  { id: 'handicrafts',  label: 'Handicrafts' },
  { id: 'food',         label: 'Food & Grocery' },
  { id: 'clothing',     label: 'Clothing' },
  { id: 'electronics',  label: 'Electronics' },
  { id: 'furniture',    label: 'Furniture' },
]

// ── Location permission banner ───────────────────────────────────────────────
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
      <div className="flex items-center gap-2 bg-[#fff8e7] border border-[#e0a800] rounded px-3 py-2 text-xs text-[#7a5800] mb-3">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">{area}</span>
        {accuracy && <span className="text-[#7a5800]/60">±{Math.round(accuracy)}m</span>}
        <span className="ml-auto text-[#7a5800]/60">Live GPS</span>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 bg-[#FFF3CD] border border-[#FF9900] rounded px-3 py-2 text-xs text-gray-700 mb-3">
        <svg className="w-3.5 h-3.5 text-[#FF9900] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Location access denied. Showing Delhi NCR sellers.
        <button onClick={onRequest} className="ml-auto text-[#007185] hover:underline font-medium whitespace-nowrap">
          Enable location
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded px-3 py-2.5 text-sm mb-3 shadow-sm">
      <svg className="w-4 h-4 text-[#e07b00] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-gray-600 flex-1">Allow location to find sellers near you</span>
      <button
        onClick={onRequest}
        disabled={loading}
        className="bg-[#e07b00] text-white text-xs font-semibold px-3 py-1.5 rounded hover:bg-[#c46a00] transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? 'Locating…' : 'Use my location'}
      </button>
    </div>
  )
}

// ── Custom radius modal ──────────────────────────────────────────────────────
function CustomRadiusButton({ value, onSet }: { value: number; onSet: (v: number) => void }) {
  const [open, setOpen]   = useState(false)
  const [input, setInput] = useState(String(value))
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
              type="number" min={1} max={100} value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900] w-0"
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              autoFocus
            />
            <button onClick={handleApply} className="bg-[#FF9900] text-black text-xs font-bold px-2 py-1 rounded">Set</button>
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

// ── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar() {
  return (
    <div className="bg-[#fff8e7] border-b border-[#ffe0a0] px-5 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-8 flex-wrap text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#e07b00]">2.4 L+</span>
          <span className="text-gray-600 text-xs leading-tight">Local<br/>Sellers</span>
        </div>
        <div className="w-px h-8 bg-[#ffe0a0]" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#e07b00]">18+</span>
          <span className="text-gray-600 text-xs leading-tight">Cities<br/>Covered</span>
        </div>
        <div className="w-px h-8 bg-[#ffe0a0]" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#e07b00]">₹0</span>
          <span className="text-gray-600 text-xs leading-tight">Delivery<br/>from locals</span>
        </div>
        <div className="w-px h-8 bg-[#ffe0a0]" />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#e07b00]">48 hr</span>
          <span className="text-gray-600 text-xs leading-tight">Faster<br/>Delivery</span>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2 bg-white border border-[#e07b00] rounded-full px-4 py-1.5 text-xs font-semibold text-[#e07b00]">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Buy local. Ship less. Save more.
        </div>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export function VocalForLocal() {
  const [radius, setRadius]   = useState(10)
  const [tab, setTab]         = useState('all')
  const [sortBy, setSortBy]   = useState<'relevance' | 'price_low' | 'price_high' | 'popularity'>('relevance')
  const [primeOnly, setPrimeOnly] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCondition, setFilterCondition] = useState('')

  const { lat, lng, permission, loading, area, accuracy, requestLocation } = useLocation()

  const { listings } = useListings({
    radiusKm: radius,
    userLat:  lat,
    userLng:  lng,
    tab:      'all', // show all types, we filter by category tab below
  })

  // Filter by category tab
  const tabFilteredListings = useMemo(() => {
    if (tab === 'all') return listings
    return listings.filter(l => l.category.toLowerCase().includes(tab))
  }, [listings, tab])

  const sortedListings = useMemo(() => {
    let sorted = [...tabFilteredListings]
    if (primeOnly) sorted = sorted.filter(l => l.seller_rating >= 4.5)
    if (filterCategory) sorted = sorted.filter(l => l.category.toLowerCase().includes(filterCategory.toLowerCase()))
    switch (sortBy) {
      case 'price_low':  sorted.sort((a, b) => a.asking_price - b.asking_price); break
      case 'price_high': sorted.sort((a, b) => b.asking_price - a.asking_price); break
      case 'popularity': sorted.sort((a, b) => b.seller_rating - a.seller_rating); break
      default: break
    }
    return sorted
  }, [tabFilteredListings, sortBy, primeOnly, filterCategory])

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero Banner ── */}
      <div className="w-full bg-[#e07b00]" style={{ height: '400px' }}>
        <video
          src="/voacl for local video.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill' }}
        />
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
            {/* Radius + category tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm text-gray-500 mr-1">Within</span>

              {RADIUS_PRESETS.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  aria-pressed={radius === r}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    radius === r
                      ? 'bg-[#FF9900] border-[#FF9900] text-white font-bold'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 bg-white'
                  }`}
                >
                  {r} km
                </button>
              ))}

              <CustomRadiusButton value={radius} onSet={setRadius} />

              <div className="w-px h-5 bg-gray-300 mx-1" />

              {CATEGORY_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    tab === t.id
                      ? 'bg-[#e07b00] border-[#e07b00] text-white font-bold'
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

              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1 rounded-full text-sm border border-gray-300 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>

              {/* Filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                    (filterCategory || filterCondition)
                      ? 'bg-[#e07b00] border-[#e07b00] text-white'
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
                      {(filterCategory || filterCondition) && (
                        <button
                          onClick={() => { setFilterCategory(''); setFilterCondition('') }}
                          className="text-xs text-[#CC0C39] hover:underline"
                        >Clear all</button>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Category</p>
                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-[#e07b00] text-gray-700"
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
                      className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 mb-3 focus:outline-none focus:ring-1 focus:ring-[#e07b00] text-gray-700"
                    >
                      <option value="">Any Condition</option>
                      <option value="new">New</option>
                      <option value="like_new">Like New</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                    </select>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="w-full bg-[#e07b00] text-white text-sm font-semibold py-1.5 rounded-lg hover:bg-[#c46a00] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Count */}
            <span className="text-sm text-gray-500 flex-shrink-0">
              {sortedListings.length} local seller{sortedListings.length !== 1 ? 's' : ''} near you
            </span>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-screen-2xl mx-auto px-5 pt-5 pb-28 md:pb-10">
        {sortedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#fff8e7] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#e07b00]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No local sellers found</h2>
            <p className="text-sm text-gray-500 mb-4">Try increasing your radius or enabling location access.</p>
            <button
              onClick={() => setRadius(25)}
              className="bg-[#e07b00] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#c46a00] transition-colors"
            >
              Expand to 25 km
            </button>
          </div>
        ) : (
          <ListingGrid listings={sortedListings} />
        )}
      </div>
    </div>
  )
}
