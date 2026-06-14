import React from 'react'
import { getOwnershipDuration } from '../../lib/passport'
import type { PassportNode } from '../../hooks/usePassport'

interface PassportTimelineProps {
  nodes: PassportNode[]
  narrative?: string
}

function NodeCard({ node, index, total }: { node: PassportNode; index: number; total: number }) {
  const isLast = index === total - 1
  const isCurrent = isLast && !node.owned_until

  const gradeColors: Record<string, string> = {
    'Like New': 'text-[#067D62]',
    Good: 'text-[#0066C0]',
    Fair: 'text-[#B8860B]',
    'For Parts': 'text-[#CC0C39]',
  }

  return (
    <div
      className={`flex-shrink-0 min-w-[180px] max-w-[200px] rounded-lg border p-3 ${
        node.is_original_purchase
          ? 'border-yellow-400 bg-yellow-50'
          : isCurrent
          ? 'border-[#067D62] bg-green-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Icon + Owner */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{node.is_original_purchase ? '' : isCurrent ? '' : ''}</span>
        <div>
          <p className="text-xs font-bold text-gray-800 truncate max-w-[130px]">{node.owner_alias}</p>
          {node.is_original_purchase && (
        <span className="text-xs font-bold border border-yellow-500 text-yellow-700 px-1.5 py-0.5 rounded-sm">
                    Amazon Verified
                  </span>
          )}
        </div>
      </div>

      {/* Dates */}
      <p className="text-[10px] text-gray-500 mb-1">
        {node.owned_from}
        {node.owned_until ? ` → ${node.owned_until}` : ' → Now'}
      </p>

      {/* Duration */}
      <p className="text-[10px] text-gray-400 mb-2">
        Duration: {getOwnershipDuration(node.owned_from, node.owned_until)}
      </p>

      {/* Grade */}
      <div className={`text-xs font-semibold ${gradeColors[node.grade_at_transfer] || 'text-gray-700'}`}>
        Grade: {node.grade_at_transfer} 
      </div>

      {/* Reason */}
      <p className="text-[10px] text-gray-500 mt-1 italic">"{node.reason_for_transfer}"</p>
    </div>
  )
}

export function PassportTimeline({ nodes, narrative }: PassportTimelineProps) {
  return (
    <div className="border border-[#067D62] rounded-xl p-4 bg-white" style={{ borderLeft: '4px solid #067D62' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Product Passport — Full Ownership History</h3>
          <p className="text-xs text-[#067D62]">Verified ownership chain · Cannot be altered</p>
        </div>
      </div>

      {/* Timeline — horizontal desktop, vertical mobile */}
      <div className="hidden md:flex items-start gap-0 overflow-x-auto pb-2">
        {nodes.map((node, i) => (
          <React.Fragment key={i}>
            <NodeCard node={node} index={i} total={nodes.length} />
            {i < nodes.length - 1 && (
              <div className="flex items-center self-center mx-1 flex-shrink-0">
                <div className="w-6 h-px border-t-2 border-dashed border-[#067D62]" />
                <svg className="w-3 h-3 text-[#067D62]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Vertical (mobile) */}
      <div className="md:hidden flex flex-col gap-3">
        {nodes.map((node, i) => (
          <div key={i} className="relative">
            {i < nodes.length - 1 && (
              <div className="absolute left-4 top-full h-3 w-px border-l-2 border-dashed border-[#067D62]" />
            )}
            <NodeCard node={node} index={i} total={nodes.length} />
          </div>
        ))}
      </div>

      {/* AI Narrative */}
      {narrative && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-700 italic">
            <span className="text-[#067D62] font-semibold not-italic">AI Trust Summary: </span>
            "{narrative}"
          </p>
        </div>
      )}
    </div>
  )
}
