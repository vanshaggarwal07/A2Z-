import React, { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../context/AppContext'

// ── Badge System ──────────────────────────────────────────────────────────────

const BADGES = [
  { name: 'Bronze', threshold: 5, color: '#CD7F32', bg: '#fdf2e9', perk: 'Early sale access' },
  { name: 'Silver', threshold: 20, color: '#C0C0C0', bg: '#f8f9fa', perk: '5% cashback on neighborhood purchases' },
  { name: 'Gold', threshold: 100, color: '#FFD700', bg: '#fff9e6', perk: 'Free delivery on neighborhood orders' },
  { name: 'Platinum', threshold: 250, color: '#E5E4E2', bg: '#f0f0f5', perk: '10% off on all refurbished products' },
  { name: 'Earth Guardian', threshold: 500, color: '#2E8B57', bg: '#e8f5e9', perk: 'Exclusive vintage marketplace access' },
  { name: 'Planet Champion', threshold: 1000, color: '#1565C0', bg: '#e3f2fd', perk: 'VIP early access to all Amazon sales' },
]

function getCurrentBadge(co2: number) {
  let current = BADGES[0]
  for (const b of BADGES) {
    if (co2 >= b.threshold) current = b
  }
  return current
}

function getNextBadge(co2: number) {
  for (const b of BADGES) {
    if (co2 < b.threshold) return b
  }
  return null
}

// ── Scroll Animation Hook ─────────────────────────────────────────────────────

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return <span>{display}</span>
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function GreenWalletPage() {
  const { totalCredits, totalCO2, treesEquivalent, itemsResold, itemsBought, creditsLog } = useAppContext()
  const [badgeRevealed, setBadgeRevealed] = useState(false)
  const [bannerIndex, setBannerIndex] = useState(0)

  // Rotate banner every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev === 0 ? 1 : 0))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const currentBadge = getCurrentBadge(totalCO2)
  const nextBadge = getNextBadge(totalCO2)
  const progressToNext = nextBadge
    ? ((totalCO2 - (BADGES[BADGES.indexOf(nextBadge) - 1]?.threshold || 0)) / (nextBadge.threshold - (BADGES[BADGES.indexOf(nextBadge) - 1]?.threshold || 0))) * 100
    : 100

  const itemsDiverted = itemsResold + itemsBought
  const plasticPrevented = (totalCO2 * 0.3).toFixed(1)

  // Badge reveal animation
  useEffect(() => {
    const t = setTimeout(() => setBadgeRevealed(true), 500)
    return () => clearTimeout(t)
  }, [])

  // Section refs for scroll animations
  const s1 = useScrollReveal()
  const s2 = useScrollReveal()
  const s3 = useScrollReveal()
  const s4 = useScrollReveal()
  const s5 = useScrollReveal()
  const s6 = useScrollReveal()
  const s7 = useScrollReveal()
  const s8 = useScrollReveal()

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#e8f5e9] via-white to-[#e3f2fd] pb-24 md:pb-10">

      {/* ── Hero ── */}
      <div className="w-full relative overflow-hidden" style={{ height: '400px' }}>
        <img
          src="/1.png"
          alt="Green Credits Banner 1"
          className="absolute inset-0 w-full h-full object-fill transition-opacity duration-1000"
          style={{ opacity: bannerIndex === 0 ? 1 : 0 }}
        />
        <img
          src="/2.png"
          alt="Green Credits Banner 2"
          className="absolute inset-0 w-full h-full object-fill transition-opacity duration-1000"
          style={{ opacity: bannerIndex === 1 ? 1 : 0 }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 space-y-8 mt-8">

        {/* ── Section 1: CO2 Prevention ── */}
        <div ref={s1.ref} className={`rounded-2xl bg-white border border-green-100 p-6 shadow-sm transition-all duration-700 ${s1.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
              <svg className={`w-8 h-8 text-[#0a6245] transition-transform duration-1000 ${s1.visible ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">CO₂ Prevention</h3>
              <p className="text-sm text-gray-500">Carbon dioxide kept out of the atmosphere</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#0a6245]">{s1.visible ? <AnimatedNumber value={parseFloat(totalCO2.toFixed(0))} /> : 0}</p>
              <p className="text-xs text-gray-500">kg saved</p>
            </div>
          </div>
        </div>

        {/* ── Section 2: Landfill Prevention ── */}
        <div ref={s2.ref} className={`rounded-2xl bg-white border border-green-100 p-6 shadow-sm transition-all duration-700 delay-100 ${s2.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#fff3e0] flex items-center justify-center flex-shrink-0">
              <svg className={`w-8 h-8 text-[#e65100] transition-transform duration-1000 ${s2.visible ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Landfill Prevention</h3>
              <p className="text-sm text-gray-500">Items given a second life instead of waste</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#e65100]">{s2.visible ? <AnimatedNumber value={itemsDiverted} /> : 0}</p>
              <p className="text-xs text-gray-500">items saved</p>
            </div>
          </div>
        </div>

        {/* ── Section 3: Aquatic Life ── */}
        <div ref={s3.ref} className={`rounded-2xl bg-white border border-blue-100 p-6 shadow-sm transition-all duration-700 delay-200 ${s3.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#e3f2fd] flex items-center justify-center flex-shrink-0">
              <svg className={`w-8 h-8 text-[#1565C0] transition-transform duration-1000 ${s3.visible ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Aquatic Life Protected</h3>
              <p className="text-sm text-gray-500">Plastic waste prevented from entering oceans</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#1565C0]">{s3.visible ? plasticPrevented : '0'}</p>
              <p className="text-xs text-gray-500">kg plastic prevented</p>
            </div>
          </div>
        </div>

        {/* ── Section 4: Product Life Extended ── */}
        <div ref={s4.ref} className={`rounded-2xl bg-white border border-purple-100 p-6 shadow-sm transition-all duration-700 delay-300 ${s4.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f3e5f5] flex items-center justify-center flex-shrink-0">
              <svg className={`w-8 h-8 text-[#7B1FA2] transition-transform duration-1000 ${s4.visible ? 'scale-100' : 'scale-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Product Life Extended</h3>
              <p className="text-sm text-gray-500">Average product lifespan extended by reselling</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#7B1FA2]">{s4.visible ? <AnimatedNumber value={itemsDiverted * 18} /> : 0}</p>
              <p className="text-xs text-gray-500">months extended</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7B1FA2] to-[#CE93D8] rounded-full transition-all duration-1000" style={{ width: s4.visible ? `${Math.min(itemsDiverted * 10, 100)}%` : '0%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">Avg +18 months per item</p>
        </div>

        {/* ── Section 5: Trees Saved ── */}
        <div ref={s5.ref} className={`rounded-2xl bg-white border border-green-100 p-6 shadow-sm transition-all duration-700 delay-400 ${s5.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
              <span className={`text-3xl transition-transform duration-1000 ${s5.visible ? 'scale-100' : 'scale-0'}`}>🌳</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900">Trees Saved</h3>
              <p className="text-sm text-gray-500">Equivalent trees worth of CO₂ absorption</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#2E7D32]">{s5.visible ? <AnimatedNumber value={treesEquivalent} /> : 0}</p>
              <p className="text-xs text-gray-500">trees equivalent</p>
            </div>
          </div>
        </div>

        {/* ── Section 6: Your Rewards ── */}
        <div ref={s6.ref} className={`rounded-2xl bg-gradient-to-br from-[#0a6245] to-[#064e36] p-6 text-white shadow-lg transition-all duration-700 delay-500 ${s6.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold mb-4">Your Rewards</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{s6.visible ? <AnimatedNumber value={totalCredits} /> : 0}</p>
              <p className="text-xs text-white/70 mt-1">Green Credits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">₹{s6.visible ? <AnimatedNumber value={Math.round(totalCredits * 0.1)} /> : 0}</p>
              <p className="text-xs text-white/70 mt-1">Cashback Earned</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{s6.visible ? <AnimatedNumber value={Math.min(Math.floor(totalCredits / 200), 5)} /> : 0}</p>
              <p className="text-xs text-white/70 mt-1">Discounts Available</p>
            </div>
          </div>
        </div>

        {/* ── Section 7: Your Impact on Products ── */}
        <div ref={s7.ref} className={`rounded-2xl bg-white border border-gray-200 p-6 shadow-sm transition-all duration-700 ${s7.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Your Impact on Products</h3>
          {creditsLog.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No products bought or sold yet. Start shopping on Neighbourhood!</p>
          ) : (
            <div className="space-y-3">
              {creditsLog.slice(0, 8).map((entry, i) => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${s7.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: `${i * 80}ms`, backgroundColor: i % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <div className="w-10 h-10 rounded-full bg-[#e8f5e9] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#0a6245]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{entry.listing_title || entry.action}</p>
                    <p className="text-xs text-gray-500">{entry.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">+18 months lifespan</p>
                    <p className="text-xs text-[#0a6245] font-medium">+{entry.credits} credits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section 8: Your Environmental Badge ── */}
        <div ref={s8.ref} className={`rounded-2xl bg-white border border-gray-200 p-6 shadow-sm transition-all duration-700 ${s8.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Your Environmental Badge</h3>

          {/* Current badge - animated reveal */}
          <div className={`text-center mb-8 transition-all duration-1000 ${badgeRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg" style={{ backgroundColor: currentBadge.bg, border: `3px solid ${currentBadge.color}` }}>
              <span className="text-4xl">
                {currentBadge.name === 'Bronze' && '🥉'}
                {currentBadge.name === 'Silver' && '🥈'}
                {currentBadge.name === 'Gold' && '🥇'}
                {currentBadge.name === 'Platinum' && '💎'}
                {currentBadge.name === 'Earth Guardian' && '🌍'}
                {currentBadge.name === 'Planet Champion' && '🏆'}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{currentBadge.name}</p>
            <p className="text-sm text-gray-500 mt-1">Current Perk: {currentBadge.perk}</p>

            {nextBadge && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{totalCO2.toFixed(1)} kg</span>
                  <span>{nextBadge.threshold} kg ({nextBadge.name})</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1500" style={{ width: `${Math.min(progressToNext, 100)}%`, backgroundColor: nextBadge.color }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{(nextBadge.threshold - totalCO2).toFixed(1)} kg more to unlock {nextBadge.name}</p>
              </div>
            )}
          </div>

          {/* All badge tiers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGES.map((badge) => {
              const unlocked = totalCO2 >= badge.threshold
              return (
                <div key={badge.name} className={`rounded-xl p-3 text-center border transition-all ${unlocked ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  <span className="text-2xl block mb-1">
                    {badge.name === 'Bronze' && '🥉'}
                    {badge.name === 'Silver' && '🥈'}
                    {badge.name === 'Gold' && '🥇'}
                    {badge.name === 'Platinum' && '💎'}
                    {badge.name === 'Earth Guardian' && '🌍'}
                    {badge.name === 'Planet Champion' && '🏆'}
                  </span>
                  <p className="text-xs font-bold text-gray-900">{badge.name}</p>
                  <p className="text-[10px] text-gray-500">{badge.threshold} kg CO₂</p>
                  <p className="text-[10px] text-[#0a6245] mt-1 font-medium leading-tight">{badge.perk}</p>
                  {unlocked && <span className="inline-block mt-1 text-[9px] bg-[#0a6245] text-white px-2 py-0.5 rounded-full font-bold">UNLOCKED</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="text-center py-8">
          <p className="text-2xl font-bold text-[#0a6245] mb-2">Keep Going, Planet Hero! 🌱</p>
          <p className="text-sm text-gray-500 mb-4">Every second-hand purchase makes a difference</p>
          <a href="/neighborhood" className="inline-block bg-[#FF9900] hover:bg-[#e68900] text-black font-bold px-8 py-3 rounded-full text-sm transition-colors">
            Browse Neighbourhood
          </a>
        </div>
      </div>
    </main>
  )
}
