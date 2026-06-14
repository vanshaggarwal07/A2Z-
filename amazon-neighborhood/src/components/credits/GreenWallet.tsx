import React, { useRef } from 'react'
import { useAppContext } from '../../context/AppContext'

export function GreenWallet() {
  const { totalCredits, totalCO2, treesEquivalent, itemsResold, itemsBought, creditsLog } = useAppContext()
  const certRef = useRef<HTMLDivElement>(null)

  const marketplace = [
    { credits: 500,  reward: '₹50 off next order',                           icon: 'discount',  available: totalCredits >= 500 },
    { credits: 200,  reward: 'Boost listing to top of feed for 24h',          icon: 'boost',     available: totalCredits >= 200 },
    { credits: 1000, reward: 'Early access to next certified refurb drop',     icon: 'early',     available: totalCredits >= 1000 },
    { credits: 0,    reward: 'Generate shareable CO₂ certificate',             icon: 'cert',      available: true },
  ]

  const actionLabels: Record<string, string> = {
    discount: 'Redeem',
    boost:    'Use',
    early:    'Reserve',
    cert:     'Download PDF',
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Balance hero */}
      <div className="bg-[#0a6245] rounded-xl p-6 text-white text-center">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 8C8 10 5.9 16.17 3.82 19.54c-.23.39-.1.87.27 1.1.37.22.84.09 1.06-.29C7 17 9 13 17 11v3l4-4-4-4v2z"/>
          </svg>
        </div>
        <p className="text-base font-medium opacity-90">Your Green Credits</p>
        <p className="text-6xl font-bold my-2">{totalCredits}</p>
        <p className="opacity-75 text-sm">Available to redeem</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: itemsResold,              label: 'Items resold',              sub: '' },
          { value: itemsBought,              label: 'Items bought second-hand',  sub: '' },
          { value: `${totalCO2.toFixed(1)}kg`, label: 'CO₂ saved',             sub: `≈ ${treesEquivalent} tree${treesEquivalent !== 1 ? 's' : ''}` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded border border-gray-200 p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.label}</p>
            {s.sub && <p className="text-[11px] text-[#0a6245] font-medium mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Marketplace */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Redeem Your Credits</h3>
          <p className="text-xs text-gray-500 mt-0.5">Credits have real value — not just feel-good points</p>
        </div>
        <div className="divide-y divide-gray-100">
          {marketplace.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#0a6245]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {item.icon === 'discount' && <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M17 17h.01M5.5 5.5l13 13M19 5.5L5.5 19" />}
                  {item.icon === 'boost'    && <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />}
                  {item.icon === 'early'    && <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
                  {item.icon === 'cert'     && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                </svg>
              </div>
              <div className="flex-1">
                {item.credits > 0 && (
                  <p className="text-xs text-gray-400 font-medium">{item.credits} credits</p>
                )}
                <p className="text-sm font-medium text-gray-900">{item.reward}</p>
              </div>
              <button
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                  item.available
                    ? 'bg-[#FF9900] text-black hover:bg-[#e68900]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!item.available}
              >
                {actionLabels[item.icon]}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Credits History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Action</th>
                <th className="text-right px-4 py-2">Credits</th>
                <th className="text-right px-4 py-2">CO₂ Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {creditsLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-gray-500 text-xs">{entry.date}</td>
                  <td className="px-4 py-2 text-gray-800">{entry.action}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${entry.credits >= 0 ? 'text-[#0a6245]' : 'text-red-500'}`}>
                    {entry.credits >= 0 ? '+' : ''}{entry.credits}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-500 text-xs">
                    {entry.co2_saved_kg > 0 ? `${entry.co2_saved_kg} kg` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Year-end receipt */}
      <div ref={certRef} className="bg-[#f0f9f4] border-2 border-[#0a6245] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-[#0a6245]">2026 Sustainability Receipt</p>
            <p className="text-xs text-gray-500">Your verified environmental impact</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400">amazon</p>
            <p className="text-xs text-[#FF9900] font-bold">Neighbourhood</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          In 2026, you saved{' '}
          <span className="font-semibold text-[#0a6245]">{totalCO2.toFixed(1)} kg of CO₂</span>,
          diverted{' '}
          <span className="font-semibold">{itemsResold + itemsBought} items</span> from landfill,
          and earned{' '}
          <span className="font-semibold">{totalCredits} credits</span>.
        </p>
        <p className="text-xs text-gray-400 mt-3">
          Amazon can use this data for ESG reporting — your actions count.
        </p>
        <button
          onClick={() => window.print()}
          className="mt-4 text-xs font-semibold text-[#0a6245] hover:underline"
        >
          Share as image
        </button>
      </div>
    </div>
  )
}
