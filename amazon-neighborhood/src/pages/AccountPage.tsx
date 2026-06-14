import React from 'react'
import { Link } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/orders',
    label: 'Your Orders',
    desc: 'Track, return, or buy again',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    highlight: false,
  },
  {
    to: '/account/profile',
    label: 'Your Profile',
    desc: 'Edit name, email, phone, gender',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    highlight: false,
  },
  {
    to: '/account/addresses',
    label: 'Manage Addresses',
    desc: 'Add or edit delivery addresses',
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
    highlight: false,
  },
  {
    to: '/account/payments',
    label: 'Payment Options',
    desc: 'Manage saved cards and UPI',
    iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    highlight: false,
  },
  {
    to: '/account/green-credits',
    label: 'Green Credits Wallet',
    desc: '55 credits available',
    iconPath: 'M17 8C8 10 5.9 16.17 3.82 19.54c-.23.39-.1.87.27 1.1.37.22.84.09 1.06-.29C7 17 9 13 17 11v3l4-4-4-4v2z',
    highlight: true,
    filled: true,
  },
  {
    to: '/seller/returns',
    label: 'Seller Hub',
    desc: 'AI insights, return clusters, quality scores',
    iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    highlight: true,
  },
  {
    to: '/account/wishlist',
    label: 'Wishlist',
    desc: 'Saved items',
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    highlight: false,
  },
  {
    to: '/neighborhood',
    label: 'My Listings',
    desc: 'Manage your active listings',
    iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    highlight: false,
  },
]

export function AccountPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Profile header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#131921] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
          DU
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">Demo User</p>
          <p className="text-sm text-gray-500">demo@amazon-Neighborhood.in</p>
          <p className="text-xs text-[#007185]">Amazon verified customer since 2020</p>
        </div>
      </div>

      <div className="space-y-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 p-4 rounded border-2 transition-all hover:shadow-sm ${
              item.highlight
                ? 'border-[#0a6245] bg-[#f0f9f4]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              item.highlight ? 'bg-[#0a6245]' : 'bg-gray-100'
            }`}>
              <svg
                className={`w-5 h-5 ${item.highlight ? 'text-white' : 'text-gray-600'}`}
                fill={item.filled ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke={item.filled ? 'none' : 'currentColor'}
                strokeWidth={1.8}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
              </svg>
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${item.highlight ? 'text-[#0a6245]' : 'text-gray-900'}`}>
                {item.label}
              </p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </main>
  )
}
