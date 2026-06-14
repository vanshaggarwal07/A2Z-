import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ConditionBadge } from '../components/ui/Badge'

export function CartPage() {
  const { cart, removeFromCart, cartCount, addCredits } = useAppContext()
  const navigate = useNavigate()

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalCredits = cart.reduce((s, i) => s + 30 * i.quantity, 0) // rough estimate

  if (cart.length === 0) {
    return (
      <main className="max-w-screen-2xl mx-auto px-4 py-12 text-center">
        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add items from Neighbourhood to get started</p>
        <Link to="/neighborhood" className="bg-[#FF9900] text-black font-bold px-6 py-3 rounded text-sm hover:bg-[#e68900] transition-colors">
          Browse Neighbourhood
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="bg-white rounded border border-gray-200 p-4 flex gap-4">
              <Link to={`/neighborhood/listing/${item.id}`}>
                <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/neighborhood/listing/${item.id}`} className="font-semibold text-gray-900 text-sm hover:text-[#007185] line-clamp-2">
                  {item.title}
                </Link>
                <div className="mt-1"><ConditionBadge grade={item.condition_grade} /></div>
                <p className="text-xs text-gray-500 mt-0.5">Sold by {item.seller_name}</p>
                <p className="text-xs text-[#0a6245] mt-0.5 font-medium">In stock · Pickup at Amazon Locker</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-bold text-[#0F1111]">₹{item.price.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="flex items-center gap-1 text-xs text-[#CC0C39] hover:text-red-700 font-semibold border border-[#CC0C39] hover:border-red-700 px-2 py-1 rounded transition-colors"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded border border-gray-200 p-4 h-fit space-y-3">
          <div className="text-[#0a6245] bg-[#f0f9f4] rounded p-2 text-xs font-medium">
            Eligible for {totalCredits} Green Credits on purchase
          </div>

          <p className="text-sm text-gray-700">
            Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'}):
            <span className="font-bold text-gray-900 ml-1">₹{total.toLocaleString('en-IN')}</span>
          </p>

          <button
            onClick={() => navigate('/cart/checkout')}
            className="w-full bg-[#FF9900] hover:bg-[#e68900] text-black font-bold py-3 rounded text-sm transition-colors"
          >
            Proceed to Buy
          </button>
          <Link
            to="/neighborhood"
            className="block w-full text-center border border-gray-300 text-gray-700 hover:border-gray-400 font-semibold py-2.5 rounded text-sm transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  )
}
