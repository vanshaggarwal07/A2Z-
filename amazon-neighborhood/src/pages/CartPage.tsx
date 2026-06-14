import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ConditionBadge } from '../components/ui/Badge'

interface SavedItem {
  id: string
  title: string
  price: number
  image: string
  condition_grade: string
  seller_name: string
  quantity: number
}

export function CartPage() {
  const { cart, removeFromCart, addToCart, cartCount } = useAppContext()
  const navigate = useNavigate()
  const [savedForLater, setSavedForLater] = useState<SavedItem[]>([])

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalCredits = cart.reduce((s, i) => s + 30 * i.quantity, 0)

  const handleSaveForLater = (item: SavedItem) => {
    setSavedForLater(prev => [...prev, item])
    removeFromCart(item.id)
  }

  const handleMoveToCart = (item: SavedItem) => {
    addToCart({ ...item, quantity: 1 })
    setSavedForLater(prev => prev.filter(s => s.id !== item.id))
  }

  const handleRemoveSaved = (id: string) => {
    setSavedForLater(prev => prev.filter(s => s.id !== id))
  }

  if (cart.length === 0) {
    return (
      <main className="max-w-screen-2xl mx-auto px-4 py-12 text-center">
        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Amazon Cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add items from Neighborhood to get started</p>
        <Link to="/neighborhood" className="bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-bold px-6 py-3 rounded text-sm border border-[#FCD200] transition-colors">
          Browse Neighborhood
        </Link>
      </main>
    )
  }

  return (
    <main className="bg-[#EAEDED] min-h-screen pb-24 md:pb-6">
      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* ── Left: Cart Items ── */}
          <div className="bg-white rounded p-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div>
                <h1 className="text-2xl font-normal text-[#0F1111]">Shopping Cart</h1>
                <Link to="/account/wishlist" className="text-sm text-[#007185] hover:text-[#CC0C39] hover:underline">
                  Wishlist
                </Link>
              </div>
              <span className="text-sm text-gray-500">Price</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-200">
              {cart.map(item => (
                <div key={item.id} className="py-4 flex gap-4">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <input type="checkbox" checked readOnly className="w-4 h-4 accent-[#007185] rounded" />
                  </div>

                  {/* Image */}
                  <Link to={`/neighborhood/listing/${item.id}`} className="flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-[140px] h-[140px] object-contain" />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/neighborhood/listing/${item.id}`} className="text-[15px] text-[#0F1111] hover:text-[#CC0C39] leading-snug line-clamp-2">
                      {item.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">by {item.seller_name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <ConditionBadge grade={item.condition_grade} />
                    </div>
                    <p className="text-xs text-[#007600] font-semibold mt-1">In stock</p>
                    <p className="text-xs text-gray-700 mt-0.5">
                      FREE delivery <strong>Thu, 18 Jun</strong>
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] bg-[#232F3E] text-white px-1.5 py-0.5 rounded font-medium">🔒 Fulfilled</span>
                    </div>

                    {/* Quantity & Actions row */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {/* Quantity control */}
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button className="px-2 py-1 hover:bg-gray-100 text-gray-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-300 bg-white min-w-[32px] text-center">{item.quantity}</span>
                        <button className="px-2 py-1 hover:bg-gray-100 text-gray-600 text-lg leading-none">+</button>
                      </div>

                      <span className="text-gray-300">|</span>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline"
                      >
                        Delete
                      </button>

                      <span className="text-gray-300">|</span>

                      {/* Save for later */}
                      <button onClick={() => handleSaveForLater(item)} className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline">
                        Save for later
                      </button>

                      <span className="text-gray-300">|</span>

                      {/* See more like this */}
                      <Link to="/neighborhood" className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline">
                        See more like this
                      </Link>
                    </div>
                  </div>

                  {/* Price column */}
                  <div className="text-right flex-shrink-0 min-w-[100px]">
                    <span className="text-lg font-bold text-[#0F1111]">₹{item.price.toLocaleString('en-IN')}</span>
                    <sup className="text-xs align-top">00</sup>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal at bottom of items */}
            <div className="border-t border-gray-200 pt-3 mt-2 text-right">
              <span className="text-sm text-[#0F1111]">
                Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'}):
                <span className="font-bold text-lg ml-1">₹{total.toLocaleString('en-IN')}.00</span>
              </span>
            </div>
          </div>

          {/* ── Right: Summary Sidebar ── */}
          <div className="space-y-3">
            {/* Free delivery banner */}
            <div className="bg-white rounded p-4 border-l-4 border-[#067D62]">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#067D62] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-sm text-[#0F1111]">
                    <strong>Your order is eligible for FREE Delivery.</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Choose <span className="text-[#007185] hover:underline cursor-pointer">FREE Delivery</span> option at checkout.
                  </p>
                </div>
                <span className="text-sm text-gray-500 ml-auto flex-shrink-0">₹499</span>
              </div>
            </div>

            {/* Subtotal + Proceed */}
            <div className="bg-white rounded p-4">
              <p className="text-base text-[#0F1111] mb-3">
                Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'}):
                <span className="font-bold ml-1">₹{total.toLocaleString('en-IN')}.00</span>
              </p>

              <label className="flex items-center gap-2 text-xs text-gray-700 mb-3 cursor-pointer">
                <input type="checkbox" className="accent-[#007185]" />
                This order contains a gift
              </label>

              <button
                onClick={() => navigate('/cart/checkout')}
                className="w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-medium py-2 rounded-lg text-sm border border-[#FCD200] transition-colors"
              >
                Proceed to Buy
              </button>
            </div>

            {/* EMI Available */}
            <div className="bg-white rounded p-4">
              <div className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-[#0F1111] font-medium">EMI Available</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Green Credits */}
            <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 text-xs text-[#0a6245] font-medium">
              🌱 Eligible for {totalCredits} Green Credits on this purchase
            </div>

            {/* Prime banner */}
            <div className="bg-white rounded p-4 border border-gray-200">
              <p className="text-xs text-gray-700 mb-2">Enjoy faster deliveries, offers and more!</p>
              <button className="w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-medium py-2 rounded-full text-xs border border-[#FCD200] transition-colors">
                Join Prime Shopping Edition at ₹399/year
              </button>
              <p className="text-[10px] text-gray-500 mt-1 text-center">deliveries, cancel anytime!</p>
            </div>
          </div>
        </div>

        {/* ── Saved for Later Section ── */}
        {savedForLater.length > 0 && (
          <div className="bg-white rounded p-5 mt-4">
            <div className="border-b border-gray-200 pb-3 mb-4">
              <h2 className="text-xl font-bold text-[#0F1111]">Your Items</h2>
              <div className="flex gap-4 mt-2">
                <span className="text-sm font-medium text-[#007185] border-b-2 border-[#007185] pb-1">Saved for later ({savedForLater.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedForLater.map(item => (
                <div key={item.id} className="border border-gray-200 rounded p-3">
                  <Link to={`/neighborhood/listing/${item.id}`}>
                    <img src={item.image} alt={item.title} className="w-full h-32 object-contain mb-2" />
                  </Link>
                  <Link to={`/neighborhood/listing/${item.id}`} className="text-sm text-[#0F1111] hover:text-[#CC0C39] line-clamp-2 leading-snug">
                    {item.title}
                  </Link>
                  <p className="text-base font-bold text-[#0F1111] mt-1">₹{item.price.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[#007600] mt-0.5">In stock</p>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] text-xs font-medium py-1.5 rounded border border-[#FCD200] transition-colors"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveSaved(item.id)}
                      className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
