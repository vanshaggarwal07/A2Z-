import React, { useState } from 'react'

const INITIAL_ADDRESSES = [
  { id: '1', name: 'Demo User', line1: '42, Rajpur Road', line2: 'Near Metro Station', city: 'New Delhi', state: 'Delhi', pincode: '110001', phone: '+91 98765 43210', isDefault: true },
  { id: '2', name: 'Demo User', line1: '15, MG Road', line2: 'Block B, Sector 5', city: 'Gurugram', state: 'Haryana', pincode: '122001', phone: '+91 98765 43210', isDefault: false },
]

export function AddressesPage() {
  const [addresses, setAddresses] = useState(INITIAL_ADDRESSES)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' })

  const handleAdd = () => {
    if (!form.name || !form.line1 || !form.city || !form.pincode) return
    setAddresses(prev => [...prev, { ...form, id: Date.now().toString(), isDefault: false }])
    setForm({ name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' })
    setAdding(false)
  }

  const handleRemove = (id: string) => setAddresses(prev => prev.filter(a => a.id !== id))
  const handleSetDefault = (id: string) => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })))

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-[#0F1111] mb-6">Manage Addresses</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {addresses.map(addr => (
          <div key={addr.id} className={`border-2 rounded p-4 relative ${addr.isDefault ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200 bg-white'}`}>
            {addr.isDefault && <span className="absolute top-2 right-2 text-[10px] bg-[#FF9900] text-black font-bold px-2 py-0.5 rounded">DEFAULT</span>}
            <p className="font-semibold text-sm text-[#0F1111]">{addr.name}</p>
            <p className="text-xs text-gray-600 mt-1">{addr.line1}</p>
            {addr.line2 && <p className="text-xs text-gray-600">{addr.line2}</p>}
            <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
            <p className="text-xs text-gray-500 mt-1">Phone: {addr.phone}</p>
            <div className="flex gap-3 mt-3 text-xs">
              {!addr.isDefault && <button onClick={() => handleSetDefault(addr.id)} className="text-[#007185] hover:underline font-medium">Set as default</button>}
              <button onClick={() => handleRemove(addr.id)} className="text-[#CC0C39] hover:underline font-medium">Remove</button>
            </div>
          </div>
        ))}

        {/* Add new card */}
        <button onClick={() => setAdding(true)} className="border-2 border-dashed border-gray-300 rounded p-4 flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors min-h-[150px]">
          <span className="text-2xl text-gray-400">+</span>
          <span className="text-sm text-gray-600 font-medium">Add address</span>
        </button>
      </div>

      {adding && (
        <div className="bg-white border border-gray-200 rounded p-5 space-y-3">
          <h2 className="font-bold text-[#0F1111]">Add a new address</h2>
          <input placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          <input placeholder="Address line 1" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          <input placeholder="Address line 2 (optional)" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
            <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
            <input placeholder="Pincode" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          </div>
          <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]" />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-[#FFD814] hover:bg-[#f7ca00] border border-[#FCD200] text-[#0F1111] font-bold px-6 py-2 rounded text-sm">Add address</button>
            <button onClick={() => setAdding(false)} className="border border-gray-300 text-gray-700 font-medium px-6 py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </main>
  )
}
