import React, { useState } from 'react'

export function ProfilePage() {
  const [name, setName] = useState('Demo User')
  const [email, setEmail] = useState('demo@amazon-neighbourhood.in')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [gender, setGender] = useState('Male')
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-[#0F1111] mb-6">Your Profile</h1>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-[#131921] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-bold text-lg text-[#0F1111]">{name}</p>
            <button className="text-xs text-[#007185] hover:underline mt-1">Change profile picture</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent">
            <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
        </div>

        <button onClick={handleSave} className="w-full bg-[#FFD814] hover:bg-[#f7ca00] border border-[#FCD200] text-[#0F1111] font-bold py-2.5 rounded text-sm transition-colors">
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>
    </main>
  )
}
