import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

/* ─────────────────── Banner carousel ─────────────────── */
const BANNER_IMAGES = ['/A.png', '/B.png', '/C.png']

/* ─────────────────── Category tiles (Amazon style grid) ─────────────────── */
const CATEGORIES = [
  { label: 'Mobiles & Accessories', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80', to: '/neighborhood?cat=electronics' },
  { label: 'Fashion', image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=300&q=80', to: '/neighborhood?cat=fashion' },
  { label: 'Electronics', image: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=300&q=80', to: '/neighborhood?cat=electronics' },
  { label: 'Home & Kitchen', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&q=80', to: '/neighborhood?cat=appliances' },
  { label: 'Baby & Kids', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=80', to: '/neighborhood?cat=baby' },
  { label: 'Sports & Fitness', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&q=80', to: '/neighborhood?cat=sports' },
  { label: 'Books', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80', to: '/neighborhood?cat=books' },
  { label: 'Neighbourhood', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80', to: '/neighborhood' },
]

/* ─────────────────── Products ─────────────────── */
const ALL_PRODUCTS = [
  // Electronics
  { id: 'p-001', title: 'boAt Rockerz 255 Bluetooth Earphones', price: 899, mrp: 2490, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', category: 'Electronics', prime: true, rating: 4.2, reviews: 45230, resaleValue: 320 },
  { id: 'p-002', title: 'Samsung Galaxy Tab A7 Lite (32GB, WiFi)', price: 14999, mrp: 17999, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80', category: 'Electronics', prime: true, rating: 4.4, reviews: 12800, resaleValue: 6450 },
  { id: 'p-003', title: 'TP-Link N300 WiFi Router', price: 1899, mrp: 2999, image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&q=80', category: 'Electronics', prime: true, rating: 4.0, reviews: 8900, resaleValue: 722 },
  { id: 'p-004', title: 'Logitech M185 Wireless Mouse', price: 595, mrp: 999, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', category: 'Electronics', prime: true, rating: 4.3, reviews: 67000, resaleValue: 200 },
  // Fashion
  { id: 'p-005', title: 'Nike Air Max Running Shoes - Size 42', price: 3499, mrp: 5999, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category: 'Fashion', prime: true, rating: 4.1, reviews: 3200, resaleValue: 1330 },
  { id: 'p-006', title: 'Woodland Waterproof Winter Jacket (L)', price: 2899, mrp: 4999, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80', category: 'Fashion', prime: false, rating: 4.3, reviews: 1500, resaleValue: 1100 },
  { id: 'p-007', title: 'Lavie Structured Handbag - Navy Blue', price: 1299, mrp: 2499, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80', category: 'Fashion', prime: true, rating: 4.5, reviews: 890, resaleValue: 500 },
  { id: 'p-008', title: 'Kanjivaram Silk Saree - Maroon Gold', price: 4599, mrp: 7999, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80', category: 'Fashion', prime: false, rating: 4.7, reviews: 340, resaleValue: 2800 },
  // Home & Kitchen
  { id: 'p-009', title: 'Bajaj Mixer Grinder 750W (3 Jars)', price: 2199, mrp: 3499, image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80', category: 'Home & Kitchen', prime: true, rating: 4.2, reviews: 22000, resaleValue: 836 },
  { id: 'p-010', title: 'Philips HD9252 Air Fryer 4.1L', price: 7999, mrp: 12995, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', category: 'Home & Kitchen', prime: true, rating: 4.4, reviews: 15600, resaleValue: 4200 },
  { id: 'p-011', title: 'Prestige Electric Kettle 1.5L', price: 749, mrp: 1295, image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', category: 'Home & Kitchen', prime: true, rating: 4.1, reviews: 9800, resaleValue: 280 },
  { id: 'p-012', title: 'Hawkins Contura Pressure Cooker 5L', price: 2350, mrp: 3200, image: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=400&q=80', category: 'Home & Kitchen', prime: true, rating: 4.5, reviews: 31000, resaleValue: 900 },
  // Baby & Kids
  { id: 'p-013', title: 'Philips Avent Baby Monitor with Camera', price: 3200, mrp: 5499, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80', category: 'Baby & Kids', prime: true, rating: 4.3, reviews: 2100, resaleValue: 1400 },
  { id: 'p-014', title: 'LuvLap Foldable Baby Stroller', price: 5999, mrp: 8999, image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80', category: 'Baby & Kids', prime: true, rating: 4.2, reviews: 4500, resaleValue: 3200 },
  // Sports
  { id: 'p-015', title: 'PowerMax TDM-98 Foldable Treadmill', price: 18999, mrp: 29999, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80', category: 'Sports & Fitness', prime: false, rating: 4.0, reviews: 1200, resaleValue: 8500 },
  { id: 'p-016', title: 'Hero Sprint 26" Gear Cycle (21 Speed)', price: 8499, mrp: 12999, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80', category: 'Sports & Fitness', prime: false, rating: 4.1, reviews: 780, resaleValue: 4000 },
  // More Electronics
  { id: 'p-017', title: 'Canon EOS 1500D DSLR Camera (18-55mm)', price: 29999, mrp: 39995, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80', category: 'Electronics', prime: true, rating: 4.5, reviews: 6700, resaleValue: 15000 },
  { id: 'p-018', title: 'Sony PlayStation 4 Slim 1TB', price: 27999, mrp: 34990, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80', category: 'Electronics', prime: true, rating: 4.6, reviews: 19000, resaleValue: 14000 },
  { id: 'p-019', title: 'Amazon Echo Dot (4th Gen)', price: 3499, mrp: 4999, image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&q=80', category: 'Electronics', prime: true, rating: 4.4, reviews: 42000, resaleValue: 1500 },
  { id: 'p-020', title: 'Dell Inspiron 15 Laptop (i5, 8GB, 512GB)', price: 49990, mrp: 62990, image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', category: 'Electronics', prime: true, rating: 4.3, reviews: 5400, resaleValue: 25000 },
]

/* ─────────────────── Star rating ─────────────────── */
function Stars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-[#FF9900]' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      <span className="text-xs text-[#007185]">{count.toLocaleString('en-IN')}</span>
    </div>
  )
}

/* ─────────────────── Product Card (Amazon style) ─────────────────── */
function ProductCard({ product }: { product: (typeof ALL_PRODUCTS)[0] }) {
  const { addToCart } = useAppContext()
  const { user } = useAuth()
  const navigate = useNavigate()
  const discount = Math.round((1 - product.price / product.mrp) * 100)

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return }
    addToCart({ id: product.id, title: product.title, price: product.price, image: product.image, condition_grade: 'New', seller_name: 'Amazon.in', quantity: 1 })
  }

  return (
    <div className="bg-white rounded-sm shadow-sm p-4 flex flex-col h-full">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="block mb-3">
        <img src={product.image} alt={product.title} className="w-full h-40 object-contain mx-auto" loading="lazy" />
      </Link>

      {/* Details */}
      <div className="flex-1">
        <Link to={`/product/${product.id}`} className="text-sm text-[#0F1111] line-clamp-2 hover:text-[#007185] cursor-pointer leading-snug block">
          {product.title}
        </Link>
        <Stars rating={product.rating} count={product.reviews} />
        <div className="mt-1.5">
          <span className="text-lg font-bold text-[#0F1111]">₹{product.price.toLocaleString('en-IN')}</span>
          <span className="text-xs text-gray-500 line-through ml-2">₹{product.mrp.toLocaleString('en-IN')}</span>
          <span className="text-xs text-[#CC0C39] ml-1">({discount}% off)</span>
        </div>
        {product.prime && (
          <p className="text-xs text-[#007185] mt-0.5">Free delivery with <span className="font-bold">Prime</span></p>
        )}
        {/* Resale value */}
        <div className="mt-2 bg-[#f0f9f4] border border-[#d4edda] rounded-sm px-2 py-1.5 text-xs text-[#0a6245]">
          Est. resale via Neighbourhood in 1 yr: <span className="font-semibold">₹{product.resaleValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-3">
        <button onClick={handleAddToCart} className="flex-1 bg-[#FFD814] hover:bg-[#f7ca00] border border-[#FCD200] text-[#0F1111] font-medium text-sm py-2 rounded-sm transition-colors">
          Add to Cart
        </button>
        <button onClick={() => navigate(`/product/${product.id}`)} className="flex-1 bg-[#FFA41C] hover:bg-[#fa8900] border border-[#FF8F00] text-[#0F1111] font-medium text-sm py-2 rounded-sm transition-colors">
          Buy Now
        </button>
      </div>
    </div>
  )
}

/* ─────────────────── Hero Banner ─────────────────── */
function HeroBanner() {
  const [current, setCurrent] = useState(0)
  useEffect(() => { const t = setInterval(() => setCurrent(c => (c + 1) % BANNER_IMAGES.length), 4000); return () => clearInterval(t) }, [])

  const goNext = () => setCurrent(c => (c + 1) % BANNER_IMAGES.length)
  const goPrev = () => setCurrent(c => (c - 1 + BANNER_IMAGES.length) % BANNER_IMAGES.length)

  return (
    <div className="relative w-full overflow-hidden" style={{ height: '400px' }}>
      {BANNER_IMAGES.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Banner ${i + 1}`}
          className="absolute inset-0 w-full h-full object-fill transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}
      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {BANNER_IMAGES.map((_, i) => (<button key={i} onClick={() => setCurrent(i)} aria-label={`Slide ${i+1}`} className={`h-2.5 rounded-full transition-all ${i === current ? 'w-7 bg-white' : 'w-2.5 bg-white/50'}`}/>))}
      </div>
    </div>
  )
}

/* ─────────────────── Section (category row like Amazon) ─────────────────── */
function ProductSection({ title, products }: { title: string; products: (typeof ALL_PRODUCTS) }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[#0F1111]">{title}</h2>
        <Link to="/neighborhood" className="text-sm text-[#007185] hover:underline">See all</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}

/* ─────────────────── Page ─────────────────── */
export function Home() {
  const electronics = ALL_PRODUCTS.filter(p => p.category === 'Electronics')
  const fashion = ALL_PRODUCTS.filter(p => p.category === 'Fashion')
  const homeKitchen = ALL_PRODUCTS.filter(p => p.category === 'Home & Kitchen')
  const babyKids = ALL_PRODUCTS.filter(p => p.category === 'Baby & Kids')
  const sports = ALL_PRODUCTS.filter(p => p.category === 'Sports & Fitness')

  return (
    <main className="bg-[#EAEDED] min-h-screen pb-20 md:pb-0">

      <HeroBanner />

      {/* Category quick-links (like Amazon's category strip) */}
      <section className="max-w-screen-2xl mx-auto px-4 py-4">
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {CATEGORIES.map(cat => (
            <Link key={cat.label} to={cat.to} className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#FF9900] transition-all shadow-sm">
                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <span className="text-[11px] md:text-xs text-[#0F1111] mt-1.5 font-medium leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Product sections by category (Amazon style) */}
      <div className="max-w-screen-2xl mx-auto px-4">
        <ProductSection title="Best in Electronics" products={electronics} />
        <ProductSection title="Fashion Picks" products={fashion} />
        <ProductSection title="Home & Kitchen Essentials" products={homeKitchen} />
        <ProductSection title="Baby & Kids" products={babyKids} />
        <ProductSection title="Sports & Fitness" products={sports} />
      </div>

      {/* Neighbourhood CTA */}
      <section className="max-w-screen-2xl mx-auto px-4 pb-6">
        <div className="bg-gradient-to-r from-[#0a6245] to-[#085436] rounded-lg p-6 text-white flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Amazon Neighbourhood</p>
            <h3 className="text-xl font-bold">Buy & sell pre-loved locally</h3>
            <p className="text-sm opacity-80 mt-1">AI-graded. Product Passport. Escrow protection. Green Credits.</p>
          </div>
          <Link to="/neighborhood" className="bg-[#FF9900] hover:bg-[#e68900] text-black font-bold px-6 py-3 rounded text-sm flex-shrink-0 transition-colors">
            Explore
          </Link>
        </div>
      </section>
    </main>
  )
}
