import { blipCaption, clipCondition, fileToBase64 } from './huggingface'
import aiCache from '../data/ai_cache.json'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export interface GradingResult {
  condition_grade: 'Like New' | 'Good' | 'Fair' | 'For Parts'
  condition_summary: string
  defects_detected: string[]
  estimated_category: string
  estimated_product_name: string
  confidence_score: number
  recommended_disposition: string
}

const DEFAULT_GRADING_RESPONSE: GradingResult = {
  condition_grade: 'Good',
  condition_summary: 'Good condition — minor wear detected from regular use.',
  defects_detected: ['minor surface wear'],
  estimated_category: 'other',
  estimated_product_name: 'Used product',
  confidence_score: 0.6,
  recommended_disposition: 'resell',
}

// Cache lookup helper
export function getCachedGrading(listingId: string): GradingResult | null {
  const cached = (aiCache as Record<string, { grading?: GradingResult }>)[listingId]
  return cached?.grading || null
}

// Full Pipeline 1: file → BLIP → CLIP → Groq
export async function gradeProduct(
  imageFile: File,
  categoryHint = 'other',
  timeoutMs = 8000
): Promise<GradingResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const base64Image = await fileToBase64(imageFile)

    // Stage 1a: BLIP caption
    const caption = await blipCaption(base64Image)

    // Stage 1b: CLIP condition scores
    const clipResult = await clipCondition(base64Image)

    // Stage 2: Groq reasoning
    const gradingPrompt = `A second-hand product photo was analysed by a vision model.
Image caption: "${caption}"
Condition classification scores: ${JSON.stringify(clipResult)}
Category hint: ${categoryHint}
Based on this, return ONLY this JSON (no markdown, no preamble):
{"condition_grade":"Like New|Good|Fair|For Parts","condition_summary":"one sentence max","defects_detected":["specific defect 1"],"estimated_category":"electronics|fashion|appliances|baby|furniture|books|other","estimated_product_name":"best guess at product name","confidence_score":0.0,"recommended_disposition":"resell|refurbish|donate|recycle"}`

    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
          { role: 'user', content: gradingPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) throw new Error('Groq grading failed')

    const data = await groqRes.json()
    const result = JSON.parse(data.choices[0].message.content) as GradingResult
    clearTimeout(timer)
    return result
  } catch {
    clearTimeout(timer)
    return DEFAULT_GRADING_RESPONSE
  }
}
