import React from 'react'
import type { TriageResult } from '../../lib/triage'

interface CostBenefitCardProps {
  triage: TriageResult
}

const DISPOSITION_ICONS: Record<string, string> = {
  resell: 'R',
  refurbish: 'F',
  donate: 'D',
  recycle: 'Rc',
  exchange: 'Ex',
}

export function CostBenefitCard({ triage }: CostBenefitCardProps) {
  return (
    <div className="border border-[#067D62] rounded-xl p-4 bg-green-50">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">AI Triage Engine</p>
          <p className="text-xs text-gray-500">{triage.reasoning}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-[#111]">₹{triage.resell_value_estimate.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">Est. Recovery</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#067D62]">{triage.co2_saved_kg}kg</p>
          <p className="text-[10px] text-gray-500">CO₂ Saved</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-[#2D6A4F]">+{triage.green_credits_earned}</p>
          <p className="text-[10px] text-gray-500"> Credits</p>
        </div>
      </div>

      <p className="text-xs text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100">
        {triage.cost_benefit_summary}
      </p>
    </div>
  )
}
