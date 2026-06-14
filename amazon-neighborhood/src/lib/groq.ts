const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

async function groqCall(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature = 0.3,
  jsonMode = true
): Promise<string> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
  }
  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

// ---- Prompt #2: AI Triage Engine ----
export async function callTriage(
  name: string,
  category: string,
  grade: string,
  originalPrice: number,
  defects: string[]
): Promise<{
  recommended: string
  reasoning: string
  resell_value_estimate: number
  refurb_cost_estimate: number
  co2_saved_kg: number
  green_credits_earned: number
  cost_benefit_summary: string
}> {
  const prompt = `Product: ${name}. Category: ${category}. Condition grade: ${grade}. Original price: ₹${originalPrice}. Defects: ${defects.join(', ') || 'none'}.
Decide the optimal disposition. Return ONLY this JSON:
{"recommended":"resell|refurbish|donate|recycle|exchange","reasoning":"one sentence why","resell_value_estimate":0,"refurb_cost_estimate":0,"co2_saved_kg":0.0,"green_credits_earned":0,"cost_benefit_summary":"one sentence"}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}

// ---- Prompt #3: Price Suggestion ----
export async function callPriceSuggestion(
  name: string,
  originalPrice: number,
  purchaseDate: string,
  grade: string,
  category: string
): Promise<{
  suggested_price: number
  price_range: { min: number; max: number }
  reasoning: string
  depreciation_percent: number
  resale_value_1yr: number
}> {
  const prompt = `Product: ${name}. Original price: ₹${originalPrice}. Purchased: ${purchaseDate}. Condition grade: ${grade}. Category: ${category}.
Suggest a fair resale price in Indian Rupees for a local peer-to-peer sale. Return ONLY this JSON:
{"suggested_price":0,"price_range":{"min":0,"max":0},"reasoning":"one sentence","depreciation_percent":0,"resale_value_1yr":0}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}

// ---- Prompt #4: Passport Narrative ----
export async function callPassportNarrative(
  productName: string,
  passportNodes: Array<{
    owner_alias: string
    owned_from: string
    condition_at_transfer: string
    reason_for_transfer: string
  }>
): Promise<{ narrative: string }> {
  const prompt = `Product: ${productName}. Ownership chain: ${JSON.stringify(passportNodes)}.
Write a 2-sentence buyer trust summary. Be factual and warm, no marketing fluff. Return ONLY this JSON:
{"narrative":"string"}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}

// ---- Prompt #5: Return Reason Clustering ----
export async function callReturnClustering(returnReasons: string[]): Promise<{
  clusters: Array<{
    cluster_name: string
    count: number
    severity: string
    example_reasons: string[]
    suggested_fix: string
    estimated_returns_prevented_if_fixed: number
  }>
}> {
  const prompt = `Here are return reasons reported by buyers for a seller this month: ${JSON.stringify(returnReasons)}.
Cluster them into 3-5 groups. Return ONLY this JSON:
{"clusters":[{"cluster_name":"string","count":0,"severity":"high|medium|low","example_reasons":["string"],"suggested_fix":"one actionable sentence","estimated_returns_prevented_if_fixed":0}]}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}

// ---- Prompt #6: Chatbot Discovery ----
export async function callChatbot(
  userQuery: string,
  vocalForLocal = false
): Promise<{
  sentence: string
  filters: {
    category: string
    max_price: number | null
    keywords: string[]
    listing_type_preference: string
  }
}> {
  const systemPrompt = `You are Amazon Neighborhood's friendly discovery assistant helping users find second-hand goods nearby in India.
Your job: understand what the user wants to buy/find, and respond with:
1. A warm, helpful one-sentence reply (max 15 words)
2. Then output ONLY this JSON on a new line (no markdown, no backticks): {"category":"electronics|fashion|appliances|baby|furniture|books|other|","max_price":null,"keywords":["keyword1"],"listing_type_preference":"any|resell|donate|exchange"}

Rules:
- category should match: electronics, fashion, appliances, baby, furniture, books, other, or empty string for all
- keywords should be 1-3 relevant search terms from the user query
- max_price should be a number if user mentions a budget, otherwise null
- listing_type_preference: "any" unless user specifically asks for exchange/donate/free items
${vocalForLocal ? '- Only suggest products from verified local artisan sellers (is_local_artisan: true).' : ''}

Examples:
User: "I need earphones under 1000"
Response: Here are earphones available near you under ₹1,000!
{"category":"electronics","max_price":1000,"keywords":["earphones"],"listing_type_preference":"any"}

User: "show me baby strollers"
Response: Found baby strollers listed in your neighbourhood!
{"category":"baby","max_price":null,"keywords":["stroller"],"listing_type_preference":"any"}

User: "kuch free mein mil sakta hai kya?"
Response: Here are free items available near you!
{"category":"","max_price":null,"keywords":[],"listing_type_preference":"donate"}`

  const raw = await groqCall(
    'llama-3.3-70b-versatile',
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
    0.3,
    false // chatbot uses free-form, not json_object mode
  )

  // Parse: sentence before first '{', JSON from first '{' to last '}'
  const jsonStart = raw.indexOf('{')
  const jsonEnd = raw.lastIndexOf('}')
  const sentence = jsonStart > 0 ? raw.substring(0, jsonStart).trim() : raw.trim()
  const jsonStr = jsonStart >= 0 ? raw.substring(jsonStart, jsonEnd + 1) : '{}'

  let filters = { category: '', max_price: null as number | null, keywords: [] as string[], listing_type_preference: 'any' }
  try {
    const parsed = JSON.parse(jsonStr)
    filters = {
      category: parsed.category || '',
      max_price: parsed.max_price || null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      listing_type_preference: parsed.listing_type_preference || 'any',
    }
  } catch {
    // If JSON parsing fails, extract keywords from user query
    const words = userQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    filters = { category: '', max_price: null, keywords: words.slice(0, 3), listing_type_preference: 'any' }
  }

  return { sentence: sentence || 'Here are items matching your search!', filters }
}

// ---- Prompt #7: Listing Quality Score ----
export async function callListingQuality(
  name: string,
  photoCount: number,
  descWords: number,
  hasSizeChart: boolean,
  returnRate: number,
  category: string
): Promise<{
  score: number
  main_issues: string[]
  top_fix: string
  returns_preventable: number
}> {
  const prompt = `Seller listing — Product: ${name}. Photo count: ${photoCount}. Description word count: ${descWords}. Has size chart: ${hasSizeChart}. Return rate: ${returnRate}%. Category: ${category}.
Score this listing 0-100 for quality and likelihood of preventing future returns. Return ONLY this JSON:
{"score":0,"main_issues":["string"],"top_fix":"string","returns_preventable":0}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}

// ---- Prompt #8: Exchange Match Finder ----
export async function callExchangeMatch(
  newListing: { title: string; condition_grade: string; category: string },
  exchangeRequests: Array<{ id: string; have_item: string; want_item: string }>
): Promise<{
  has_match: boolean
  matched_request_id: string | null
  match_reasoning: string
}> {
  const prompt = `A new listing was just posted: "${newListing.title}" (condition: ${newListing.condition_grade}, category: ${newListing.category}).
Here are open exchange requests: ${JSON.stringify(exchangeRequests)}.
Does this new listing match any request's "want_item"? Return ONLY this JSON:
{"has_match":false,"matched_request_id":null,"match_reasoning":"string"}`

  const raw = await groqCall('llama-3.3-70b-versatile', [
    { role: 'system', content: 'You are a JSON-only API. Output valid JSON only.' },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw)
}
