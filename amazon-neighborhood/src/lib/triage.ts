import { callTriage } from './groq'
import aiCache from '../data/ai_cache.json'

export interface TriageResult {
  recommended: string
  reasoning: string
  resell_value_estimate: number
  refurb_cost_estimate: number
  co2_saved_kg: number
  green_credits_earned: number
  cost_benefit_summary: string
}

export async function getTriage(
  listingId: string,
  name: string,
  category: string,
  grade: string,
  originalPrice: number,
  defects: string[]
): Promise<TriageResult> {
  // Check cache first
  const cached = (aiCache as Record<string, { triage?: TriageResult }>)[listingId]
  if (cached?.triage) return cached.triage

  // Live call
  try {
    return await callTriage(name, category, grade, originalPrice, defects)
  } catch {
    // Fallback
    return {
      recommended: 'resell',
      reasoning: 'Good condition items typically recover best value through local resale.',
      resell_value_estimate: Math.round(originalPrice * 0.4),
      refurb_cost_estimate: 0,
      co2_saved_kg: 1.5,
      green_credits_earned: 30,
      cost_benefit_summary: `Resell → Estimated recovery ₹${Math.round(originalPrice * 0.4)} | CO₂ saved: 1.5kg | Green Credits: +30`,
    }
  }
}
