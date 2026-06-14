import { useState, useCallback } from 'react'

export interface CreditsEntry {
  id: string
  date: string
  action: string
  credits: number
  co2_saved_kg: number
  listing_title?: string
}

const INITIAL_LOG: CreditsEntry[] = [
  {
    id: '1',
    date: '2026-01-12',
    action: 'Sold baby stroller',
    credits: 65,
    co2_saved_kg: 3.5,
    listing_title: 'R for Rabbit Lollipop Stroller',
  },
  {
    id: '2',
    date: '2026-02-20',
    action: 'Bought earphones (second-hand)',
    credits: 30,
    co2_saved_kg: 1.2,
    listing_title: 'boAt Bassheads 100',
  },
  {
    id: '3',
    date: '2026-03-05',
    action: 'Donated toys set',
    credits: 25,
    co2_saved_kg: 0.9,
    listing_title: 'Educational Toys Set',
  },
  {
    id: '4',
    date: '2026-04-18',
    action: 'Listed mixer grinder',
    credits: 35,
    co2_saved_kg: 2.8,
    listing_title: 'Bajaj Mixer Grinder 750W',
  },
  {
    id: '5',
    date: '2026-05-10',
    action: 'Boost listing used',
    credits: -100,
    co2_saved_kg: 0,
    listing_title: 'boAt Bassheads 100',
  },
]

export function useCredits() {
  const [log, setLog] = useState<CreditsEntry[]>(INITIAL_LOG)

  const totalCredits = Math.max(0, log.reduce((sum, e) => sum + e.credits, 0))
  const totalCO2 = log.reduce((sum, e) => sum + e.co2_saved_kg, 0)
  const itemsResold = log.filter((e) => e.credits > 0 && e.action.startsWith('Sold')).length
  const itemsBought = log.filter((e) => e.credits > 0 && e.action.startsWith('Bought')).length
  const treesEquivalent = Math.round(totalCO2 / 21) // 1 tree absorbs ~21kg CO2/year

  const addCredits = useCallback(
    (entry: Omit<CreditsEntry, 'id' | 'date'>) => {
      setLog((prev) => [
        {
          ...entry,
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
        },
        ...prev,
      ])
    },
    []
  )

  return {
    log,
    totalCredits,
    totalCO2,
    itemsResold,
    itemsBought,
    treesEquivalent,
    addCredits,
  }
}
