import React from 'react'

interface QualityScoreProps {
  score: number
  productName: string
  mainIssues: string[]
  topFix: string
  returnsPreventable: number
}

export function ListingQualityScore({
  score,
  productName,
  mainIssues,
  topFix,
  returnsPreventable,
}: QualityScoreProps) {
  const color =
    score >= 80 ? '#067D62' : score >= 60 ? '#B8860B' : '#CC0C39'
  const label = score >= 80 ? 'Great' : score >= 60 ? 'Fair' : 'Needs Work'

  const circumference = 2 * Math.PI * 28
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="flex items-center gap-4 mb-3">
        {/* Circle gauge */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64" aria-label={`Quality score: ${score} out of 100`}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color }}>{score}</span>
            <span className="text-[9px] text-gray-400">/100</span>
          </div>
        </div>

        <div>
          <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">{productName}</p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        </div>
      </div>

      {mainIssues.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Issues found:</p>
          <ul className="space-y-1">
            {mainIssues.map((issue, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-red-400 mt-0.5">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-[#FF9900] mb-1">Top Fix</p>
        <p className="text-xs text-gray-700">{topFix}</p>
        {returnsPreventable > 0 && (
          <p className="text-xs text-[#067D62] font-medium mt-1">
            → Prevents ~{returnsPreventable} returns/month
          </p>
        )}
      </div>

      <button className="mt-3 w-full text-xs font-semibold text-[#007185] hover:underline text-left">
        [Fix Listing] →
      </button>
    </div>
  )
}
