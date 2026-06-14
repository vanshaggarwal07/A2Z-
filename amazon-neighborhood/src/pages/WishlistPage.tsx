import React from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ConditionBadge } from '../components/ui/Badge'

export function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useAppContext()

  if (wishlist.length === 0) {
    return (
      <main className="max-w-screen-2xl mx-auto px-4 py-12 text-center">
        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Save items you love from Neighbourhood</p>
        <Link to="/neighborhood" className="bg-[#FF9900] text-black font-bold px-6 py-3 rounded text-sm hover:bg-[#e68900] transition-colors">
          Browse Neighbourhood
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Your Wishlist <span className="text-gray-400 font-normal text-lg">({wishlist.length})</span>
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlist.map(item => {
          const discount = Math.round((1 - item.asking_price / item.original_price) * 100)
          return (
            <div key={item.id} className="bg-white rounded border border-gray-200 overflow-hidden group">
              <Link to={`/neighborhood/listing/${item.id}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-2 left-2">
                    <ConditionBadge grade={item.condition_grade} />
                  </div>
                </div>
              </Link>
              <div className="p-3 space-y-2">
                <Link to={`/neighborhood/listing/${item.id}`} className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-[#007185] transition-colors block">
                  {item.title}
                </Link>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-[#0F1111]">₹{item.asking_price.toLocaleString('en-IN')}</span>
                  {discount > 0 && <span className="text-xs text-[#CC0C39] font-semibold">-{discount}%</span>}
                </div>
                <p className="text-xs text-gray-500">{item.distance_km.toFixed(1)} km away</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart({
                      id: item.id,
                      title: item.title,
                      price: item.asking_price,
                      image: item.image,
                      condition_grade: item.condition_grade,
                      seller_name: 'Seller',
                      quantity: 1,
                    })}
                    className="flex-1 bg-[#FF9900] hover:bg-[#e68900] text-black font-semibold text-xs py-2 rounded transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => toggleWishlist(item)}
                    className="flex items-center gap-1 px-2 py-2 rounded border border-[#CC0C39] text-[#CC0C39] hover:bg-red-50 transition-colors text-xs font-semibold"
                    aria-label="Remove from wishlist"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
