import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Button } from '../components/ui/Button'

const ADDRESSES = [
  { id: '1', name: 'Demo User', line1: '42, Rajpur Road', line2: 'Near Metro Station', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '+91 98765 43210' },
  { id: '2', name: 'Demo User', line1: '15, MG Road', line2: 'Block B, Sector 5', city: 'Gurugram', state: 'Haryana', pincode: '122001', phone: '+91 98765 43210' },
]

const PAYMENT_METHODS = [
  { id: 'card1', label: 'Visa ending in 4242', type: 'card' },
  { id: 'card2', label: 'Mastercard ending in 8888', type: 'card' },
  { id: 'upi1', label: 'UPI - demouser@upi', type: 'upi' },
  { id: 'cod', label: 'Cash on Delivery', type: 'cod' },
]

export function CartCheckout() {
  const navigate = useNavigate()
  const { cart, cartCount, clearCart, addCredits, addOrder } = useAppContext()
  const [confirmed, setConfirmed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<'review' | 'payment'>('review')
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0].id)
  const [selectedPayment, setSelectedPayment] = useState('card1')
  const [isPrime] = useState(true)
  const [returnPackaging, setReturnPackaging] = useState(false)

  if (cart.length === 0 && !confirmed) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link to="/" className="text-[#007185] hover:underline mt-2 inline-block">Back to Home</Link>
      </div>
    )
  }

  const itemTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryCharge = isPrime ? 0 : 49
  const tax = Math.round(itemTotal * 0.18)
  const discount = Math.round(itemTotal * 0.05)
  const grandTotal = itemTotal + deliveryCharge + tax - discount
  const totalCredits = cart.reduce((s, i) => s + 30 * i.quantity, 0)

  const handleConfirm = async () => {
    setProcessing(true)
    await new Promise(r => setTimeout(r, 1500))
    const bonusCredits = returnPackaging ? 10 : 0
    const earnedCredits = totalCredits + bonusCredits
    addCredits({
      action: `Bought ${cart.length} item(s) from cart`,
      credits: earnedCredits,
      co2_saved_kg: parseFloat((earnedCredits * 0.047).toFixed(2)),
      listing_title: cart.map(i => i.title).join(', ').slice(0, 60),
    })
    addOrder({
      status: 'Processing',
      items: cart.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        condition_grade: item.condition_grade,
        seller_name: item.seller_name,
      })),
      total: grandTotal,
    })
    clearCart()
    setConfirmed(true)
  }

  if (confirmed) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded border border-[#0a6245] p-6 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#0a6245] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed</h1>
          <p className="text-gray-600 mb-4">Your order has been placed successfully.</p>
          <div className="bg-[#EAF7EC] border border-[#0a6245] rounded p-4 mb-4 text-left">
            <p className="text-sm font-semibold text-[#0a6245] mb-1">Amazon Buyer Protection</p>
            <p className="text-xs text-gray-700">
              Payment of ₹{grandTotal.toLocaleString('en-IN')} is secured.
              You have <span className="font-semibold">48 hours</span> after delivery to raise a dispute.
            </p>
          </div>
          <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 mb-4 text-sm">
            <p className="text-[#0a6245] font-semibold">Earned {totalCredits + (returnPackaging ? 10 : 0)} Green Credits</p>
            {returnPackaging && (
              <p className="text-xs text-[#0a6245] mt-1">Includes +10 bonus credits for packaging return 📦</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-6">Estimated delivery: 2-3 business days</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/')} variant="primary" className="flex-1">Continue Shopping</Button>
            <Button onClick={() => navigate('/orders')} variant="secondary" className="flex-1">View Orders</Button>
          </div>
        </div>
      </main>
    )
  }

  const currentAddr = ADDRESSES.find(a => a.id === selectedAddress)

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => step === 'payment' ? setStep('review') : navigate(-1)} className="text-[#007185] hover:underline text-sm">Back</button>
        <h1 className="text-lg font-bold text-gray-900">Secure Checkout</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        <span className={`px-3 py-1 rounded-full font-medium ${step === 'review' ? 'bg-[#FF9900] text-black' : 'bg-gray-200 text-gray-600'}`}>1. Review</span>
        <div className="h-px flex-1 bg-gray-300" />
        <span className={`px-3 py-1 rounded-full font-medium ${step === 'payment' ? 'bg-[#FF9900] text-black' : 'bg-gray-200 text-gray-600'}`}>2. Payment</span>
      </div>

      {step === 'review' && (
        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Order Summary ({cartCount} {cartCount === 1 ? 'item' : 'items'})</h2>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3">
                  <img src={item.image} alt={item.title} className="w-16 h-16 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} · {item.condition_grade}</p>
                    <p className="text-base font-bold text-[#0F1111] mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Select Address */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Delivery Address</h2>
            <div className="space-y-2">
              {ADDRESSES.map(addr => (
                <label key={addr.id} className={`flex items-start gap-3 p-3 rounded border-2 cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-[#FF9900]" />
                  <div>
                    <p className="text-sm font-medium text-[#0F1111]">{addr.name}</p>
                    <p className="text-xs text-gray-600">{addr.line1}, {addr.line2}</p>
                    <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-xs text-gray-500">Phone: {addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>
            <Link to="/account/addresses" className="text-xs text-[#007185] hover:underline mt-2 inline-block font-medium">
              + Add a new address
            </Link>
          </div>

          {/* Select Payment */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Payment Method</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map(pm => (
                <label key={pm.id} className={`flex items-center gap-3 p-3 rounded border-2 cursor-pointer transition-all ${selectedPayment === pm.id ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200'}`}>
                  <input type="radio" name="payment" checked={selectedPayment === pm.id} onChange={() => setSelectedPayment(pm.id)} className="accent-[#FF9900]" />
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold ${pm.type === 'card' ? 'bg-[#131921]' : pm.type === 'upi' ? 'bg-[#4B0082]' : 'bg-green-700'}`}>
                      {pm.type === 'card' ? 'CARD' : pm.type === 'upi' ? 'UPI' : 'COD'}
                    </div>
                    <span className="text-sm text-[#0F1111]">{pm.label}</span>
                  </div>
                </label>
              ))}
            </div>
            <Link to="/account/payments" className="text-xs text-[#007185] hover:underline mt-2 inline-block font-medium">
              + Add new payment method
            </Link>
          </div>

          <Button onClick={() => setStep('payment')} size="lg" className="w-full">
            Continue to Payment
          </Button>
        </div>
      )}

      {step === 'payment' && (
        <div className="space-y-4">
          {/* Final Price Breakdown */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Price Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Item(s) total ({cartCount} items)</span><span>₹{itemTotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery charges</span>
                {isPrime ? (
                  <span className="text-[#0a6245] font-medium">FREE <span className="text-xs text-gray-400 line-through ml-1">₹49</span> <span className="text-[10px] bg-[#0066C0] text-white px-1 py-0.5 rounded ml-1">Prime</span></span>
                ) : (
                  <span>₹{deliveryCharge}</span>
                )}
              </div>
              <div className="flex justify-between"><span className="text-gray-600">GST (18%)</span><span>+₹{tax.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-[#0a6245]"><span>Discount (5%)</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Order Total</span>
                <span className="text-[#CC0C39]">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Delivering to</h2>
            <p className="text-sm text-[#0F1111]">{currentAddr?.name} - {currentAddr?.line1}, {currentAddr?.city} - {currentAddr?.pincode}</p>
            <p className="text-xs text-[#0a6245] font-medium mt-1">Estimated delivery: 2-3 business days</p>
          </div>

          {/* Packaging Return Option */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={returnPackaging}
                onChange={e => setReturnPackaging(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0a6245] rounded"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Return packaging on delivery and earn +10 green credits</p>
                {returnPackaging && (
                  <div className="mt-2 bg-[#f0f9f4] border border-[#c3e6cb] rounded-lg px-3 py-2">
                    <p className="text-xs text-[#0a6245] font-medium">
                      📦 Our delivery partner will collect your boxes/packaging at delivery. You'll earn 10 bonus green credits!
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Payment info */}
          <div className="bg-white rounded border border-gray-200 p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 text-sm mb-2">Paying with</h2>
            <p className="text-sm text-[#0F1111]">{PAYMENT_METHODS.find(p => p.id === selectedPayment)?.label}</p>
          </div>

          {/* Green Credits */}
          <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.54c-.23.39-.1.87.27 1.1.37.22.84.09 1.06-.29C7 17 9 13 17 11v3l4-4-4-4v2z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0a6245]">Earn {totalCredits + (returnPackaging ? 10 : 0)} Green Credits</p>
              <p className="text-xs text-gray-500">
                Worth ₹{Math.round((totalCredits + (returnPackaging ? 10 : 0)) * 0.1)} off your next order
                {returnPackaging && <span className="text-[#0a6245] font-medium"> (includes +10 packaging bonus)</span>}
              </p>
            </div>
          </div>

          <Button onClick={handleConfirm} loading={processing} size="lg" className="w-full">
            Place Order - ₹{grandTotal.toLocaleString('en-IN')}
          </Button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Secured by Amazon Pay | Buyer Protection applies
          </p>
        </div>
      )}
    </main>
  )
}
