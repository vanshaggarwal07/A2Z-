import React, { useState } from 'react'

const SAVED_CARDS = [
  { id: '1', type: 'Visa', last4: '4242', expiry: '12/27', name: 'Demo User', isDefault: true },
  { id: '2', type: 'Mastercard', last4: '8888', expiry: '08/26', name: 'Demo User', isDefault: false },
]

const SAVED_UPI = [{ id: 'u1', vpa: 'demouser@upi', isDefault: false }]

export function PaymentsPage() {
  const [cards, setCards] = useState(SAVED_CARDS)
  const [upi] = useState(SAVED_UPI)

  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id))
  const setDefault = (id: string) => setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-[#0F1111] mb-6">Payment Options</h1>

      <section className="mb-6">
        <h2 className="font-semibold text-[#0F1111] mb-3">Saved Cards</h2>
        <div className="space-y-2">
          {cards.map(card => (
            <div key={card.id} className={`border-2 rounded p-4 flex items-center gap-3 ${card.isDefault ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200'}`}>
              <div className="w-10 h-7 bg-[#131921] rounded flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{card.type === 'Visa' ? 'VISA' : 'MC'}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F1111]">{card.type} ending in {card.last4}</p>
                <p className="text-xs text-gray-500">Expires {card.expiry} | {card.name}</p>
              </div>
              {card.isDefault && <span className="text-[10px] bg-[#FF9900] text-black font-bold px-2 py-0.5 rounded">DEFAULT</span>}
              <div className="flex gap-2 text-xs">
                {!card.isDefault && <button onClick={() => setDefault(card.id)} className="text-[#007185] hover:underline">Set default</button>}
                <button onClick={() => removeCard(card.id)} className="text-[#CC0C39] hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm text-[#007185] hover:underline font-medium">+ Add a credit or debit card</button>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold text-[#0F1111] mb-3">UPI</h2>
        <div className="space-y-2">
          {upi.map(u => (
            <div key={u.id} className="border border-gray-200 rounded p-4 flex items-center gap-3">
              <div className="w-10 h-7 bg-[#4B0082] rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">UPI</div>
              <p className="text-sm font-medium text-[#0F1111]">{u.vpa}</p>
            </div>
          ))}
        </div>
        <button className="mt-3 text-sm text-[#007185] hover:underline font-medium">+ Add UPI ID</button>
      </section>

      <section>
        <h2 className="font-semibold text-[#0F1111] mb-3">Other Payment Methods</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
            <div className="w-10 h-7 bg-green-100 rounded flex items-center justify-center text-green-700 text-[10px] font-bold flex-shrink-0">COD</div>
            <span>Cash on Delivery</span>
            <span className="ml-auto text-xs text-[#067D62] font-medium">Available</span>
          </div>
          <div className="border border-gray-200 rounded p-3 flex items-center gap-3">
            <div className="w-10 h-7 bg-blue-100 rounded flex items-center justify-center text-blue-700 text-[10px] font-bold flex-shrink-0">NB</div>
            <span>Net Banking</span>
            <span className="ml-auto text-xs text-[#067D62] font-medium">Available</span>
          </div>
        </div>
      </section>
    </main>
  )
}
