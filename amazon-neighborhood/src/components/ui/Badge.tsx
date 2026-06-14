import React from 'react'

export function ConditionBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    'Like New': 'bg-[#067D62] text-white',
    Good:       'bg-[#0066C0] text-white',
    Fair:       'bg-[#B8860B] text-white',
    'For Parts':'bg-[#CC0C39] text-white',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${colors[grade] || 'bg-gray-500 text-white'}`}>
      {grade}
    </span>
  )
}

export function GreenCreditsBadge({ credits }: { credits: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-[#2D6A4F] text-white">
      +{credits} Credits
    </span>
  )
}

export function DistanceBadge({ distanceKm }: { distanceKm: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {distanceKm.toFixed(1)} km
    </span>
  )
}

export function NewBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-[#CC0C39] text-white tracking-wide">
      NEW
    </span>
  )
}

export function PassportBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-green-50 text-[#067D62] border border-[#067D62]">
      Passport verified
    </span>
  )
}

export function LocalMakerBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-semibold bg-orange-50 text-[#FF6200] border border-[#FF6200]">
      Local Maker
    </span>
  )
}

export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${className}`}>
      {children}
    </span>
  )
}
