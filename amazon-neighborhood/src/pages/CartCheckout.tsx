import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Button } from '../components/ui/Button'

const ADDRESSES = [
  { id: '1', name: 'Demo User', line1: '42, Rajpur Road', line2: 'Near Metro Station', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '+91 98765 43210' },
  { id: '2', name: 'Demo User', line1: '15, MG Road', line2: 'Block B, Sector 5', city: 'Gurugram', state: 'Haryana', pincode: '122001', phone: '+91 98765 43210' },
]

export function CartCheckout() {
  const navigate = useNavigate()
  const { cart, cartCount, clearCart, addCredits, addOrder } = useAppContext()
  const [confirmed, setConfirmed] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0].id)
  const [selectedPayment, setSelectedPayment] = useState('card')
  const [isPrime] = useState(true)
  const [returnPackaging, setReturnPackaging] = useState(false)
  const [couponCode, setCouponCode] = useState('')

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
  const savings = Math.round(itemTotal * 0.05)
  const grandTotal = itemTotal + deliveryCharge - savings
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
    <main className="bg-[#EAEDED] min-h-screen pb-24 md:pb-6">
      <div className="max-w-screen-2xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

          {/* ── Left: Payment Method ── */}
          <div className="space-y-4">

            {/* Delivery Address */}
            <div className="bg-white rounded p-5">
              <h2 className="text-base font-bold text-[#0F1111] mb-3 pb-2 border-b border-gray-200">Delivery address</h2>
              <div className="space-y-2">
                {ADDRESSES.map(addr => (
                  <label key={addr.id} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-all ${selectedAddress === addr.id ? 'border-[#FF9900] bg-[#FFFBF0]' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-[#FF9900]" />
                    <div>
                      <p className="text-sm font-medium text-[#0F1111]">{addr.name} — {addr.line1}, {addr.line2}, {addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
              <Link to="/account/addresses" className="text-xs text-[#007185] hover:underline hover:text-[#CC0C39] mt-2 inline-block">
                + Add a new delivery address
              </Link>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded p-5">
              <h2 className="text-base font-bold text-[#0F1111] mb-3 pb-2 border-b border-gray-200">Payment method</h2>

              {/* Available balance */}
              <div className="bg-[#FAFAFA] border border-gray-200 rounded p-4 mb-4">
                <p className="text-sm font-bold text-[#0F1111] mb-2">Your available balance</p>
                <label className="flex items-center gap-2 text-sm text-gray-700 mb-2 cursor-pointer">
                  <input type="checkbox" className="accent-[#007185]" />
                  <span>₹11.25 <strong>Promotion applied</strong> <span className="text-gray-500">(unchecking box will disable promotions)</span></span>
                </label>
                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="radio" name="payment" checked={selectedPayment === 'balance'} onChange={() => setSelectedPayment('balance')} className="mt-1 accent-[#FF9900]" />
                  <div>
                    <span>Use your ₹778.06 Amazon Pay Balance</span>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-[#007185]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                      Insufficient balance. <span className="text-[#007185] hover:underline cursor-pointer">Add money & get rewarded</span>
                    </p>
                  </div>
                </label>

                {/* Coupon code */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                  <span className="text-gray-500 text-lg">+</span>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                    placeholder="Enter Code"
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
                  />
                  <button className="border border-gray-400 rounded px-4 py-1.5 text-sm text-[#0F1111] hover:bg-gray-100 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Another payment method */}
              <p className="text-sm font-bold text-[#0F1111] mb-3">Another payment method</p>

              {/* Credit/Debit Card */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="radio" name="payment" checked={selectedPayment === 'card'} onChange={() => setSelectedPayment('card')} className="mt-1 accent-[#FF9900]" />
                <div>
                  <p className="text-sm text-[#0F1111] font-medium">Credit or debit card</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] bg-[#1A1F71] text-white px-1.5 py-0.5 rounded font-bold">VISA</span>
                    <span className="text-[10px] bg-[#CC0000] text-white px-1.5 py-0.5 rounded font-bold">MC</span>
                    <span className="text-[10px] bg-[#006B8F] text-white px-1.5 py-0.5 rounded font-bold">AMEX</span>
                    <span className="text-[10px] bg-[#0066B2] text-white px-1.5 py-0.5 rounded font-bold">DC</span>
                    <span className="text-[10px] bg-[#5F259F] text-white px-1.5 py-0.5 rounded font-bold">RuPay</span>
                  </div>
                </div>
              </label>

              {/* Net Banking */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="radio" name="payment" checked={selectedPayment === 'netbanking'} onChange={() => setSelectedPayment('netbanking')} className="mt-1 accent-[#FF9900]" />
                <div>
                  <p className="text-sm text-[#0F1111] font-medium">Net Banking</p>
                  <select className="mt-1 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none">
                    <option>Choose an Option</option>
                    <option>SBI</option>
                    <option>HDFC</option>
                    <option>ICICI</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              </label>

              {/* UPI */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="radio" name="payment" checked={selectedPayment === 'upi'} onChange={() => setSelectedPayment('upi')} className="mt-1 accent-[#FF9900]" />
                <div>
                  <p className="text-sm text-[#0F1111] font-medium">Scan and Pay with <span className="font-bold">UPI</span></p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 text-[#007185]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                    You will need to Scan the QR code on the payment page to complete the payment.
                  </p>
                </div>
              </label>

              {/* EMI */}
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="radio" name="payment" checked={selectedPayment === 'emi'} onChange={() => setSelectedPayment('emi')} className="accent-[#FF9900]" />
                <p className="text-sm text-[#0F1111] font-medium">EMI</p>
              </label>

              {/* COD */}
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="radio" name="payment" checked={selectedPayment === 'cod'} onChange={() => setSelectedPayment('cod')} className="mt-1 accent-[#FF9900]" />
                <div>
                  <p className="text-sm text-[#0F1111] font-medium">Cash on Delivery/Pay on Delivery</p>
                  <p className="text-xs text-gray-500">Cash, UPI and Cards accepted. <span className="text-[#007185] hover:underline cursor-pointer">Know more.</span></p>
                </div>
              </label>

              {/* Packaging Return */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <label className="flex items-start gap-3 cursor-pointer bg-gradient-to-r from-[#e8f5e9] to-[#f0f9f4] border-2 border-[#0a6245] rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={returnPackaging}
                    onChange={e => setReturnPackaging(e.target.checked)}
                    className="mt-0.5 w-5 h-5 accent-[#0a6245]"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#0a6245]">
                      📦 Return packaging on delivery and earn <span className="text-base text-[#067D62]">+10 Green Credits</span>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">Help reduce waste — our delivery partner collects your boxes at delivery!</p>
                    {returnPackaging && (
                      <p className="text-xs text-[#0a6245] mt-1.5 font-semibold bg-white border border-[#c3e6cb] rounded px-2 py-1 inline-block">
                        ✅ You'll earn 10 bonus green credits on this order!
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Use this payment method button */}
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="mt-5 w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-medium py-2.5 rounded-lg text-sm border border-[#FCD200] transition-colors disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Use this payment method'}
              </button>
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="space-y-3">
            {/* Place order button */}
            <div className="bg-white rounded p-4">
              <button
                onClick={handleConfirm}
                disabled={processing}
                className="w-full bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] font-medium py-2 rounded-lg text-sm border border-[#FCD200] transition-colors disabled:opacity-50 mb-3"
              >
                {processing ? 'Processing...' : 'Use this payment method'}
              </button>

              {/* Order summary breakdown */}
              <div className="text-xs text-[#0F1111] space-y-1.5 border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span>₹{itemTotal.toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span>{isPrime ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#007185]">Marketplace Fee</span>
                  <span className="text-[#007185]">—</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span>₹{(itemTotal + deliveryCharge).toLocaleString('en-IN')}.00</span>
                </div>
                <div className="flex justify-between text-[#CC0C39] font-medium">
                  <span>Savings (2): ▲</span>
                  <span>-₹{savings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>FREE Delivery</span>
                  <span></span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Your Coupon Savings</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 mt-2">
                  <span>Order Total:</span>
                  <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Green Credits */}
            <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 text-xs text-[#0a6245] font-medium">
              🌱 Earn {totalCredits + (returnPackaging ? 10 : 0)} Green Credits on this order
              {returnPackaging && <span className="block mt-0.5">(+10 packaging bonus included)</span>}
            </div>

            {/* Delivery address summary */}
            <div className="bg-white rounded p-4 text-xs text-gray-700">
              <p className="font-bold text-[#0F1111] mb-1">Delivering to:</p>
              <p>{currentAddr?.name} — {currentAddr?.line1}, {currentAddr?.city} - {currentAddr?.pincode}</p>
              <p className="text-[#007600] font-medium mt-1">Estimated delivery: 2-3 business days</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
