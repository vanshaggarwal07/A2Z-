import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

/* ── Must stay in sync with Home.tsx ALL_PRODUCTS ── */
const ALL_PRODUCTS = [
  { id: 'p-001', title: 'boAt Rockerz 255 Bluetooth Earphones', price: 899, mrp: 2490, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', category: 'Electronics', prime: true, rating: 4.2, reviews: 45230, resaleValue: 320, brand: 'boAt', description: 'boAt Rockerz 255 is an in-ear sports Bluetooth earphone with magnetic buds, water and sweat resistance (IPX5), and up to 8 hours of playback. Features 10mm dynamic drivers for powerful bass and a built-in mic for hands-free calling.' },
  { id: 'p-002', title: 'Samsung Galaxy Tab A7 Lite (32GB, WiFi)', price: 14999, mrp: 17999, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', category: 'Electronics', prime: true, rating: 4.4, reviews: 12800, resaleValue: 6450, brand: 'Samsung', description: 'Compact 8.7" display with a metal body, Mediatek Helio P22T processor, 3GB RAM and 32GB storage (expandable). Ideal for entertainment, light productivity and kids\' learning.' },
  { id: 'p-003', title: 'TP-Link N300 WiFi Router', price: 1899, mrp: 2999, image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800&q=80', category: 'Electronics', prime: true, rating: 4.0, reviews: 8900, resaleValue: 722, brand: 'TP-Link', description: 'Reliable 300Mbps wireless router with 2 fixed external antennas for extended coverage. Supports multiple operation modes and easy setup via the TP-Link Tether app.' },
  { id: 'p-004', title: 'Logitech M185 Wireless Mouse', price: 595, mrp: 999, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80', category: 'Electronics', prime: true, rating: 4.3, reviews: 67000, resaleValue: 200, brand: 'Logitech', description: 'Plug-and-play wireless mouse with a 2.4 GHz nano-receiver. Up to 12 months battery life, 3-button setup, and works on most surfaces.' },
  { id: 'p-005', title: 'Nike Air Max Running Shoes - Size 42', price: 3499, mrp: 5999, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', category: 'Fashion', prime: true, rating: 4.1, reviews: 3200, resaleValue: 1330, brand: 'Nike', description: 'Nike Air Max running shoes with Air cushioning for lightweight, responsive comfort. Mesh upper for breathability and rubber outsole for durable traction.' },
  { id: 'p-006', title: 'Woodland Waterproof Winter Jacket (L)', price: 2899, mrp: 4999, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80', category: 'Fashion', prime: false, rating: 4.3, reviews: 1500, resaleValue: 1100, brand: 'Woodland', description: 'Water-resistant winter jacket with a warm inner lining and windproof shell. Multiple pockets and adjustable hood for outdoor protection.' },
  { id: 'p-007', title: 'Lavie Structured Handbag - Navy Blue', price: 1299, mrp: 2499, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80', category: 'Fashion', prime: true, rating: 4.5, reviews: 890, resaleValue: 500, brand: 'Lavie', description: 'Structured PU leather handbag with a spacious main compartment, inner zip pocket and card slots. Detachable shoulder strap for versatile carry.' },
  { id: 'p-008', title: 'Kanjivaram Silk Saree - Maroon Gold', price: 4599, mrp: 7999, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80', category: 'Fashion', prime: false, rating: 4.7, reviews: 340, resaleValue: 2800, brand: 'Pothys', description: 'Authentic Kanjivaram silk saree with zari border, rich pallu and 6.3 metre length. Comes with unstitched blouse piece.' },
  { id: 'p-009', title: 'Bajaj Mixer Grinder 750W (3 Jars)', price: 2199, mrp: 3499, image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80', category: 'Home & Kitchen', prime: true, rating: 4.2, reviews: 22000, resaleValue: 836, brand: 'Bajaj', description: '750W motor with 3 multi-functional jars (1.5L liquidising, 1L wet grinding, 0.4L chutney). 3 speed settings + pulse for versatile cooking.' },
  { id: 'p-010', title: 'Philips HD9252 Air Fryer 4.1L', price: 7999, mrp: 12995, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80', category: 'Home & Kitchen', prime: true, rating: 4.4, reviews: 15600, resaleValue: 4200, brand: 'Philips', description: 'Rapid Air Technology fries with up to 90% less fat. 4.1L capacity, digital touch screen, 13 preset programs and dishwasher-safe parts.' },
  { id: 'p-011', title: 'Prestige Electric Kettle 1.5L', price: 749, mrp: 1295, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80', category: 'Home & Kitchen', prime: true, rating: 4.1, reviews: 9800, resaleValue: 280, brand: 'Prestige', description: '1500W concealed heating element kettle with auto shut-off and boil-dry protection. 1.5L capacity with 360° swivel base.' },
  { id: 'p-012', title: 'Hawkins Contura Pressure Cooker 5L', price: 2350, mrp: 3200, image: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800&q=80', category: 'Home & Kitchen', prime: true, rating: 4.5, reviews: 31000, resaleValue: 900, brand: 'Hawkins', description: 'Hard anodised pressure cooker with ergonomic handles and a curved body for even heat distribution. Works on gas, electric and halogen cooktops.' },
  { id: 'p-013', title: 'Philips Avent Baby Monitor with Camera', price: 3200, mrp: 5499, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80', category: 'Baby & Kids', prime: true, rating: 4.3, reviews: 2100, resaleValue: 1400, brand: 'Philips Avent', description: 'Digital video baby monitor with 2.7" colour display, night vision, two-way talk and temperature sensor. 300m range and 10-hour battery.' },
  { id: 'p-014', title: 'LuvLap Foldable Baby Stroller', price: 5999, mrp: 8999, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80', category: 'Baby & Kids', prime: true, rating: 4.2, reviews: 4500, resaleValue: 3200, brand: 'LuvLap', description: 'Compact fold stroller with reclining seat, adjustable canopy, removable bumper bar and shopping basket. Suitable from 6 months to 3 years, up to 15kg.' },
  { id: 'p-015', title: 'PowerMax TDM-98 Foldable Treadmill', price: 18999, mrp: 29999, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', category: 'Sports & Fitness', prime: false, rating: 4.0, reviews: 1200, resaleValue: 8500, brand: 'PowerMax', description: '2.0 HP motor treadmill with 12 preset programs, 3 manual incline levels, LED display and tablet holder. Folds flat for easy storage.' },
  { id: 'p-016', title: 'Hero Sprint 26" Gear Cycle (21 Speed)', price: 8499, mrp: 12999, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80', category: 'Sports & Fitness', prime: false, rating: 4.1, reviews: 780, resaleValue: 4000, brand: 'Hero', description: '21-speed mountain cycle with alloy frame, Shimano derailleur and disc brakes. Anti-skid tires and adjustable saddle for comfortable off-road riding.' },
  { id: 'p-017', title: 'Canon EOS 1500D DSLR Camera (18-55mm)', price: 29999, mrp: 39995, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', category: 'Electronics', prime: true, rating: 4.5, reviews: 6700, resaleValue: 15000, brand: 'Canon', description: '24.1MP APS-C DSLR with DIGIC 4+ processor, 9-point AF, built-in Wi-Fi and NFC. Kit lens EF-S 18-55mm IS II included. Perfect for beginners.' },
  { id: 'p-018', title: 'Sony PlayStation 4 Slim 1TB', price: 27999, mrp: 34990, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80', category: 'Electronics', prime: true, rating: 4.6, reviews: 19000, resaleValue: 14000, brand: 'Sony', description: 'PS4 Slim 1TB console with DualShock 4 wireless controller. 4K streaming, HDR support and access to PlayStation Network\'s extensive game library.' },
  { id: 'p-019', title: 'Amazon Echo Dot (4th Gen)', price: 3499, mrp: 4999, image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80', category: 'Electronics', prime: true, rating: 4.4, reviews: 42000, resaleValue: 1500, brand: 'Amazon', description: 'Compact smart speaker with Alexa. Ask questions, play music, control smart home devices, set reminders and more with just your voice.' },
  { id: 'p-020', title: 'Dell Inspiron 15 Laptop (i5, 8GB, 512GB)', price: 49990, mrp: 62990, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80', category: 'Electronics', prime: true, rating: 4.3, reviews: 5400, resaleValue: 25000, brand: 'Dell', description: '15.6" FHD display, Intel Core i5-1135G7, 8GB DDR4 RAM, 512GB SSD, Intel Iris Xe graphics and Windows 11 Home. Thin & light design with backlit keyboard.' },
]

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-4 h-4 ${i <= Math.round(rating) ? 'text-[#FF9900]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span className="text-[#007185] text-sm">{rating}</span>
      <span className="text-[#007185] text-sm">({count.toLocaleString('en-IN')} ratings)</span>
    </span>
  )
}

export function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useAppContext()
  const { user } = useAuth()

  const [qty, setQty] = useState(1)
  const [cartAdded, setCartAdded] = useState(false)
  const [pincode, setPincode] = useState('110001')

  const product = ALL_PRODUCTS.find(p => p.id === id)

  if (!product) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg mb-4">Product not found.</p>
        <Link to="/" className="text-[#007185] hover:underline">← Back to Home</Link>
      </div>
    )
  }

  const discount = Math.round((1 - product.price / product.mrp) * 100)

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return }
    addToCart({ id: product.id, title: product.title, price: product.price, image: product.image, condition_grade: 'New', seller_name: 'Amazon.in', quantity: qty })
    setCartAdded(true)
    setTimeout(() => setCartAdded(false), 2500)
  }

  const handleBuyNow = () => {
    if (!user) { navigate('/login'); return }
    addToCart({ id: product.id, title: product.title, price: product.price, image: product.image, condition_grade: 'New', seller_name: 'Amazon.in', quantity: qty })
    navigate('/cart')
  }

  const SPECS: Record<string, string> = {
    'Brand': product.brand,
    'Category': product.category,
    'Condition': 'New',
    'Sold by': 'Amazon Seller Services Pvt. Ltd.',
    'Fulfilled by': 'Amazon',
    'Country of Origin': 'India',
  }

  const REVIEWS = [
    { name: 'Rahul S.', rating: 5, text: 'Excellent product! Works exactly as described. Highly recommend to everyone.' },
    { name: 'Priya M.', rating: 4, text: 'Good value for money. Build quality is solid. Delivery was prompt.' },
    { name: 'Amit K.', rating: 4, text: 'Really satisfied with this purchase. Performance is great for the price.' },
  ]

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-2 pb-24 md:pb-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#007185] mb-3 flex items-center gap-1 flex-wrap">
        <Link to="/" className="hover:underline">Home</Link>
        <span>›</span>
        <span className="hover:underline cursor-pointer">{product.category}</span>
        <span>›</span>
        <span className="text-gray-500 truncate max-w-[260px]">{product.title}</span>
      </nav>

      {/* ── Main 3-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[38%_1fr_220px] xl:grid-cols-[35%_1fr_250px] gap-4 mb-8">

        {/* Col 1: Image */}
        <div className="sticky top-24 self-start">
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
            <img src={product.image} alt={product.title} className="w-full h-full object-contain p-6" />
          </div>
          <p className="text-center text-xs text-[#007185] mt-2 cursor-pointer hover:underline">Click to see full view</p>
        </div>

        {/* Col 2: Info */}
        <div className="space-y-4">
          {/* Brand link */}
          <p className="text-sm text-[#007185] hover:underline cursor-pointer font-medium">
            Visit the {product.brand} Store
          </p>

          {/* Title */}
          <h1 className="text-xl font-medium text-gray-900 leading-snug">{product.title}</h1>

          {/* Rating */}
          <StarRating rating={product.rating} count={product.reviews} />

          <div className="border-b border-gray-200" />

          {/* Limited time deal badge */}
          <div>
            <span className="inline-block bg-[#CC0C39] text-white text-xs font-bold px-2 py-0.5 rounded mb-2">Limited time deal</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-red-600 font-semibold text-sm">-{discount}%</span>
              <span className="text-3xl font-medium text-gray-900">
                <sup className="text-base">₹</sup>{product.price.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              M.R.P.: <span className="line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
            {product.prime && (
              <p className="text-sm text-[#007185] mt-1">
                FREE delivery with <strong>Prime</strong>
              </p>
            )}
          </div>

          {/* EMI */}
          <p className="text-sm text-gray-700">
            EMI starts at ₹{Math.round(product.price / 12).toLocaleString('en-IN')}/month.{' '}
            <span className="text-[#007185] hover:underline cursor-pointer">No Cost EMI available ▾</span>
          </p>

          {/* Offers */}
          <div className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#007185]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              Offers
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { title: 'Cashback', desc: `Upto ₹${Math.round(product.price * 0.03).toLocaleString('en-IN')} cashback as Amazon Pay Balance…`, cta: '1 offer ›' },
                { title: 'No Cost EMI', desc: `Upto ₹${Math.round(product.price * 0.05).toLocaleString('en-IN')} EMI interest savings on select cards…`, cta: '2 offers ›' },
                { title: 'Bank Offers', desc: 'Upto 10% off on HDFC/ICICI/SBI credit cards…', cta: '5 offers ›' },
              ].map(offer => (
                <div key={offer.title} className="flex-shrink-0 border border-gray-200 rounded p-2.5 text-xs w-44">
                  <p className="font-semibold text-gray-800">{offer.title}</p>
                  <p className="text-gray-600 mt-0.5 leading-relaxed">{offer.desc}</p>
                  <p className="text-[#007185] mt-1 font-medium">{offer.cta}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-bold text-gray-900 mb-2">About this item</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
          </div>

          {/* Resale value */}
          <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded-xl px-4 py-3 text-sm text-[#0a6245]">
            <span className="font-semibold">Est. resale value via Neighbourhood in 1 year:</span>{' '}
            <span className="font-bold text-base">₹{product.resaleValue.toLocaleString('en-IN')}</span>
            <p className="text-xs text-[#0a6245]/70 mt-0.5">Buy smart — track and resell later on Amazon Neighbourhood.</p>
          </div>

          {/* Specs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-bold text-gray-900 mb-3">Product Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {Object.entries(SPECS).map(([key, val], i) => (
                <div key={key} className={`flex py-2.5 ${i % 2 === 0 ? 'bg-[#f8f8f8]' : 'bg-white'} px-3`}>
                  <span className="text-sm text-gray-600 w-36 flex-shrink-0 font-medium">{key}</span>
                  <span className="text-sm text-gray-900">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="flex items-center gap-6 mb-5 pb-5 border-b border-gray-100">
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900">{product.rating}</p>
                <StarRating rating={product.rating} count={0} />
                <p className="text-xs text-gray-500 mt-1">out of 5</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(star => {
                  const pct = star === 5 ? 62 : star === 4 ? 22 : star === 3 ? 10 : star === 2 ? 4 : 2
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="text-[#007185] w-8 text-right">{star} star</span>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF9900] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[#007185] w-6">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="space-y-5">
              {REVIEWS.map((r, i) => (
                <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-[#131921] flex items-center justify-center text-xs font-bold text-white">{r.name[0]}</div>
                    <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                  </div>
                  <StarRating rating={r.rating} count={0} />
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.text}</p>
                  <p className="text-xs text-gray-400 mt-1">Verified Purchase</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 3: Buy box */}
        <div>
          <div className="border border-gray-200 rounded-lg p-4 sticky top-24 space-y-2">
            {/* Price */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-medium">
                  <sup className="text-base">₹</sup>{product.price.toLocaleString('en-IN')}
                  <sup className="text-sm align-super">00</sup>
                </span>
              </div>
              {product.prime && (
                <p className="text-sm text-[#007185] mt-1 font-medium">
                  FREE delivery <strong>Tuesday, 16 June</strong>
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#0a6245]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                Deliver to New Delhi 110001
              </p>
            </div>

            {/* Pincode check */}
            <div className="flex gap-2 items-center">
              <input
                type="text" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6}
                placeholder="Enter pincode"
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
              />
              <button className="text-sm text-[#007185] hover:underline font-medium">Check</button>
            </div>

            <p className="text-[#0a6245] font-semibold text-base">In stock</p>

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Quantity:</label>
              <select value={qty} onChange={e => setQty(Number(e.target.value))} className="border border-gray-300 rounded px-2 py-1 text-sm bg-[#f0f2f2]">
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* CTAs */}
            <button
              onClick={handleAddToCart}
              className={`w-full font-bold py-2.5 rounded-full text-sm transition-all ${cartAdded ? 'bg-[#0a6245] text-white' : 'bg-[#FFD814] hover:bg-[#f7ca00] text-[#0F1111] border border-[#FCD200]'}`}
            >
              {cartAdded ? '✓ Added to cart' : 'Add to cart'}
            </button>
            <button
              onClick={handleBuyNow}
              className="w-full bg-[#FFA41C] hover:bg-[#fa8900] text-[#0F1111] font-bold py-2.5 rounded-full text-sm border border-[#FF8F00] transition-colors"
            >
              Buy Now
            </button>

            {/* Meta */}
            <div className="text-xs text-gray-600 space-y-1 border-t pt-3 mt-1">
              <div className="flex gap-2"><span className="w-20 text-gray-500">Ships from</span><span className="font-medium">Amazon.in</span></div>
              <div className="flex gap-2"><span className="w-20 text-gray-500">Sold by</span><span className="text-[#007185] font-medium">Amazon Seller Services</span></div>
              <div className="flex gap-2"><span className="w-20 text-gray-500">Payment</span><span className="font-medium">Secure transaction</span></div>
            </div>

            {/* Resell nudge */}
            <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded-lg p-3 text-xs text-[#0a6245] mt-1">
              <p className="font-semibold mb-0.5">📦 Resell later on Neighbourhood</p>
              <p>Est. value in 1 yr: <strong>₹{product.resaleValue.toLocaleString('en-IN')}</strong></p>
              <Link to="/neighborhood" className="text-[#007185] hover:underline font-medium mt-1 inline-block">Explore Neighbourhood →</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
