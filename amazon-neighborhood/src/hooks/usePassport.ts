import { useMemo } from 'react'
import aiCache from '../data/ai_cache.json'
import { callPassportNarrative } from '../lib/groq'

export interface PassportNode {
  owner_alias: string
  owned_from: string
  owned_until: string | null
  condition_at_transfer: string
  grade_at_transfer: string
  reason_for_transfer: string
  is_original_purchase: boolean
}

export function usePassportNarrative(
  listingId: string,
  productName: string,
  nodes: PassportNode[]
) {
  const cached = useMemo(() => {
    const c = (aiCache as Record<string, { passport_narrative?: { narrative: string } }>)[listingId]
    return c?.passport_narrative?.narrative || null
  }, [listingId])

  return { cachedNarrative: cached, fetchNarrative: () => callPassportNarrative(productName, nodes) }
}
