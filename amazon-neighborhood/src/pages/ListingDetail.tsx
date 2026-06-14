import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useListings, getSmartFallbackImage } from '../hooks/useListings'
import { useAppContext } from '../context/AppContext'
import { PassportTimeline } from '../components/passport/PassportTimeline'
import { PassportQR } from '../components/passport/PassportQR'
import { ConditionBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { getProductFitScoreSync, type CustomerProfile } from '../lib/productFit'
import { getSellerChatResponse } from '../lib/sellerChatbot'
import { useAuth } from '../context/AuthContext'
import aiCache from '../data/ai_cache.json'
import returnRates from '../data/return_rates.json'

type ReturnRates = typeof returnRates
type ReturnRateKey = keyof ReturnRates

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-[#FF9900]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[#007185] text-sm ml-1 hover:underline cursor-pointer">{rating}</span>
      {count !== undefined && <span className="text-[#007185] text-sm hover:underline cursor-pointer ml-0.5">({count} ratings)</span>}
    </span>
  )
}

// Detect if category is fashion/shoes to show size chart
function isFashionCategory(category: string): boolean {
  const cat = category.toLowerCase()
  return cat.includes('fashion') || cat.includes('clothing') || cat.includes('shoe') ||
    cat.includes('apparel') || cat.includes('wear') || cat.includes('trouser') ||
    cat.includes('shirt') || cat.includes('dress') || cat.includes('jacket') ||
    cat.includes('tops') || cat.includes('bottom') || cat.includes('footwear') ||
    cat.includes('accessories') || cat.includes('bags')
}

// Generate mock specs from listing
function generateSpecs(listing: any): Record<string, string> {
  const cat = listing.category?.toLowerCase() || ''
  const baseSpecs: Record<string, string> = {
    'Brand': listing.brand || 'Generic',
    'Category': listing.category || 'General',
    'Condition': listing.condition_grade,
    'Listed Since': listing.purchase_date || '2024',
    'Serial Number': listing.serial_number || 'N/A',
  }

  if (cat.includes('electronic') || cat.includes('mobile') || cat.includes('laptop') || cat.includes('computer')) {
    return { ...baseSpecs, 'Form Factor': 'Standard', 'Connectivity': 'Multiple', 'Warranty': 'Seller Warranty', 'Country of Origin': 'India' }
  }
  if (isFashionCategory(cat)) {
    return { ...baseSpecs, 'Fit Type': 'Regular', 'Fabric': 'Cotton Blend', 'Closure': 'Standard', 'Country of Origin': 'India' }
  }
  if (cat.includes('furniture') || cat.includes('home') || cat.includes('kitchen')) {
    return { ...baseSpecs, 'Material': 'Premium', 'Assembly': 'Required', 'Weight Capacity': 'Standard', 'Country of Origin': 'India' }
  }
  return { ...baseSpecs, 'Country of Origin': 'India', 'Item Weight': 'Standard', 'Manufacturer': listing.brand || 'Manufacturer' }
}

// Size chart component (only for fashion)
function SizeChart() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm text-[#007185] hover:underline font-medium"
      >
        Size Chart
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden text-xs">
          <table className="w-full text-center">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 font-semibold text-gray-700 border-b">Size</th>
                <th className="py-2 px-3 font-semibold text-gray-700 border-b">Chest (in)</th>
                <th className="py-2 px-3 font-semibold text-gray-700 border-b">Waist (in)</th>
                <th className="py-2 px-3 font-semibold text-gray-700 border-b">Hip (in)</th>
              </tr>
            </thead>
            <tbody>
              {[['S', '36-38', '30-32', '38-40'], ['M', '38-40', '32-34', '40-42'], ['L', '40-42', '34-36', '42-44'], ['XL', '42-44', '36-38', '44-46'], ['XXL', '44-46', '38-40', '46-48']].map(row => (
                <tr key={row[0]} className="border-b last:border-0 hover:bg-gray-50">
                  {row.map((cell, i) => <td key={i} className="py-2 px-3 text-gray-700">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ListingDetail() {
  const { id }      = useParams<{ id: string }>()
  const navigate    = useNavigate()
  const { getById, loading: listingsLoading } = useListings()
  const { addToCart, isWishlisted, toggleWishlist, addCredits, cart, wishlist } = useAppContext()
  const { user } = useAuth()

  const [mainImage, setMainImage]     = useState(0)
  const [chatOpen, setChatOpen]       = useState(false)
  const [chatMsg, setChatMsg]         = useState('')
  const [messages, setMessages]       = useState<{ text: string; mine: boolean; time: string }[]>([])
  const [narrative, setNarrative]     = useState('')
  const [qrOpen, setQrOpen]           = useState(false)
  const [cartAdded, setCartAdded]     = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [qty, setQty]                 = useState(1)
  const [selectedSize, setSelectedSize] = useState('')
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  const [showPassport, setShowPassport] = useState(false)

  const listing = id ? getById(id) : null

  useEffect(() => {
    if (!listing) return
    const cached = (aiCache as Record<string, { passport_narrative?: { narrative: string } }>)[listing.id]
    if (cached?.passport_narrative?.narrative) setNarrative(cached.passport_narrative.narrative)
  }, [listing])

  const fitScore = useMemo(() => {
    if (!listing) return null
    const mockProfile: CustomerProfile = {
      orderHistory: [
        { title: 'Nike Air Max Shoes', category: 'fashion', price: 3499 },
        { title: 'boAt Rockerz Earphones', category: 'electronics', price: 1299 },
        { title: 'Samsung Galaxy Buds', category: 'electronics', price: 4999 },
        { title: 'Bajaj Mixer Grinder', category: 'appliances', price: 2199 },
      ],
      cartItems: cart.map(c => ({ title: c.title, category: 'other', price: c.price })),
      wishlistItems: wishlist.map(w => ({ title: w.title, category: 'other', price: w.asking_price })),
      preferences: { avgPrice: 2500, topCategories: ['electronics', 'fashion', 'appliances', 'baby'] },
    }
    return getProductFitScoreSync(
      { title: listing.title, category: listing.category, price: listing.asking_price },
      mockProfile
    )
  }, [listing, cart, wishlist])

  if (!listing) {
    if (listingsLoading) {
      return (
        <div className="max-w-screen-xl mx-auto px-4 py-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#FF9900] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading product details...</p>
          </div>
        </div>
      )
    }
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Listing not found.</p>
        <Link to="/neighborhood" className="text-[#007185] hover:underline mt-2 inline-block">Back to Neighbourhood</Link>
      </div>
    )
  }

  const depreciation   = Math.round((1 - listing.asking_price / listing.original_price) * 100)
  const returnRateData = listing.return_rate_key
    ? (returnRates as ReturnRates)[listing.return_rate_key as ReturnRateKey]
    : null
  const wishlisted = isWishlisted(listing.id)
  const isFashion  = isFashionCategory(listing.category)
  const specs      = generateSpecs(listing)
  const specEntries = Object.entries(specs)
  const reviews    = listing.reviews || []

  // Shoe sizes
  const shoeSizes  = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']
  // Clothing sizes
  const clothSizes = ['S', 'M', 'L', 'XL', 'XXL']

  const handleAddToCart = () => {
    if (!user) { navigate('/login', { state: { from: `/neighborhood/listing/${listing.id}` } }); return }
    addToCart({ id: listing.id, title: listing.title, price: listing.asking_price, image: listing.images[0], condition_grade: listing.condition_grade, seller_name: listing.seller_name, quantity: qty })
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2500)
  }

  const handleToggleWishlist = () => {
    if (!user) { navigate('/login', { state: { from: `/neighborhood/listing/${listing.id}` } }); return }
    toggleWishlist({ id: listing.id, title: listing.title, asking_price: listing.asking_price, original_price: listing.original_price, image: listing.images[0], condition_grade: listing.condition_grade, distance_km: listing.distance_km })
  }

  const handleBuyNow = () => {
    if (!user) { navigate('/login', { state: { from: `/neighborhood/checkout/${listing.id}` } }); return }
    navigate(`/neighborhood/checkout/${listing.id}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMsg.trim()) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const msg = chatMsg.trim()
    setMessages(prev => [...prev, { text: msg, mine: true, time: now }])
    setChatMsg('')
    const response = await getSellerChatResponse(msg, {
      productTitle: listing.title, category: listing.category, conditionGrade: listing.condition_grade,
      conditionSummary: listing.condition_summary, defects: listing.defects,
      askingPrice: listing.asking_price, originalPrice: listing.original_price,
      sellerName: listing.seller_name, ageYears: undefined,
    })
    setMessages(prev => [...prev, { text: response, mine: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
  }
  
  const handleSendTemplateQuestion = async (question: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => [...prev, { text: question, mine: true, time: now }])
    const response = await getSellerChatResponse(question, {
      productTitle: listing.title, category: listing.category, conditionGrade: listing.condition_grade,
      conditionSummary: listing.condition_summary, defects: listing.defects,
      askingPrice: listing.asking_price, originalPrice: listing.original_price,
      sellerName: listing.seller_name, ageYears: undefined,
    })
    setMessages(prev => [...prev, { text: response, mine: false, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
  }

  const handleVoiceChat = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-IN'
    if (isRecording) { setIsRecording(false); return }
    setIsRecording(true)
    recognition.onresult = (e: any) => { setChatMsg(e.results[0][0].transcript); setIsRecording(false) }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend   = () => setIsRecording(false)
    recognition.start()
  }

  // Fit color
  const fitColor = fitScore
    ? fitScore.matchPercentage >= 80 ? '#067D62' : fitScore.matchPercentage >= 60 ? '#FF9900' : '#6c757d'
    : '#6c757d'

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-2 pb-24 md:pb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#007185] mb-3 flex items-center gap-1 flex-wrap">
        <Link to="/" className="hover:underline">Home</Link>
        <span>›</span>
        <Link to="/neighborhood" className="hover:underline">Neighbourhood</Link>
        <span>›</span>
        <span className="text-gray-500 truncate max-w-[250px]">{listing.title}</span>
      </nav>

      {/* ── Main 3-column Amazon layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_250px] gap-4 mb-8">

        {/* ── Col 1: Image gallery (main image + thumbnails below) ── */}
        <div className="sticky top-24 self-start">
          {/* Main image */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
            <img src={listing.images[mainImage]} alt={`${listing.title} main image`} className="w-full h-full object-contain p-4" onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = getSmartFallbackImage(listing.title, listing.category) }} />
          </div>
          {/* "Click to see full view" text */}
          <p className="text-center text-xs text-[#007185] mt-2 cursor-pointer hover:underline">Click to see full view</p>
          {/* Thumbnails row below */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
            {listing.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(i)}
                className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${i === mainImage ? 'border-[#FF9900]' : 'border-gray-200 hover:border-gray-400'}`}
                aria-label={`View image ${i + 1}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = getSmartFallbackImage(listing.title, listing.category) }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Col 2: Product info ── */}
        <div className="space-y-4">
          {/* Brand / Store link */}
          <p className="text-sm text-[#007185] hover:underline cursor-pointer font-medium">
            Visit the {listing.brand || listing.seller_name} Store
          </p>

          {/* Title */}
          <h1 className="text-xl font-medium text-gray-900 leading-snug">{listing.title}</h1>

          {/* Ratings row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StarRating rating={listing.seller_rating} count={reviews.length || 76} />
            <ConditionBadge grade={listing.condition_grade} />
            {listing.is_local_artisan && (
              <span className="text-xs bg-orange-50 text-[#FF6200] border border-[#FF6200] px-2 py-0.5 rounded font-semibold">Local Maker</span>
            )}
          </div>

          <div className="border-b border-gray-200" />

          {/* Price block */}
          {listing.listing_type === 'exchange' ? (
            <div>
              <p className="text-2xl font-bold text-[#0a6245]">Exchange Listing</p>
              <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Wants:</span> {listing.exchange_want}</p>
            </div>
          ) : listing.listing_type === 'donate' ? (
            <p className="text-2xl font-bold text-[#0a6245]">Free — Donate</p>
          ) : (
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">-{depreciation}%</span>
                <span className="text-3xl font-medium text-gray-900">
                  <sup className="text-base">₹</sup>{listing.asking_price.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                M.R.P.: <span className="line-through">₹{listing.original_price.toLocaleString('en-IN')}</span>
              </p>
              <p className="text-sm text-[#0a6245] font-semibold mt-0.5">
                -{depreciation}% from original — AI verified
              </p>
              <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            </div>
          )}

          {/* EMI */}
          {listing.listing_type !== 'donate' && listing.listing_type !== 'exchange' && (
            <p className="text-sm text-gray-700">
              EMI starts at ₹{Math.round(listing.asking_price / 12).toLocaleString('en-IN')}/month. No Cost EMI available{' '}
              <span className="text-[#007185] hover:underline cursor-pointer font-medium">EMI options ▾</span>
            </p>
          )}

          {/* Offers strip */}
          {listing.listing_type !== 'donate' && (
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-[#007185]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-sm text-gray-800">Offers</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <div className="flex-shrink-0 border border-gray-200 rounded p-2 text-xs w-44">
                  <p className="font-semibold text-gray-800">Cashback</p>
                  <p className="text-gray-600 mt-0.5">Upto ₹{Math.round(listing.asking_price * 0.03).toLocaleString('en-IN')} cashback as Amazon Pay Balance...</p>
                  <p className="text-[#007185] mt-1 font-medium">1 offer ›</p>
                </div>
                <div className="flex-shrink-0 border border-gray-200 rounded p-2 text-xs w-44">
                  <p className="font-semibold text-gray-800">No Cost EMI</p>
                  <p className="text-gray-600 mt-0.5">Upto ₹{Math.round(listing.asking_price * 0.05).toLocaleString('en-IN')} EMI interest savings...</p>
                  <p className="text-[#007185] mt-1 font-medium">2 offers ›</p>
                </div>
                <div className="flex-shrink-0 border border-gray-200 rounded p-2 text-xs w-44">
                  <p className="font-semibold text-gray-800">Bank Offers</p>
                  <p className="text-gray-600 mt-0.5">Upto 10% off on select bank credit cards...</p>
                  <p className="text-[#007185] mt-1 font-medium">5 offers ›</p>
                </div>
              </div>
            </div>
          )}

          {/* Color swatches — simulated with images */}
          {listing.images.length > 1 && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">
                Color: <span className="font-normal">{listing.condition_grade}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {listing.images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImage(i)}
                    className={`border-2 rounded p-0.5 w-16 h-20 overflow-hidden transition-all ${mainImage === i ? 'border-[#007185]' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover rounded" />
                    <p className="text-[9px] text-gray-500 mt-0.5 text-center truncate">₹{listing.asking_price.toLocaleString('en-IN')}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector — only for fashion */}
          {isFashion && (
            <div>
              <p className="text-sm font-medium text-gray-800 mb-2">
                Size: <span className="font-normal">{selectedSize || 'Select a size'}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {(listing.category.toLowerCase().includes('shoe') || listing.category.toLowerCase().includes('footwear')
                  ? shoeSizes : clothSizes
                ).map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border-2 rounded text-sm font-medium transition-all ${
                      selectedSize === size
                        ? 'border-[#007185] bg-blue-50 text-[#007185]'
                        : 'border-gray-300 text-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <SizeChart />
            </div>
          )}

          {/* Product Fit Match */}
          {fitScore && (
            <div className={`border-2 rounded-xl p-4 ${
              fitScore.matchPercentage >= 80 ? 'border-[#067D62] bg-[#f0f9f4]' :
              fitScore.matchPercentage >= 60 ? 'border-[#FF9900] bg-orange-50' :
              'border-gray-300 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3">
                {/* Circular progress */}
                <div className="relative flex-shrink-0 w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                    <circle
                      cx="28" cy="28" r="22" fill="none" stroke={fitColor} strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - fitScore.matchPercentage / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: fitColor }}>
                    {fitScore.matchPercentage}%
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: fitColor }}>{fitScore.matchLabel} for you</p>
                  <p className="text-xs text-gray-600 mt-0.5">{fitScore.reasons[0]}</p>
                </div>
              </div>
              {fitScore.warnings.length > 0 && (
                <div className="mt-2 bg-[#FFF3CD] rounded-lg px-3 py-2 text-xs text-gray-700">
                  {fitScore.warnings[0]}
                </div>
              )}
            </div>
          )}

          {/* Seller card */}
          <div className="border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#131921] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {listing.seller_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{listing.seller_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating rating={listing.seller_rating} />
                <span className="text-xs text-gray-500">({Math.round(listing.seller_rating * 12)}+ sales)</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Amazon verified since {listing.seller_since}</p>
              <p className="text-xs text-[#0a6245] mt-0.5">Responds within 2 hours</p>

              {/* Verified Neighborhood Seller badge - shown if rating > 4 */}
              {listing.seller_rating > 4 && (
                <div className="mt-1.5 relative group/seller inline-flex items-center gap-1 bg-[#f0f9f4] border border-[#c3e6cb] rounded-full px-2.5 py-1">
                  <svg className="w-3.5 h-3.5 text-[#067D62]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span className="text-[11px] font-semibold text-[#067D62]">Verified Neighbourhood Seller</span>
                  {/* Tooltip */}
                  <span className="absolute bottom-full left-0 mb-2 w-52 bg-[#131921] text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover/seller:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                    Rated by verified buyers on Amazon Neighbourhood. This seller has a rating above 4.0 with consistent positive reviews.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Open Box Delivery badge */}
          <div className="border border-[#067D62] rounded-xl p-4 bg-[#f0f9f4] relative group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#067D62] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#067D62]">Open Box Delivery</p>
                <p className="text-xs text-gray-600 mt-0.5">Inspect your product before accepting delivery</p>
              </div>
              <div className="ml-auto">
                <span className="text-gray-400 cursor-help relative" title="With Open Box Delivery, you can inspect the product at your doorstep before accepting. If unsatisfied, raise a return instantly — no questions asked.">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {/* Tooltip */}
                  <span className="absolute bottom-full right-0 mb-2 w-56 bg-[#131921] text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                    With Open Box Delivery, you can inspect the product at your doorstep before accepting. If unsatisfied, raise a return instantly — no questions asked.
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Return risk warning */}
          {returnRateData && returnRateData.return_rate > 25 && (
            <div className="p-3 bg-[#FFF3CD] border-l-4 border-[#FF9900] rounded-r text-sm" role="alert">
              <p className="font-semibold text-gray-900">{returnRateData.return_rate}% of buyers returned this product</p>
              <p className="text-gray-700 text-xs mt-0.5">Most common reason: {returnRateData.top_reason}</p>
              <button className="text-xs text-[#007185] hover:underline mt-1">See alternatives</button>
            </div>
          )}

          {/* Green credits */}
          <div className="flex items-center gap-2 text-sm text-[#0a6245] font-medium bg-[#f0f9f4] border border-[#c3e6cb] rounded-xl px-4 py-3">
            <div className="w-6 h-6 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.54c-.23.39-.1.87.27 1.1.37.22.84.09 1.06-.29C7 17 9 13 17 11v3l4-4-4-4v2z"/>
              </svg>
            </div>
            <span>Buy this and earn <strong>{listing.green_credits} credits</strong> toward your next order</span>
          </div>

          {/* Estimated resale value */}
          {listing.resale_value_1yr > 0 && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-semibold text-gray-700">
                Estimated resale value in 1 year:{' '}
                <span className="text-[#0a6245] text-base">₹{listing.resale_value_1yr.toLocaleString('en-IN')}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Based on depreciation curves. Buy smart, sell later.</p>
            </div>
          )}

          {/* Product Passport toggle */}
          <button
            onClick={() => setShowPassport(p => !p)}
            className="flex items-center gap-2 text-sm text-[#0a6245] font-semibold hover:underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Product Passport {showPassport ? '▲' : '▼'}
          </button>
          {showPassport && listing.passport_nodes?.length > 0 && (
            <div className="border border-[#c3e6cb] rounded-xl p-4 bg-[#f0f9f4]">
              <PassportTimeline nodes={listing.passport_nodes} narrative={narrative} />
              <button
                onClick={() => setQrOpen(true)}
                className="mt-3 flex items-center gap-2 text-xs text-[#0a6245] font-semibold hover:underline"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Show Passport QR — Scan at meetpoint
              </button>
            </div>
          )}

          {/* Condition Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
              Condition Details
            </h2>
            <p className="text-sm text-gray-700 mb-3">{listing.condition_summary}</p>
            {listing.defects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {listing.defects.map((d, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{d}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#0a6245] font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                No defects reported
              </p>
            )}
          </div>
        </div>

        {/* ── Col 3: Buy box ── */}
        <div>
          <div className="border border-gray-200 rounded-lg p-4 sticky top-24 space-y-2">
            {/* Price */}
            {listing.listing_type !== 'donate' && listing.listing_type !== 'exchange' && (
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-medium text-gray-900">
                    <sup className="text-xs align-top">₹</sup>{listing.asking_price.toLocaleString('en-IN')}<sup className="text-xs align-top">00</sup>
                  </span>
                </div>
                <span className="inline-block text-xs bg-[#232F3E] text-white px-2 py-0.5 rounded mt-1 font-medium">
                  🔒 Fulfilled
                </span>
                <p className="text-sm text-gray-900 mt-2">
                  <span className="text-[#007185] font-medium">FREE delivery</span>{' '}
                  <strong>Tuesday, 16 June</strong>
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  Or fastest delivery <strong>Today 6 pm - 10 pm</strong>.{' '}
                  <span className="text-[#CC0C39] font-medium">Order within 22 mins.</span>{' '}
                  <span className="text-[#007185] hover:underline cursor-pointer">Details</span>
                </p>
                <p className="text-xs text-gray-700 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-[#0a6245]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  Delivering to {listing.location_area} —{' '}
                  <span className="text-[#007185] hover:underline cursor-pointer">Update location</span>
                </p>
              </div>
            )}

            {/* In stock */}
            <p className="text-[#0a6245] font-semibold text-lg">In stock</p>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700" htmlFor="qty-select">Quantity:</label>
              <select
                id="qty-select"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm bg-[#f0f2f2] focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* CTAs */}
            {listing.listing_type !== 'exchange' && listing.listing_type !== 'donate' ? (
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleAddToCart}
                  className={`w-full font-bold py-2 rounded-full text-sm transition-all ${
                    cartAdded ? 'bg-[#0a6245] text-white' : 'bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] border border-[#FCD200]'
                  }`}
                >
                  {cartAdded ? '✓ Added to cart' : 'Add to cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-[#FFA41C] hover:bg-[#fa8900] text-[#0F1111] font-bold py-2 rounded-full text-sm border border-[#FF8F00] transition-colors"
                >
                  Buy Now
                </button>
              </div>
            ) : listing.listing_type === 'donate' ? (
              <button onClick={handleAddToCart} className="w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-bold py-2 rounded-full text-sm border border-[#FCD200]">
                Claim Free Item
              </button>
            ) : (
              <button onClick={handleBuyNow} className="w-full bg-[#FFA41C] hover:bg-[#fa8900] text-[#0F1111] font-bold py-2 rounded-full text-sm border border-[#FF8F00]">
                Propose Exchange
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={handleToggleWishlist}
              className={`w-full flex items-center justify-center gap-1.5 border py-2 rounded-full text-sm font-semibold transition-all ${
                wishlisted ? 'border-[#CC0C39] text-[#CC0C39] bg-red-50' : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              }`}
              aria-pressed={wishlisted}
            >
              <svg className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>

            {/* Ships from / Sold by table */}
            <div className="text-xs text-gray-600 space-y-1 border-t pt-3 mt-2">
              <div className="flex"><span className="w-20 text-gray-500">Ships from</span><span className="font-medium text-gray-900">Amazon</span></div>
              <div className="flex"><span className="w-20 text-gray-500">Sold by</span><span className="text-[#007185] font-medium hover:underline cursor-pointer">{listing.seller_name}</span></div>
              <div className="flex"><span className="w-20 text-gray-500">Payment</span><span className="font-medium text-gray-900">Secure transaction</span></div>
            </div>

            {/* Chat box */}
            <button
              onClick={() => setChatOpen(true)}
              className="w-full mt-3 flex items-center gap-3 border-2 border-[#FF9900] rounded-lg p-4 hover:bg-[#fff8e7] hover:shadow-md transition-all text-left"
            >
              <svg className="w-7 h-7 text-[#FF9900] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-bold text-gray-900">Chat</p>
                <p className="text-xs text-gray-500">Ask about this item</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Chat Popup Modal ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setChatOpen(false)} />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#131921] text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-sm">Chat</span>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-300 hover:text-white transition-colors" aria-label="Close chat">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product context */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <img src={listing.images[0]} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{listing.title}</p>
                <p className="text-[10px] text-gray-500">
                  {listing.listing_type === 'donate' ? 'Free' : `₹${listing.asking_price.toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>

            {/* Privacy note */}
            <p className="text-[10px] text-[#0a6245] bg-[#f0f9f4] px-4 py-1.5 text-center font-medium flex-shrink-0">
              Your contact details are never shared. Chat is powered by AI.
            </p>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-gray-500 font-medium mb-2">Ask a question to start chatting!</p>
                  <p className="text-xs text-gray-400">Choose a suggestion below or type your own.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${msg.mine ? 'bg-[#FF9900] text-black font-medium' : 'bg-gray-100 text-gray-900'}`}>
                    {msg.text}
                    <p className="text-[10px] opacity-60 mt-0.5 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested questions (only when no messages) */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Is it still available?",
                    "What's the condition?",
                    "Can I negotiate?",
                    "Product specs?"
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSendTemplateQuestion(q)}
                      className="text-[11px] bg-white border border-gray-300 hover:border-[#FF9900] text-gray-700 px-2.5 py-1.5 rounded-full font-medium transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 p-3 border-t border-gray-200 bg-white flex-shrink-0">
              <input
                type="text"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleVoiceChat}
                className={`p-2 rounded-full border transition-colors ${isRecording ? 'bg-red-50 border-red-400 text-red-600 animate-pulse' : 'border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                aria-label="Voice input"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={!chatMsg.trim()}
                className="bg-[#FF9900] text-black p-2 rounded-full hover:bg-[#e68900] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Below fold: Specifications ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Product Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {(showAllSpecs ? specEntries : specEntries.slice(0, 6)).map(([key, val], i) => (
            <div key={key} className={`flex py-2.5 ${i % 2 === 0 ? 'bg-[#f8f8f8]' : 'bg-white'} px-3`}>
              <span className="text-sm text-gray-600 w-44 flex-shrink-0 font-medium">{key}</span>
              <span className="text-sm text-gray-900">{val}</span>
            </div>
          ))}
        </div>
        {specEntries.length > 6 && (
          <button
            onClick={() => setShowAllSpecs(s => !s)}
            className="mt-3 text-sm text-[#007185] hover:underline font-medium"
          >
            {showAllSpecs ? 'Show less ▲' : `See all ${specEntries.length} specifications ▼`}
          </button>
        )}
      </div>

      {/* ── Hear What the Previous Owner Wants to Say ── */}
      {listing.seller_story && listing.seller_story.reason_for_selling && (
        <div className="bg-[#fdf8f0] rounded-xl border border-[#f0e0c0] p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clipRule="evenodd" />
            </svg>
            Hear What the Previous Owner Wants to Say
          </h2>
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              {/* Quote icon */}
              <svg className="w-8 h-8 text-[#FF9900] flex-shrink-0 opacity-60 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z"/>
              </svg>
              <div className="flex-1">
                <p className="text-sm text-gray-800 leading-relaxed italic">
                  "{listing.seller_story.reason_for_selling}"
                </p>
                {listing.seller_story.additional_notes && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {listing.seller_story.additional_notes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-3 font-medium">
                  — {listing.seller_name.split(' ')[0]}
                </p>
              </div>
            </div>
            {/* Warranty & Packaging badges */}
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${listing.seller_story.under_warranty ? 'bg-[#067D62]' : 'bg-gray-300'}`} />
                <span className="text-gray-600">
                  Warranty: <span className="font-medium text-gray-900">{listing.seller_story.under_warranty ? 'Yes' : 'No'}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${listing.seller_story.original_packaging ? 'bg-[#067D62]' : 'bg-gray-300'}`} />
                <span className="text-gray-600">
                  Original Packaging: <span className="font-medium text-gray-900">{listing.seller_story.original_packaging ? 'Yes' : 'No'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Condition Details (full section) ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Condition Details</h2>
        <div className="flex items-center gap-3 mb-3">
          <ConditionBadge grade={listing.condition_grade} />
          <span className="text-sm text-gray-600">AI Graded · Amazon Verified</span>
        </div>
        <p className="text-sm text-gray-700 mb-3">{listing.condition_summary}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['Functionality', 'Cosmetics', 'Battery Health', 'Accessories'].map(aspect => (
            <div key={aspect} className="bg-gray-50 rounded-lg p-3 text-center">
              <div className={`text-lg font-bold mb-1 ${listing.condition_grade === 'Like New' ? 'text-[#0a6245]' : listing.condition_grade === 'Good' ? 'text-[#FF9900]' : 'text-[#CC0C39]'}`}>
                {listing.condition_grade === 'Like New' ? 'A' : listing.condition_grade === 'Good' ? 'B' : 'C'}
              </div>
              <p className="text-xs text-gray-500">{aspect}</p>
            </div>
          ))}
        </div>
        {listing.defects.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-800 mb-1">Known Issues:</p>
            <div className="flex flex-wrap gap-1.5">
              {listing.defects.map((d, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Customer Reviews ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h2>

        {/* Rating summary */}
        <div className="flex items-center gap-6 mb-5 pb-5 border-b border-gray-100">
          <div className="text-center">
            <p className="text-5xl font-bold text-gray-900">{listing.seller_rating}</p>
            <StarRating rating={listing.seller_rating} />
            <p className="text-xs text-gray-500 mt-1">out of 5</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(star => {
              const pct = star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-[#007185] hover:underline cursor-pointer w-8 text-right">{star} star</span>
                  <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF9900] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[#007185] hover:underline cursor-pointer w-6">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Individual reviews */}
        <div className="space-y-5">
          {reviews.length > 0 ? reviews.slice(0, 5).map((review, i) => (
            <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {review.reviewerName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-semibold text-gray-800">{review.reviewerName || 'Verified Buyer'}</span>
              </div>
              <StarRating rating={review.rating} />
              <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
              <p className="text-xs text-gray-400 mt-1">Verified Purchase</p>
            </div>
          )) : (
            // Fallback synthetic reviews
            [{name:'Rahul K.', rating:5, comment:'Excellent condition! Exactly as described. The seller was very prompt in responding. Highly recommend.'},
             {name:'Priya M.', rating:4, comment:'Good product, minor wear but nothing that affects functionality. Great value for money. Would buy again.'},
             {name:'Amit S.', rating:4, comment:'Smooth transaction. Item arrived well-packaged. Condition matched the listing perfectly.'},
            ].map((r, i) => (
              <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-[#131921] flex items-center justify-center text-xs font-bold text-white">
                    {r.name[0]}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                </div>
                <StarRating rating={r.rating} />
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.comment}</p>
                <p className="text-xs text-gray-400 mt-1">Verified Purchase</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="Product Passport QR Code">
        <PassportQR listingId={listing.id} serialNumber={listing.serial_number} />
        <p className="text-xs text-gray-500 mt-3 text-center">
          Seller shows this QR at the Amazon Locker meetpoint. Buyer scans to see full ownership history.
        </p>
      </Modal>

    </main>
  )
}
