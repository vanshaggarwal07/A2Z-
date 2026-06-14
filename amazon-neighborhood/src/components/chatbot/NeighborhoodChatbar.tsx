import React, { useState, useRef, useEffect } from 'react'
import { callChatbot } from '../../lib/groq'
import { startListening, speak, hasSpeechRecognition } from '../../lib/voice'

type ChatFilters = {
  category: string
  max_price: number | null
  keywords: string[]
  listing_type_preference: string
}

interface Props {
  onResults: (filters: ChatFilters, sentence: string) => void
  vocalForLocal?: boolean
}

// ── Expanded keyword map — handles natural Hindi-English queries ──────────────
const DEMO: Record<string, { sentence: string; filters: ChatFilters }> = {
  'baby monitor':     { sentence: 'Found 2 baby monitors near you under ₹1,500', filters: { category: 'baby',        max_price: 1500, keywords: ['baby monitor'],  listing_type_preference: 'any'      } },
  'earphone':         { sentence: 'Here are earphones available near you',        filters: { category: 'electronics', max_price: null, keywords: ['earphone'],      listing_type_preference: 'any'      } },
  'headphone':        { sentence: 'Here are headphones listed nearby',             filters: { category: 'electronics', max_price: null, keywords: ['earphone'],      listing_type_preference: 'any'      } },
  'shoe':             { sentence: 'Here are the shoes listed nearby',              filters: { category: 'fashion',     max_price: null, keywords: ['shoes'],         listing_type_preference: 'any'      } },
  'kurta':            { sentence: 'Here are kurtas available near you',            filters: { category: 'fashion',     max_price: null, keywords: ['kurta'],         listing_type_preference: 'any'      } },
  'electronics':      { sentence: 'Here are electronics in your neighbourhood',   filters: { category: 'electronics', max_price: null, keywords: [],                listing_type_preference: 'any'      } },
  'appliance':        { sentence: 'Here are appliances listed nearby',             filters: { category: 'appliances',  max_price: null, keywords: [],                listing_type_preference: 'any'      } },
  'mixer':            { sentence: 'Here are mixers available near you',            filters: { category: 'appliances',  max_price: null, keywords: ['mixer'],         listing_type_preference: 'any'      } },
  'tablet':           { sentence: 'Here are tablets near you',                    filters: { category: 'electronics', max_price: null, keywords: ['tablet'],        listing_type_preference: 'any'      } },
  'router':           { sentence: 'Here are WiFi routers near you',                filters: { category: 'electronics', max_price: null, keywords: ['router'],        listing_type_preference: 'any'      } },
  'stroller':         { sentence: 'Here are strollers near you',                   filters: { category: 'baby',        max_price: null, keywords: ['stroller'],      listing_type_preference: 'any'      } },
  'toy':              { sentence: 'Here are toys available near you',              filters: { category: 'baby',        max_price: null, keywords: ['toy'],           listing_type_preference: 'any'      } },
  'exchange':         { sentence: 'Here are items available for exchange',         filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'exchange' } },
  'swap':             { sentence: 'Here are items available for swap/exchange',    filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'exchange' } },
  'donate':           { sentence: 'These items are free in your neighbourhood',    filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'donate'   } },
  'free':             { sentence: 'Here are free items near you',                  filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'donate'   } },
  'local':            { sentence: 'Here are items made by local artisans',         filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'any'      } },
  'artisan':          { sentence: 'Here are local artisan products near you',      filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'any'      } },
  'handmade':         { sentence: 'Here are handmade items near you',              filters: { category: '',            max_price: null, keywords: [],                listing_type_preference: 'any'      } },
  'under 500':        { sentence: 'Showing items under ₹500 near you',             filters: { category: '',            max_price: 500,  keywords: [],                listing_type_preference: 'any'      } },
  'under 1000':       { sentence: 'Showing items under ₹1,000 near you',           filters: { category: '',            max_price: 1000, keywords: [],                listing_type_preference: 'any'      } },
  'under 1500':       { sentence: 'Showing items under ₹1,500 near you',           filters: { category: '',            max_price: 1500, keywords: [],                listing_type_preference: 'any'      } },
  'under 2000':       { sentence: 'Showing items under ₹2,000 near you',           filters: { category: '',            max_price: 2000, keywords: [],                listing_type_preference: 'any'      } },
  'under 5000':       { sentence: 'Showing items under ₹5,000 near you',           filters: { category: '',            max_price: 5000, keywords: [],                listing_type_preference: 'any'      } },
}

function matchDemo(q: string): { sentence: string; filters: ChatFilters } | null {
  const lower = q.toLowerCase()
  
  // Extract price constraint first
  let maxPrice: number | null = null
  const priceMatch = lower.match(/under\s*(?:₹|rs\.?|inr)?\s*(\d+)/)
  if (priceMatch) maxPrice = parseInt(priceMatch[1], 10)
  
  // Find keyword match (ignoring the price part)
  const queryWithoutPrice = lower.replace(/under\s*(?:₹|rs\.?|inr)?\s*\d+/, '').trim()
  
  // Longest keyword match first
  const keys = Object.keys(DEMO).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    // Skip pure price entries if we already have a keyword
    if (k.startsWith('under ') && queryWithoutPrice.length > 0) continue
    if (lower.includes(k) || queryWithoutPrice.includes(k)) {
      const result = { ...DEMO[k] }
      // Override max_price if user specified one
      if (maxPrice !== null) {
        result.filters = { ...result.filters, max_price: maxPrice }
        result.sentence = result.sentence.replace(/near you.*$/, `near you under ₹${maxPrice.toLocaleString('en-IN')}`)
      }
      return result
    }
  }
  
  // If only price constraint with no keyword match
  if (maxPrice !== null) {
    return {
      sentence: `Showing items under ₹${maxPrice.toLocaleString('en-IN')} near you`,
      filters: { category: '', max_price: maxPrice, keywords: queryWithoutPrice ? [queryWithoutPrice] : [], listing_type_preference: 'any' }
    }
  }
  
  return null
}

type VoiceStatus = 'idle' | 'listening' | 'stopped' | 'error'

export function NeighborhoodChatbar({ onResults, vocalForLocal = false }: Props) {
  const [query, setQuery]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [voiceStatus, setVoice]   = useState<VoiceStatus>('idle')
  const [lastSentence, setLast]   = useState('')
  const stopRef                   = useRef<(() => void) | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const speechSupported           = hasSpeechRecognition()

  // Auto-submit when voice transcript arrives
  const handleTranscript = (text: string) => {
    setQuery(text)
    // Short delay so user sees what was transcribed
    setTimeout(() => submitQuery(text), 400)
  }

  const toggleVoice = () => {
    if (voiceStatus === 'listening') {
      stopRef.current?.()
      setVoice('idle')
      return
    }
    setVoice('listening')
    stopRef.current = startListening(
      handleTranscript,
      s => setVoice(s === 'listening' ? 'listening' : 'idle')
    )
  }

  const submitQuery = async (q: string) => {
    const text = q.trim()
    if (!text) return
    setLoading(true)

    const demo = matchDemo(text)
    if (demo) {
      await new Promise(r => setTimeout(r, 500))
      setLast(demo.sentence)
      onResults(demo.filters, demo.sentence)
      speak(demo.sentence)   // ElevenLabs TTS
      setLoading(false)
      return
    }

    try {
      const { sentence, filters } = await callChatbot(text, vocalForLocal)
      setLast(sentence)
      onResults(filters, sentence)
      speak(sentence)
    } catch {
      const fallback = 'Here are the closest matches to your search'
      setLast(fallback)
      onResults({ category: '', max_price: null, keywords: [text], listing_type_preference: 'any' }, fallback)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitQuery(query)
  }

  // Cleanup voice on unmount
  useEffect(() => () => stopRef.current?.(), [])

  return (
    <div className="mb-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white rounded-lg overflow-hidden shadow-sm"
        role="search"
      >
        {/* Sparkle / AI icon */}
        <div className="pl-4 pr-2 flex items-center flex-shrink-0">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tell me what you need — e.g. 'baby monitor under ₹1500 near me'"
          className="flex-1 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-white"
          aria-label="Describe what you are looking for"
          disabled={loading}
        />

        {/* Voice button — always show, gracefully handle if not supported */}
        <button
          type="button"
          onClick={toggleVoice}
          className={`px-3 py-3.5 transition-colors flex-shrink-0 ${
            voiceStatus === 'listening'
              ? 'text-[#CC0C39] animate-pulse'
              : speechSupported
                ? 'text-gray-400 hover:text-gray-600'
                : 'text-gray-300 cursor-not-allowed'
          }`}
          aria-label={voiceStatus === 'listening' ? 'Stop voice input' : 'Start voice input'}
          title={
            voiceStatus === 'listening'
              ? 'Listening… click to stop'
              : speechSupported
                ? 'Speak your search'
                : 'Voice input not supported in this browser'
          }
          disabled={!speechSupported}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {voiceStatus === 'listening' ? (
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
            ) : (
              <>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </>
            )}
          </svg>
        </button>

        {/* Ask button */}
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#e68900] disabled:opacity-50 text-black font-semibold text-sm px-5 py-3.5 transition-colors flex-shrink-0"
          aria-label="Ask AI assistant"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          )}
          Ask
        </button>
      </form>

      {/* Voice status hint */}
      {voiceStatus === 'listening' && (
        <p className="text-xs text-white/80 mt-1.5 pl-1 animate-pulse">
          Listening… speak your query
        </p>
      )}

      {/* AI response sentence */}
      {lastSentence && (
        <p className="text-xs text-white/80 mt-1.5 pl-1">{lastSentence}</p>
      )}
    </div>
  )
}
