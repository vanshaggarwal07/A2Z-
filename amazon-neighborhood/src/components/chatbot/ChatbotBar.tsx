import React, { useState } from 'react'
import { callChatbot } from '../../lib/groq'
import { Button } from '../ui/Button'

interface ChatbotBarProps {
  onResults: (filters: {
    category: string
    max_price: number | null
    keywords: string[]
    listing_type_preference: string
  }, sentence: string) => void
  vocalForLocal?: boolean
}

const DEMO_RESPONSES: Record<string, { sentence: string; filters: { category: string; max_price: number | null; keywords: string[]; listing_type_preference: string } }> = {
  'baby monitor': {
    sentence: "Found some baby monitors near you that fit your budget! ",
    filters: { category: 'baby', max_price: 1500, keywords: ['baby monitor', 'monitor'], listing_type_preference: 'any' }
  },
  'baby monitor under': {
    sentence: "Found 2 baby monitors near you under ₹1,500 ",
    filters: { category: 'baby', max_price: 1500, keywords: ['baby monitor'], listing_type_preference: 'any' }
  },
  'shoes': {
    sentence: "Great — here are the shoes listed nearby! ",
    filters: { category: 'fashion', max_price: null, keywords: ['shoes'], listing_type_preference: 'any' }
  },
  'electronics': {
    sentence: "Here are the electronics available in your neighborhood ",
    filters: { category: 'electronics', max_price: null, keywords: [], listing_type_preference: 'any' }
  },
  'exchange': {
    sentence: "Here are items available for exchange near you — no money needed! ",
    filters: { category: '', max_price: null, keywords: [], listing_type_preference: 'exchange' }
  },
  'donate': {
    sentence: "These items are available for free in your neighborhood ",
    filters: { category: '', max_price: null, keywords: [], listing_type_preference: 'donate' }
  },
  'local': {
    sentence: "Here are items made by local artisans near you",
    filters: { category: '', max_price: null, keywords: [], listing_type_preference: 'any' }
  }
}

function matchDemoResponse(query: string) {
  const lower = query.toLowerCase()
  for (const [key, val] of Object.entries(DEMO_RESPONSES)) {
    if (lower.includes(key)) return val
  }
  return null
}

export function ChatbotBar({ onResults, vocalForLocal = false }: ChatbotBarProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSentence, setLastSentence] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)

    // Check demo cache first
    const demo = matchDemoResponse(query)
    if (demo) {
      await new Promise((r) => setTimeout(r, 600)) // brief spinner for "AI feel"
      setLastSentence(demo.sentence)
      onResults(demo.filters, demo.sentence)
      setLoading(false)
      return
    }

    try {
      const { sentence, filters } = await callChatbot(query, vocalForLocal)
      setLastSentence(sentence)
      onResults(filters, sentence)
    } catch {
      const fallbackSentence = "Here are some items near you that might match what you're looking for "
      setLastSentence(fallbackSentence)
      onResults({ category: '', max_price: null, keywords: [query], listing_type_preference: 'any' }, fallbackSentence)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setQuery('')
    setLastSentence('')
    onResults({ category: '', max_price: null, keywords: [], listing_type_preference: 'any' }, '')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Tell me what you need… e.g. "baby monitor under ₹1500 near me"'
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] focus:border-transparent"
            aria-label="Search for items using natural language"
            disabled={loading}
          />
        </div>
        <Button type="submit" variant="primary" size="md" loading={loading} disabled={!query.trim()}>
          Find
        </Button>
        {lastSentence && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-gray-600 px-2"
            aria-label="Clear search"
          >
            
          </button>
        )}
      </form>

      {lastSentence && (
        <p className="mt-3 text-sm text-[#0a6245] font-medium">
          {lastSentence}
        </p>
      )}
    </div>
  )
}
