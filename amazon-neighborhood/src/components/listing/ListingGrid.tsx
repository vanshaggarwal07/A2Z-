import React from 'react'
import { ListingCard } from './ListingCard'
import type { Listing } from '../../hooks/useListings'

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
  emptyMessage?: string
}

export function ListingGrid({ listings, loading = false, emptyMessage }: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-gray-200">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white animate-pulse">
            <div className="bg-gray-200" style={{ aspectRatio: '4/3' }} />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-gray-500 text-sm font-medium">
          {emptyMessage || 'No listings found in this area.'}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Try increasing the radius or clearing filters.
        </p>
      </div>
    )
  }

  return (
    /* 1px gap between cards creates the thin divider line look from the screenshot */
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-gray-200">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
