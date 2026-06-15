import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import type { CreditsEntry } from '../hooks/useCredits'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

export interface CartItem {
  id: string
  title: string
  price: number
  image: string
  condition_grade: string
  seller_name: string
  quantity: number
}

export interface WishlistItem {
  id: string
  title: string
  asking_price: number
  original_price: number
  image: string
  condition_grade: string
  distance_km: number
}

export interface OrderItem {
  id: string
  title: string
  price: number
  image: string
  quantity: number
  condition_grade: string
  seller_name: string
}

export interface Order {
  id: string
  date: string
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Returned'
  items: OrderItem[]
  total: number
  deliveredDate?: string
}

interface AppContextValue {
  // Cart
  cart: CartItem[]
  cartCount: number
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  clearCart: () => void

  // Wishlist
  wishlist: WishlistItem[]
  isWishlisted: (id: string) => boolean
  toggleWishlist: (item: WishlistItem) => void

  // Orders
  orders: Order[]
  addOrder: (order: Omit<Order, 'id' | 'date'>) => void

  // Credits (shared across app)
  creditsLog: CreditsEntry[]
  totalCredits: number
  totalCO2: number
  itemsResold: number
  itemsBought: number
  treesEquivalent: number
  addCredits: (entry: Omit<CreditsEntry, 'id' | 'date'>) => void
}

// ── localStorage helpers (fallback for guests) ────────────────────────────────

function getUserStorageKey(userId: string | null, key: string): string {
  const prefix = userId || 'guest'
  return `amazon_nh_${prefix}_${key}`
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T
  } catch { /* ignore parse errors */ }
  return fallback
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded or private mode — ignore */ }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [cart, setCart]         = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [orders, setOrders]    = useState<Order[]>([])
  const [creditsLog, setCreditsLog] = useState<CreditsEntry[]>([])
  const [initialized, setInitialized] = useState(false)
  const isSyncing = useRef(false)

  // ── Load user data from Supabase (or fallback to localStorage for guests) ──
  useEffect(() => {
    let cancelled = false

    async function loadUserData() {
      if (!userId) {
        // Guest user — load from localStorage only
        const cartKey = getUserStorageKey(null, 'cart')
        const wishlistKey = getUserStorageKey(null, 'wishlist')
        const ordersKey = getUserStorageKey(null, 'orders')
        const creditsKey = getUserStorageKey(null, 'credits')
        setCart(loadFromStorage(cartKey, []))
        setWishlist(loadFromStorage(wishlistKey, []))
        setOrders(loadFromStorage(ordersKey, []))
        setCreditsLog(loadFromStorage(creditsKey, []))
        setInitialized(true)
        return
      }

      isSyncing.current = true

      // Load credits log from Supabase
      const { data: creditsData } = await supabase
        .from('green_credits_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!cancelled && creditsData && creditsData.length > 0) {
        const entries: CreditsEntry[] = creditsData.map(row => ({
          id: row.id,
          date: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          action: row.action,
          credits: row.credits,
          co2_saved_kg: row.co2_saved_kg || 0,
          listing_title: row.listing_title || undefined,
        }))
        setCreditsLog(entries)
        saveToStorage(getUserStorageKey(userId, 'credits'), entries)
      } else if (!cancelled) {
        // Fallback: check localStorage for previously stored data
        const localCredits = loadFromStorage<CreditsEntry[]>(getUserStorageKey(userId, 'credits'), [])
        if (localCredits.length > 0) {
          setCreditsLog(localCredits)
          // Migrate localStorage credits to Supabase
          for (const entry of localCredits) {
            await supabase.from('green_credits_log').upsert({
              id: entry.id.length > 20 ? undefined : undefined, // Let Supabase generate UUID
              user_id: userId,
              action: entry.action,
              credits: entry.credits,
              co2_saved_kg: entry.co2_saved_kg,
              listing_title: entry.listing_title || null,
            }, { onConflict: 'id', ignoreDuplicates: true }).select()
          }
        } else {
          setCreditsLog([])
        }
      }

      // Load orders from Supabase
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (!cancelled && ordersData && ordersData.length > 0) {
        const loadedOrders: Order[] = ordersData.map(row => ({
          id: row.order_number || row.id,
          date: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          status: (row.status === 'confirmed' ? 'Processing' :
                   row.status === 'shipped' ? 'Shipped' :
                   row.status === 'delivered' ? 'Delivered' :
                   row.status === 'returned' ? 'Returned' : 'Processing') as Order['status'],
          items: [{
            id: row.listing_id || row.id,
            title: row.product_title,
            price: Number(row.unit_price),
            image: row.product_image || '',
            quantity: row.quantity || 1,
            condition_grade: 'Good',
            seller_name: '',
          }],
          total: Number(row.total_amount),
          deliveredDate: row.delivered_at?.split('T')[0] || undefined,
        }))
        setOrders(loadedOrders)
        saveToStorage(getUserStorageKey(userId, 'orders'), loadedOrders)
      } else if (!cancelled) {
        const localOrders = loadFromStorage<Order[]>(getUserStorageKey(userId, 'orders'), [])
        setOrders(localOrders)
      }

      // Load cart from localStorage (cart is ephemeral, Supabase optional)
      if (!cancelled) {
        setCart(loadFromStorage(getUserStorageKey(userId, 'cart'), []))
        setWishlist(loadFromStorage(getUserStorageKey(userId, 'wishlist'), []))
      }

      if (!cancelled) {
        isSyncing.current = false
        setInitialized(true)
      }
    }

    setInitialized(false)
    loadUserData()
    return () => { cancelled = true }
  }, [userId])

  // ── Persist cart/wishlist to localStorage on change ──
  useEffect(() => {
    if (!initialized) return
    saveToStorage(getUserStorageKey(userId, 'cart'), cart)
  }, [cart, userId, initialized])

  useEffect(() => {
    if (!initialized) return
    saveToStorage(getUserStorageKey(userId, 'wishlist'), wishlist)
  }, [wishlist, userId, initialized])

  useEffect(() => {
    if (!initialized) return
    saveToStorage(getUserStorageKey(userId, 'orders'), orders)
  }, [orders, userId, initialized])

  useEffect(() => {
    if (!initialized) return
    saveToStorage(getUserStorageKey(userId, 'credits'), creditsLog)
  }, [creditsLog, userId, initialized])

  // ── Derived credits values ──
  const totalCredits    = Math.max(0, creditsLog.reduce((s, e) => s + e.credits, 0))
  const totalCO2        = creditsLog.reduce((s, e) => s + e.co2_saved_kg, 0)
  const itemsResold     = creditsLog.filter(e => e.credits > 0 && e.action.startsWith('Sold')).length
  const itemsBought     = creditsLog.filter(e => e.credits > 0 && e.action.startsWith('Bought')).length
  const treesEquivalent = Math.round(totalCO2 / 21)

  // ── Cart ──
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [{ ...item, quantity: 1 }, ...prev]
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  // ── Orders — persist to Supabase ──
  const addOrder = useCallback((order: Omit<Order, 'id' | 'date'>) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    }
    setOrders(prev => [newOrder, ...prev])

    // Persist to Supabase if logged in
    if (userId && order.items.length > 0) {
      const item = order.items[0]
      supabase.from('orders').insert({
        buyer_id: userId,
        product_title: item.title,
        product_image: item.image || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: order.total,
        status: 'confirmed',
      }).then(() => {})
    }
  }, [userId])

  // ── Wishlist ──
  const isWishlisted = useCallback((id: string) => wishlist.some(w => w.id === id), [wishlist])

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist(prev =>
      prev.some(w => w.id === item.id)
        ? prev.filter(w => w.id !== item.id)
        : [item, ...prev]
    )
  }, [])

  // ── Credits — persist to Supabase ──
  const addCredits = useCallback((entry: Omit<CreditsEntry, 'id' | 'date'>) => {
    setCreditsLog(prev => {
      // Prevent spending more credits than available
      let adjustedEntry = entry
      if (entry.credits < 0) {
        const currentTotal = Math.max(0, prev.reduce((s, e) => s + e.credits, 0))
        if (currentTotal + entry.credits < 0) {
          adjustedEntry = { ...entry, credits: -currentTotal }
        }
      }

      const newEntry: CreditsEntry = {
        ...adjustedEntry,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
      }

      // Persist to Supabase if logged in
      if (userId) {
        supabase.from('green_credits_log').insert({
          user_id: userId,
          action: newEntry.action,
          credits: newEntry.credits,
          co2_saved_kg: newEntry.co2_saved_kg,
          listing_title: newEntry.listing_title || null,
        }).then(({ error }) => {
          if (error) console.warn('Failed to save credit to Supabase:', error.message)
        })

        // Also update the profile's green_credits total
        const newTotal = Math.max(0, prev.reduce((s, e) => s + e.credits, 0) + newEntry.credits)
        supabase.from('profiles').update({ green_credits: newTotal }).eq('id', userId).then(() => {})
      }

      return [newEntry, ...prev]
    })
  }, [userId])

  return (
    <AppContext.Provider value={{
      cart, cartCount, addToCart, removeFromCart, clearCart,
      wishlist, isWishlisted, toggleWishlist,
      orders, addOrder,
      creditsLog, totalCredits, totalCO2, itemsResold, itemsBought, treesEquivalent, addCredits,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside <AppProvider>')
  return ctx
}
