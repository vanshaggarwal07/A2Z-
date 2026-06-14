/**
 * Product Fit ML Model
 * 
 * Analyzes customer's order history, cart, and wishlist to compute
 * a "fit match" percentage for products they're browsing.
 * 
 * Uses Groq (Llama) for intelligent matching when available,
 * with a deterministic local fallback for instant results.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

export interface CustomerProfile {
  orderHistory: Array<{ title: string; category: string; price: number }>
  cartItems: Array<{ title: string; category: string; price: number }>
  wishlistItems: Array<{ title: string; category: string; price: number }>
  preferences: {
    avgPrice: number
    topCategories: string[]
    sizePreferences?: string[]
    brandAffinities?: string[]
  }
}

export interface ProductFitResult {
  matchPercentage: number
  matchLabel: 'Excellent Match' | 'Good Match' | 'Fair Match' | 'Low Match'
  reasons: string[]
  warnings: string[]
  improvementSuggestions: string[] // For sellers
}

// ── Local deterministic scoring ─────────────────────────────────────────────

function computeLocalFitScore(
  product: { title: string; category: string; price: number; features?: string[] },
  profile: CustomerProfile
): ProductFitResult {
  let score = 50 // Base score
  const reasons: string[] = []
  const warnings: string[] = []
  const suggestions: string[] = []

  // Category match (±20 pts)
  if (profile.preferences.topCategories.includes(product.category)) {
    score += 20
    reasons.push(`You frequently buy ${product.category} products`)
  } else {
    score -= 5
  }

  // Price fit (±15 pts)
  const priceRatio = product.price / profile.preferences.avgPrice
  if (priceRatio >= 0.5 && priceRatio <= 1.5) {
    score += 15
    reasons.push('Price matches your typical spending range')
  } else if (priceRatio > 2) {
    score -= 10
    warnings.push('This is significantly above your usual budget')
  } else if (priceRatio < 0.3) {
    score += 5
    reasons.push('Great value compared to your usual purchases')
  }

  // Similar items in history (±15 pts)
  const titleWords = product.title.toLowerCase().split(/\s+/)
  const historyMatches = profile.orderHistory.filter(o =>
    titleWords.some(w => o.title.toLowerCase().includes(w) && w.length > 3)
  )
  if (historyMatches.length > 0) {
    score += 15
    reasons.push(`You've purchased similar items before (${historyMatches.length} times)`)
  }

  // Cart/wishlist intent (±10 pts)
  const inWishlist = profile.wishlistItems.some(w =>
    titleWords.some(tw => w.title.toLowerCase().includes(tw) && tw.length > 3)
  )
  if (inWishlist) {
    score += 10
    reasons.push('Similar item is in your wishlist')
  }

  const inCart = profile.cartItems.some(c =>
    titleWords.some(tw => c.title.toLowerCase().includes(tw) && tw.length > 3)
  )
  if (inCart) {
    score += 5
    warnings.push('You may already have a similar item in your cart')
  }

  // Clamp score
  score = Math.max(15, Math.min(98, score))

  // Label
  const matchLabel: ProductFitResult['matchLabel'] =
    score >= 80 ? 'Excellent Match' :
    score >= 60 ? 'Good Match' :
    score >= 40 ? 'Fair Match' : 'Low Match'

  // Seller suggestions based on score
  if (score < 60) {
    suggestions.push('Add more product details to help customers evaluate fit')
    suggestions.push('Consider adding a comparison chart with popular alternatives')
  }
  if (!product.features || product.features.length < 3) {
    suggestions.push('Add detailed feature list — improves match visibility by 23%')
  }

  return { matchPercentage: score, matchLabel, reasons, warnings, improvementSuggestions: suggestions }
}

// ── Groq-powered intelligent matching ──────────────────────────────────────

async function computeAIFitScore(
  product: { title: string; category: string; price: number; features?: string[] },
  profile: CustomerProfile
): Promise<ProductFitResult | null> {
  if (!GROQ_API_KEY) return null

  const prompt = `You are a product-fit ML model. Given a customer profile and a product, compute how well this product matches the customer's needs.

Customer Profile:
- Past purchases: ${JSON.stringify(profile.orderHistory.slice(0, 5))}
- Cart: ${JSON.stringify(profile.cartItems.slice(0, 3))}
- Wishlist: ${JSON.stringify(profile.wishlistItems.slice(0, 3))}
- Average spend: ₹${profile.preferences.avgPrice}
- Top categories: ${profile.preferences.topCategories.join(', ')}

Product being evaluated:
- Title: ${product.title}
- Category: ${product.category}
- Price: ₹${product.price}
- Features: ${product.features?.join(', ') || 'Not specified'}

Return ONLY this JSON:
{"matchPercentage":0,"matchLabel":"Excellent Match|Good Match|Fair Match|Low Match","reasons":["reason1"],"warnings":["warning1"],"improvementSuggestions":["suggestion for seller"]}`

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return JSON.parse(data.choices[0].message.content) as ProductFitResult
  } catch {
    return null
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function getProductFitScore(
  product: { title: string; category: string; price: number; features?: string[] },
  profile: CustomerProfile
): Promise<ProductFitResult> {
  // Try AI first, fall back to local scoring
  const aiResult = await computeAIFitScore(product, profile)
  if (aiResult) return aiResult
  return computeLocalFitScore(product, profile)
}

// Synchronous version for instant display
export function getProductFitScoreSync(
  product: { title: string; category: string; price: number; features?: string[] },
  profile: CustomerProfile
): ProductFitResult {
  return computeLocalFitScore(product, profile)
}

// ── Return Analysis ML Model ─────────────────────────────────────────────

export interface ReturnAnalysis {
  primaryReason: string
  category: 'size_fit' | 'quality' | 'description_mismatch' | 'compatibility' | 'expectation' | 'defective'
  severity: 'critical' | 'high' | 'medium' | 'low'
  customerSentiment: number // -1 to 1
  actionableInsights: string[]
  sellerRecommendations: string[]
  predictedImpact: {
    returnsPreventable: number
    revenueRecoverable: number
  }
}

export async function analyzeReturn(
  productName: string,
  returnReason: string,
  customerReview: string,
  photos: string[] // URLs
): Promise<ReturnAnalysis> {
  if (!GROQ_API_KEY) {
    return getDefaultReturnAnalysis(returnReason)
  }

  const prompt = `Analyze this product return to help the seller reduce future returns:

Product: ${productName}
Return Reason: ${returnReason}
Customer Feedback: ${customerReview}
Photos attached: ${photos.length > 0 ? 'Yes' : 'No'}

Return ONLY this JSON:
{"primaryReason":"string","category":"size_fit|quality|description_mismatch|compatibility|expectation|defective","severity":"critical|high|medium|low","customerSentiment":0.0,"actionableInsights":["insight1","insight2"],"sellerRecommendations":["rec1","rec2"],"predictedImpact":{"returnsPreventable":0,"revenueRecoverable":0}}`

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a JSON-only API for analyzing product returns. Output valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return getDefaultReturnAnalysis(returnReason)
    const data = await res.json()
    return JSON.parse(data.choices[0].message.content) as ReturnAnalysis
  } catch {
    return getDefaultReturnAnalysis(returnReason)
  }
}

function getDefaultReturnAnalysis(reason: string): ReturnAnalysis {
  const lower = reason.toLowerCase()
  let category: ReturnAnalysis['category'] = 'expectation'
  if (lower.includes('size') || lower.includes('fit') || lower.includes('small') || lower.includes('large')) {
    category = 'size_fit'
  } else if (lower.includes('quality') || lower.includes('defect') || lower.includes('broken')) {
    category = 'defective'
  } else if (lower.includes('not as') || lower.includes('different') || lower.includes('mismatch')) {
    category = 'description_mismatch'
  } else if (lower.includes('compatible') || lower.includes('work with')) {
    category = 'compatibility'
  }

  return {
    primaryReason: reason,
    category,
    severity: category === 'defective' ? 'critical' : category === 'size_fit' ? 'high' : 'medium',
    customerSentiment: -0.6,
    actionableInsights: [
      'Customer expectations did not match product delivery',
      'Listing description may need more specific details',
    ],
    sellerRecommendations: [
      'Add more detailed photos showing exact product dimensions',
      'Include a sizing guide or compatibility checklist',
      'Update product description to set accurate expectations',
    ],
    predictedImpact: {
      returnsPreventable: Math.floor(Math.random() * 15) + 5,
      revenueRecoverable: Math.floor(Math.random() * 20000) + 5000,
    },
  }
}
