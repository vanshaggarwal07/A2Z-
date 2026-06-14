/**
 * Seller Chatbot — Trained on synthetic data (SMOTE-balanced)
 * 
 * Uses the seller_chatbot_training_data.json as a knowledge base.
 * Matches user questions to the closest training example based on:
 *   - Product category
 *   - Condition grade
 *   - Question intent classification
 * 
 * Falls back to Groq API with few-shot examples from the training data
 * for questions that don't match the knowledge base.
 */

import trainingData from '../data/seller_chatbot_training.json'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'

interface TrainingEntry {
  id: number
  category: string
  product: string
  condition_grade: string
  age_years: number
  reason_code: string
  qa: Array<{ question: string; answer: string }>
}

const TRAINING_ENTRIES = (trainingData as { training_data: TrainingEntry[] }).training_data

// ── Intent Classification ──────────────────────────────────────────────────

type QuestionIntent =
  | 'what_is_product'
  | 'fault_defect'
  | 'why_selling'
  | 'product_condition'
  | 'age_old'
  | 'working_status'
  | 'missing_parts'
  | 'original_price'
  | 'trust'
  | 'negotiate'
  | 'delivery'
  | 'general'

const INTENT_PATTERNS: Array<{ intent: QuestionIntent; patterns: RegExp[] }> = [
  { intent: 'what_is_product', patterns: [/what is this/i, /what('s| is) this product/i, /tell me about/i, /describe/i, /what am i buying/i] },
  { intent: 'fault_defect', patterns: [/fault/i, /defect/i, /damage/i, /broken/i, /issue/i, /problem/i, /wrong with/i, /scratch/i, /dent/i] },
  { intent: 'why_selling', patterns: [/why (are you |r u )?sell/i, /reason for sell/i, /why (are you )?getting rid/i, /why listing/i] },
  { intent: 'product_condition', patterns: [/condition/i, /quality/i, /state of/i, /how (is|good|bad)/i, /grade/i] },
  { intent: 'age_old', patterns: [/how old/i, /age/i, /when (did you |was it )?bought/i, /how long/i, /years/i, /months old/i] },
  { intent: 'working_status', patterns: [/still work/i, /functional/i, /is it working/i, /does it work/i, /runs/i, /operates/i] },
  { intent: 'missing_parts', patterns: [/missing/i, /accessories/i, /include/i, /comes with/i, /original box/i, /charger/i, /parts/i] },
  { intent: 'original_price', patterns: [/original price/i, /mrp/i, /retail price/i, /how much (did you |was it )?pa(y|id)/i, /cost new/i] },
  { intent: 'trust', patterns: [/trust/i, /genuine/i, /authentic/i, /fake/i, /reliable/i, /safe to buy/i, /verified/i] },
  { intent: 'negotiate', patterns: [/negotiat/i, /discount/i, /lower price/i, /less/i, /reduce/i, /bargain/i, /best price/i, /final price/i] },
  { intent: 'delivery', patterns: [/deliver/i, /ship/i, /pickup/i, /collect/i, /meet/i, /how (do i |will i )?get/i, /when.*arrive/i] },
]

function classifyIntent(question: string): QuestionIntent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(question)) return intent
    }
  }
  return 'general'
}

// Map our intents to the training data's question types
function intentToTrainingQuestion(intent: QuestionIntent): string {
  switch (intent) {
    case 'what_is_product': return 'what is this product'
    case 'fault_defect': return 'whats the fault in this'
    case 'why_selling': return 'why are you selling it'
    case 'product_condition': return 'whats the product condition'
    case 'age_old': return 'how old is this product'
    case 'working_status': return 'is it still working'
    case 'missing_parts': return 'any missing parts'
    case 'original_price': return 'whats the original price'
    case 'trust': return 'why should i trust this'
    case 'negotiate': return 'can i negotiate'
    default: return 'what is this product'
  }
}

// ── Category Matching ──────────────────────────────────────────────────────

function mapCategoryToTraining(category: string): string {
  const lower = category.toLowerCase()
  if (lower.includes('electronic') || lower.includes('phone') || lower.includes('computer')) return 'electronics'
  if (lower.includes('appliance') || lower.includes('kitchen')) return 'appliances'
  if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('shoe')) return 'fashion'
  if (lower.includes('baby') || lower.includes('kid')) return 'baby_kids'
  if (lower.includes('furniture') || lower.includes('chair') || lower.includes('table')) return 'furniture'
  if (lower.includes('book')) return 'books'
  if (lower.includes('sport') || lower.includes('fitness')) return 'sports'
  if (lower.includes('kitchen') || lower.includes('cook')) return 'kitchen'
  return lower
}

// ── Find Best Match from Training Data ─────────────────────────────────────

function findBestTrainingMatch(
  category: string,
  conditionGrade: string,
  questionType: string
): string | null {
  const mappedCategory = mapCategoryToTraining(category)

  // Priority 1: Exact category + grade + question match
  for (const entry of TRAINING_ENTRIES) {
    if (entry.category === mappedCategory && entry.condition_grade === conditionGrade) {
      const qa = entry.qa.find(q => q.question === questionType)
      if (qa) return qa.answer
    }
  }

  // Priority 2: Same category + any grade
  for (const entry of TRAINING_ENTRIES) {
    if (entry.category === mappedCategory) {
      const qa = entry.qa.find(q => q.question === questionType)
      if (qa) return qa.answer
    }
  }

  // Priority 3: Same grade + any category
  for (const entry of TRAINING_ENTRIES) {
    if (entry.condition_grade === conditionGrade) {
      const qa = entry.qa.find(q => q.question === questionType)
      if (qa) return qa.answer
    }
  }

  return null
}

// ── Get Few-Shot Examples for Groq ────────────────────────────────────────

function getFewShotExamples(category: string, conditionGrade: string): Array<{ role: string; content: string }> {
  const mappedCategory = mapCategoryToTraining(category)
  const examples: Array<{ role: string; content: string }> = []

  // Find 2-3 relevant training entries for few-shot
  const relevant = TRAINING_ENTRIES.filter(e =>
    e.category === mappedCategory || e.condition_grade === conditionGrade
  ).slice(0, 2)

  for (const entry of relevant) {
    for (const qa of entry.qa.slice(0, 2)) {
      examples.push(
        { role: 'user', content: qa.question },
        { role: 'assistant', content: qa.answer }
      )
    }
  }

  return examples
}

// ── Main Chatbot Function ─────────────────────────────────────────────────

export interface SellerChatContext {
  productTitle: string
  category: string
  conditionGrade: string
  conditionSummary: string
  defects: string[]
  askingPrice: number
  originalPrice: number
  sellerName: string
  ageYears?: number
}

export async function getSellerChatResponse(
  userMessage: string,
  context: SellerChatContext
): Promise<string> {
  const intent = classifyIntent(userMessage)
  const trainingQuestion = intentToTrainingQuestion(intent)

  // Step 1: Try knowledge base lookup (instant, no API call needed)
  const kbAnswer = findBestTrainingMatch(context.category, context.conditionGrade, trainingQuestion)

  if (kbAnswer && intent !== 'general' && intent !== 'delivery' && intent !== 'negotiate') {
    // Personalize the KB answer with actual product details
    return personalizeAnswer(kbAnswer, context)
  }

  // Step 2: Handle delivery/negotiate/trust with contextual template
  if (intent === 'delivery') {
    return `Amazon will pick up the ${context.productTitle} from me and deliver it directly to your address. Standard delivery timelines apply (2-3 business days). You can track the shipment from your orders page.`
  }

  if (intent === 'negotiate') {
    const discount = Math.round((1 - context.askingPrice / context.originalPrice) * 100)
    return `The asking price is ₹${context.askingPrice.toLocaleString('en-IN')} which is already ${discount}% off the original price of ₹${context.originalPrice.toLocaleString('en-IN')}. This is a fair price for ${context.conditionGrade} condition. I have priced it competitively based on the product's age and condition.`
  }

  if (intent === 'trust') {
    return `This product is Amazon Reselling Verified which means it has been AI-graded for condition. Amazon holds your payment in escrow until you receive and verify the product. You have 48 hours after delivery to raise a dispute if it does not match the listing description.`
  }

  // Step 3: Use Groq API with few-shot examples from training data
  if (GROQ_API_KEY) {
    try {
      const fewShot = getFewShotExamples(context.category, context.conditionGrade)
      const systemPrompt = `You are ${context.sellerName}, selling "${context.productTitle}" on Amazon Neighbourhood.
Product details: Price ₹${context.askingPrice} (original ₹${context.originalPrice}), condition: ${context.conditionGrade}.
Condition summary: ${context.conditionSummary}
Defects: ${context.defects.join(', ') || 'none'}
Category: ${context.category}
Product age: ${context.ageYears ?? 'unknown'} years

Answer the buyer's question naturally and honestly in 2-3 sentences. Be specific about THIS product. Never invent features not mentioned. Amazon handles delivery — no meetups needed.`

      const messages = [
        { role: 'system', content: systemPrompt },
        ...fewShot,
        { role: 'user', content: userMessage },
      ]

      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages,
          temperature: 0.4,
          max_tokens: 200,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return data.choices[0].message.content
      }
    } catch {
      // Fall through to template response
    }
  }

  // Step 4: Template fallback (contextual)
  return getTemplateFallback(userMessage, context, intent)
}

// ── Personalize KB answer with actual product context ──────────────────────

function personalizeAnswer(kbAnswer: string, context: SellerChatContext): string {
  // Replace generic product references with actual product name
  let answer = kbAnswer

  // If the answer mentions a specific product name from training data, replace it
  // with the actual product being discussed
  const genericProducts = ['mixer grinder', 'baby monitor', 'bluetooth earphones', 'running shoes', 'wifi router']
  for (const generic of genericProducts) {
    if (answer.toLowerCase().includes(generic) && !context.productTitle.toLowerCase().includes(generic)) {
      answer = answer.replace(new RegExp(generic, 'gi'), context.productTitle.split(' ').slice(0, 4).join(' '))
    }
  }

  return answer
}

// ── Template Fallback ─────────────────────────────────────────────────────

function getTemplateFallback(
  userMsg: string,
  context: SellerChatContext,
  intent: QuestionIntent
): string {
  switch (intent) {
    case 'what_is_product':
      return `This is a ${context.productTitle}. It is in ${context.conditionGrade} condition. ${context.conditionSummary}`
    case 'fault_defect':
      return context.defects.length > 0
        ? `The known issues are: ${context.defects.join(', ')}. Apart from these, the product functions well.`
        : `There are no defects reported. The product is in ${context.conditionGrade} condition and works as expected.`
    case 'why_selling':
      return `I no longer need this product and it is in good working condition. Rather than let it sit unused, I thought someone else could benefit from it at a fair price.`
    case 'product_condition':
      return `It is in ${context.conditionGrade} condition. ${context.conditionSummary}`
    case 'age_old':
      return context.ageYears
        ? `This product is approximately ${context.ageYears} year${context.ageYears > 1 ? 's' : ''} old. It has been maintained well throughout.`
        : `I have had this product for some time. It has been maintained well and is in ${context.conditionGrade} condition.`
    case 'working_status':
      return `Yes, the product is fully functional. ${context.conditionSummary}`
    case 'missing_parts':
      return `The product comes as listed. Please check the product description for what is included. If you have specific questions about accessories, let me know.`
    case 'original_price':
      return `The original price was ₹${context.originalPrice.toLocaleString('en-IN')}. I am listing it at ₹${context.askingPrice.toLocaleString('en-IN')} which is a ${Math.round((1 - context.askingPrice / context.originalPrice) * 100)}% discount.`
    default:
      return `Thank you for your interest in the ${context.productTitle}. It is in ${context.conditionGrade} condition and priced at ₹${context.askingPrice.toLocaleString('en-IN')}. Feel free to ask me anything specific about this product.`
  }
}
