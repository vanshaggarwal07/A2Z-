import React from 'react'

interface Cluster {
  cluster_name: string
  count: number
  severity: string
  example_reasons: string[]
  suggested_fix: string
  estimated_returns_prevented_if_fixed: number
}

interface ReturnClustersProps {
  clusters: Cluster[]
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; badge: string }> = {
  high: { border: 'border-red-200', bg: 'bg-red-50', badge: 'bg-[#CC0C39] text-white' },
  medium: { border: 'border-yellow-200', bg: 'bg-yellow-50', badge: 'bg-[#B8860B] text-white' },
  low: { border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-[#0066C0] text-white' },
}

export function ReturnClusters({ clusters }: ReturnClustersProps) {
  return (
    <div className="space-y-3">
      {clusters.map((c, i) => {
        const s = SEVERITY_STYLES[c.severity] || SEVERITY_STYLES.low
        return (
          <div key={i} className={`border ${s.border} ${s.bg} rounded-xl p-4`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
                  {c.severity.toUpperCase()}
                </span>
                <h4 className="font-semibold text-gray-900 text-sm">{c.cluster_name}</h4>
              </div>
              <span className="text-lg font-bold text-gray-700 flex-shrink-0">{c.count}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {c.example_reasons.map((r, j) => (
                <span key={j} className="text-[11px] bg-white px-2 py-0.5 rounded-full border border-gray-200 text-gray-600">
                  "{r}"
                </span>
              ))}
            </div>

            <div className="bg-white rounded-lg p-3 border border-orange-200">
              <p className="text-xs font-semibold text-[#FF9900] mb-1">Fix this</p>
              <p className="text-xs text-gray-700">{c.suggested_fix}</p>
              <p className="text-xs text-[#067D62] font-medium mt-1">
                → Prevent ~{c.estimated_returns_prevented_if_fixed} returns/month
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
