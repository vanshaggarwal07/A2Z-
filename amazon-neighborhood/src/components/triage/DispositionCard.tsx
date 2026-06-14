import React from 'react'

const DISPOSITIONS = [
  { value: 'resell',    label: 'Resell',    desc: 'Peer-to-peer via Neighborhood' },
  { value: 'refurbish', label: 'Refurbish', desc: 'Send to partner refurbishment centre' },
  { value: 'donate',    label: 'Donate',    desc: 'Partner NGO list' },
  { value: 'recycle',   label: 'Recycle',   desc: 'E-waste pickup' },
  { value: 'exchange',  label: 'Exchange',  desc: 'Swap for credit or similar item' },
]

interface DispositionCardProps {
  selected: string
  recommended: string
  onSelect: (value: string) => void
}

export function DispositionCard({ selected, recommended, onSelect }: DispositionCardProps) {
  return (
    <div className="space-y-2">
      {DISPOSITIONS.map((d) => {
        const isSelected     = selected === d.value
        const isRecommended  = recommended === d.value
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onSelect(d.value)}
            className={`w-full flex items-center gap-3 p-3 rounded border-2 text-left transition-all ${
              isSelected
                ? 'border-[#FF9900] bg-orange-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            aria-pressed={isSelected}
          >
            {/* Radio dot */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-[#FF9900] bg-[#FF9900]' : 'border-gray-300'
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">{d.label}</span>
                {isRecommended && (
                  <span className="text-[10px] font-bold bg-[#067D62] text-white px-1.5 py-0.5 rounded-sm">
                    AI Recommended
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{d.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
