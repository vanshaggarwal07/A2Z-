import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Listing } from '../../hooks/useListings'
import { getSmartFallbackImage } from '../../hooks/useListings'
import { getProductFitScoreSync, type CustomerProfile } from '../../lib/productFit'
import { useAppContext } from '../../context/AppContext'

const CONDITION_BADGE: Record<string, { bg: string; text: string }> = {
  'Like New': { bg: '#067D62', text: 'Like New' },
  Good:       { bg: '#0066C0', text: 'Good' },
  Fair:       { bg: '#B8860B', text: 'Fair' },
  'For Parts':{ bg: '#CC0C39', text: 'For Parts' },
}

export function ListingCard({ listing }: { listing: Listing }) {
  const badge     = CONDITION_BADGE[listing.condition_grade] ?? { bg: '#555', text: listing.condition_grade }
  const isExchange = listing.listing_type === 'exchange'
  const isDonate   = listing.listing_type === 'donate'
  const { cart, wishlist } = useAppContext()

  // Quick fit score for card
  const fitPct = useMemo(() => {
    const mockProfile: CustomerProfile = {
      orderHistory: [
        { title: 'Nike Air Max Shoes', category: 'fashion', price: 3499 },
        { title: 'boAt Rockerz Earphones', category: 'electronics', price: 1299 },
        { title: 'Samsung Galaxy Buds', category: 'electronics', price: 4999 },
      ],
      cartItems: cart.map(c => ({ title: c.title, category: 'other', price: c.price })),
      wishlistItems: wishlist.map(w => ({ title: w.title, category: 'other', price: w.asking_price })),
      preferences: { avgPrice: 2500, topCategories: ['electronics', 'fashion', 'appliances', 'baby'] },
    }
    const result = getProductFitScoreSync(
      { title: listing.title, category: listing.category, price: listing.asking_price },
      mockProfile
    )
    return result.matchPercentage
  }, [listing, cart, wishlist])
  const discount   = Math.round((1 - listing.asking_price / listing.original_price) * 100)

  return (
    <Link
      to={`/neighborhood/listing/${listing.id}`}
      className="block bg-white border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow duration-200"
      aria-label={`${listing.title}, ${listing.condition_grade} condition`}
    >
      {/* ── Image block ── */}
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/3' }}>
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget
            target.onerror = null
            target.src = getSmartFallbackImage(listing.title, listing.category)
          }}
        />

        {/* Condition badge — top left, exactly like screenshot */}
        <span
          className="absolute top-2 left-2 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm"
          style={{ backgroundColor: badge.bg }}
        >
          {badge.text}
        </span>

        {/* Local Maker badge — top left below condition if both */}
        {listing.is_local_artisan && (
          <span className="absolute top-8 left-2 text-white text-[11px] font-bold px-2 py-0.5 rounded-sm bg-[#FF6200]">
            Local Maker
          </span>
        )}

        {/* Vintage badge — gold antique style */}
        {(() => {
          const t = listing.title.toLowerCase()
          const yearMatch = listing.purchase_date.match(/(\d{4})/)
          const isVintage = t.includes('vintage') || t.includes('antique') || t.includes('retro') || (yearMatch && parseInt(yearMatch[1]) <= 2022)
          return isVintage ? (
            <span className="absolute top-2 right-2 text-[#3e2723] text-[10px] font-bold px-2 py-0.5 rounded-sm bg-gradient-to-r from-[#FFD700] to-[#FFA000] shadow-sm" style={{ fontFamily: 'serif' }}>
              ✦ Vintage
            </span>
          ) : null
        })()}

        {/* Distance pill — bottom right */}
        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {listing.distance_km.toFixed(1)} km
        </span>
      </div>

      {/* ── Card body ── */}
      <div className="px-3 pt-2.5 pb-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-[#007185] transition-colors">
          {listing.title}
        </h3>

        {/* Price row */}
        {isExchange ? (
          <p className="text-sm font-semibold text-[#067D62]">Exchange</p>
        ) : isDonate ? (
          <p className="text-sm font-semibold text-[#067D62]">Free — Donate</p>
        ) : (
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base font-bold text-[#0F1111]">
              ₹{listing.asking_price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-gray-400 line-through">
              ₹{listing.original_price.toLocaleString('en-IN')}
            </span>
            {discount > 0 && (
              <span className="text-xs text-[#CC0C39] font-semibold">
                -{discount}%
              </span>
            )}
          </div>
        )}

        {/* Green credits */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#2D6A4F] bg-[#e6f4ee] px-1.5 py-0.5 rounded-sm">
            +{listing.green_credits} Green Credits
          </span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
            style={{
              backgroundColor: fitPct >= 80 ? '#e6f4ee' : fitPct >= 60 ? '#FFF3CD' : '#f8d7da',
              color: fitPct >= 80 ? '#067D62' : fitPct >= 60 ? '#B8860B' : '#CC0C39',
            }}
          >
            {fitPct}% match
          </span>
        </div>

        {/* Seller */}
        <p className="mt-1.5 text-[11px] text-gray-500 truncate">
          Sold by <span className="text-gray-700 font-medium">{listing.seller_name.split(' ')[0]}</span>
          &nbsp;&bull;&nbsp;
          <span className="text-[#FF9900]">{'★'.repeat(Math.round(listing.seller_rating))}{'☆'.repeat(5 - Math.round(listing.seller_rating))}</span>
          <span className="text-gray-400 ml-1">({Math.round(listing.seller_rating * 12)}+ sales)</span>
        </p>
        {/* Amazon Verified badge */}
        <p className="mt-1 flex items-center gap-1 text-[10px] text-[#0066C0] font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
          Amazon Reselling Verified
        </p>
        {/* Open Box Delivery badge */}
        <p className="mt-1 flex items-center gap-1 text-[10px] text-[#067D62] font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2L3 7v6a7 7 0 0014 0V7l-7-5zm0 2.236L5 7.764V13a5 5 0 0010 0V7.764L10 4.236zM8 10h4v2H8v-2z" clipRule="evenodd"/></svg>
          Open Box Delivery
        </p>
      </div>
    </Link>
  )
}
