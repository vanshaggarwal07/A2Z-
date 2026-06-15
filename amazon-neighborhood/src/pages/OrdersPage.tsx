import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

export function OrdersPage() {
  const { orders } = useAppContext()
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status.toLowerCase() === filter)

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-[#0F1111] mb-1">Your Orders</h1>
      <p className="text-sm text-gray-500 mb-4">{orders.length} {orders.length === 1 ? 'order' : 'orders'} placed</p>

      <div className="flex gap-2 mb-4">
        {['all', 'processing', 'delivered', 'returned'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
              filter === f
                ? 'bg-[#131921] text-white border-[#131921]'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }`}
          >
            {f === 'all' ? 'All Orders' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-500 text-sm mb-6">Items you order will appear here</p>
          <Link to="/" className="bg-[#FF9900] text-black font-bold px-6 py-3 rounded text-sm hover:bg-[#e68900] transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const statusColor = order.status === 'Delivered' ? 'text-[#067D62]'
              : order.status === 'Returned' ? 'text-[#CC0C39]'
              : order.status === 'Shipped' ? 'text-[#0066C0]'
              : 'text-[#FF9900]'

            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded overflow-hidden">
                {/* Header */}
                <div className="bg-[#f0f2f2] px-4 py-2 flex items-center justify-between text-xs text-gray-600 border-b border-gray-200">
                  <div className="flex gap-6">
                    <div>
                      <p className="uppercase text-[10px] text-gray-500">Order placed</p>
                      <p>{order.date}</p>
                    </div>
                    <div>
                      <p className="uppercase text-[10px] text-gray-500">Total</p>
                      <p className="font-medium">₹{order.total.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="uppercase text-[10px] text-gray-500">Ship to</p>
                      <p>Demo User</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="uppercase text-[10px] text-gray-500">Order #{order.id}</p>
                    <button className="text-[#007185] hover:underline">View order details</button>
                  </div>
                </div>

                {/* Items */}
                {order.items.map(item => (
                  <div key={item.id} className="px-4 py-3 flex gap-4 border-b border-gray-100 last:border-0">
                    <img src={item.image} alt="" className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${statusColor}`}>
                        {order.status}
                        {order.status === 'Delivered' && order.deliveredDate ? ` on ${order.deliveredDate}` : ''}
                        {order.status === 'Processing' ? ' — arriving in 2-3 days' : ''}
                      </p>
                      <p className="text-sm text-[#0F1111] font-medium mt-0.5">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} · ₹{item.price.toLocaleString('en-IN')}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="text-xs bg-[#FFD814] hover:bg-[#f7ca00] border border-[#FCD200] text-[#0F1111] font-medium px-3 py-1.5 rounded">
                          Buy it again
                        </button>
                        <button className="text-xs border border-gray-300 text-[#0F1111] font-medium px-3 py-1.5 rounded hover:bg-gray-50">
                          View your item
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Open Box Delivery section */}
                <div className="px-4 py-3 bg-[#f0f9f4] border-t border-[#c3e6cb] flex items-start gap-3">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <img src="/boxxxx.png" alt="Open Box" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#067D62]">Open Box Delivery</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      You can inspect your product before accepting delivery. If unsatisfied, raise a return instantly.
                    </p>
                  </div>
                  <span className="text-gray-400 cursor-help relative group/tip flex-shrink-0 mt-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="absolute bottom-full right-0 mb-2 w-52 bg-[#131921] text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                      All Neighborhood orders include Open Box Delivery. Inspect items at your doorstep before accepting — return instantly if not as described.
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
