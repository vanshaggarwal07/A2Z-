/**
 * precache-ai.ts
 * Run once: npm run precache-ai
 * Generates ai_cache.json with real Groq responses for all seed listings.
 * This is the critical demo reliability layer — all seeded content loads
 * instantly from cache without hitting live APIs.
 */

import * as fs from 'fs'
import * as path from 'path'

const GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

const seedListingsPath = path.join(__dirname, '../src/data/seed_listings.json')
const aiCachePath = path.join(__dirname, '../src/data/ai_cache.json')

interface SeedListing {
  id: string
  title: string
  category: string
  condition_grade: string
  original_price: number
  asking_price: number
  purchase_date: string
  defects: string[]
  passport_nodes: Array<{
    owner_alias: string
    owned_from: string
    condition_at_transfer: string
    reason_for_transfer: string
  }>
}

async function groqCall(prompt: string, systemPrompt = 'You are a JSON-only API. Output valid JSON only.'): Promise<string> {
  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log('📦 Loading seed listings...')
  const listings: SeedListing[] = JSON.parse(fs.readFileSync(seedListingsPath, 'utf-8'))

  // Load existing cache if any
  let cache: Record<string, unknown> = {}
  if (fs.existsSync(aiCachePath)) {
    cache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'))
    console.log(`🔄 Found existing cache with ${Object.keys(cache).length} entries`)
  }

  for (const listing of listings) {
    console.log(`\n🔍 Processing: ${listing.title} (${listing.id})`)
    
    if (!cache[listing.id]) {
      cache[listing.id] = {}
    }
    
    const entry = cache[listing.id] as Record<string, unknown>

    // Triage
    if (!entry.triage) {
      try {
        console.log('  → Triage...')
        const triagePrompt = `Product: ${listing.title}. Category: ${listing.category}. Condition grade: ${listing.condition_grade}. Original price: ₹${listing.original_price}. Defects: ${listing.defects.join(', ') || 'none'}.
Decide the optimal disposition. Return ONLY this JSON:
{"recommended":"resell|refurbish|donate|recycle|exchange","reasoning":"one sentence why","resell_value_estimate":0,"refurb_cost_estimate":0,"co2_saved_kg":0.0,"green_credits_earned":0,"cost_benefit_summary":"one sentence"}`
        entry.triage = JSON.parse(await groqCall(triagePrompt))
        await sleep(1000)
      } catch (e) {
        console.error(`  ✗ Triage failed: ${e}`)
      }
    } else {
      console.log('  ✓ Triage (cached)')
    }

    // Pricing
    if (!entry.pricing) {
      try {
        console.log('  → Pricing...')
        const pricePrompt = `Product: ${listing.title}. Original price: ₹${listing.original_price}. Purchased: ${listing.purchase_date}. Condition grade: ${listing.condition_grade}. Category: ${listing.category}.
Suggest a fair resale price in Indian Rupees for a local peer-to-peer sale. Return ONLY this JSON:
{"suggested_price":0,"price_range":{"min":0,"max":0},"reasoning":"one sentence","depreciation_percent":0,"resale_value_1yr":0}`
        entry.pricing = JSON.parse(await groqCall(pricePrompt))
        await sleep(1000)
      } catch (e) {
        console.error(`  ✗ Pricing failed: ${e}`)
      }
    } else {
      console.log('  ✓ Pricing (cached)')
    }

    // Passport narrative
    if (!entry.passport_narrative && listing.passport_nodes.length > 0) {
      try {
        console.log('  → Passport narrative...')
        const passportPrompt = `Product: ${listing.title}. Ownership chain: ${JSON.stringify(listing.passport_nodes)}.
Write a 2-sentence buyer trust summary. Be factual and warm, no marketing fluff. Return ONLY this JSON:
{"narrative":"string"}`
        entry.passport_narrative = JSON.parse(await groqCall(passportPrompt))
        await sleep(1000)
      } catch (e) {
        console.error(`  ✗ Passport narrative failed: ${e}`)
      }
    } else if (entry.passport_narrative) {
      console.log('  ✓ Passport narrative (cached)')
    }

    // Listing quality
    if (!entry.listing_quality) {
      try {
        console.log('  → Listing quality...')
        const qualityPrompt = `Seller listing — Product: ${listing.title}. Photo count: 3. Description word count: 25. Has size chart: false. Return rate: 25%. Category: ${listing.category}.
Score this listing 0-100 for quality and likelihood of preventing future returns. Return ONLY this JSON:
{"score":0,"main_issues":["string"],"top_fix":"string","returns_preventable":0}`
        entry.listing_quality = JSON.parse(await groqCall(qualityPrompt))
        await sleep(1000)
      } catch (e) {
        console.error(`  ✗ Listing quality failed: ${e}`)
      }
    } else {
      console.log('  ✓ Listing quality (cached)')
    }

    // Save after each listing
    fs.writeFileSync(aiCachePath, JSON.stringify(cache, null, 2))
  }

  // Return clustering
  if (!(cache as Record<string, unknown>).seller_returns) {
    try {
      console.log('\n🔍 Generating return clusters...')
      const returnReasons = [
        'Size too small', 'Battery dies quickly', 'Color looks different in photo', 'Item not as described',
        'Runs small, ordered size up', 'Charging issues', 'Doesn\'t fit well', 'Quality not as expected',
        'Incompatible with my device', 'Photo too edited', 'Size chart missing', 'Battery life 2 hours only',
        'Wrong pin type', 'More worn than photos', 'Not compatible with ISP modem', 'Fit uncomfortable',
        'Color different in natural light', 'No instruction manual', 'Missing charger cable', 'Noisy',
      ]
      const clusterPrompt = `Here are return reasons reported by buyers for a seller this month: ${JSON.stringify(returnReasons)}.
Cluster them into 3-5 groups. Return ONLY this JSON:
{"clusters":[{"cluster_name":"string","count":0,"severity":"high|medium|low","example_reasons":["string"],"suggested_fix":"one actionable sentence","estimated_returns_prevented_if_fixed":0}]}`
      ;(cache as Record<string, unknown>).seller_returns = JSON.parse(await groqCall(clusterPrompt))
      fs.writeFileSync(aiCachePath, JSON.stringify(cache, null, 2))
    } catch (e) {
      console.error(`Return clustering failed: ${e}`)
    }
  }

  console.log('\n✅ Pre-cache complete!')
  console.log(`💾 Saved to ${aiCachePath}`)
  console.log(`📊 Cache entries: ${Object.keys(cache).length}`)
}

main().catch(console.error)
