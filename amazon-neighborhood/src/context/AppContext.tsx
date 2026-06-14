import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { CreditsEntry } from '../hooks/useCredits'
import { useAuth } from './AuthContext'

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

// ── localStorage helpers (user-scoped) ────────────────────────────────────────

function getUserStorageKey(userId: string | null, key: string): string {
  // Each user gets their own storage namespace
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

  // State initialized empty — will be populated in useEffect when user changes
  const [cart, setCart]         = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [orders, setOrders]    = useState<Order[]>([])
  const [creditsLog, setCreditsLog] = useState<CreditsEntry[]>([])
  const [initialized, setInitialized] = useState(false)

  // ── Load user data when user changes (login/logout/switch) ──
  useEffect(() => {
    const cartKey = getUserStorageKey(userId, 'cart')
    const wishlistKey = getUserStorageKey(userId, 'wishlist')
    const ordersKey = getUserStorageKey(userId, 'orders')
    const creditsKey = getUserStorageKey(userId, 'credits')

    setCart(loadFromStorage(cartKey, []))
    setWishlist(loadFromStorage(wishlistKey, []))
    setOrders(loadFromStorage(ordersKey, []))
    setCreditsLog(loadFromStorage(creditsKey, []))
    setInitialized(true)
  }, [userId])

  // ── Persist to localStorage on every change (user-scoped) ──
  useEffect(() => {
    if (!initialized) return
    saveToStorage(getUserStorageKey(userId, 'credits'), creditsLog)
  }, [creditsLog, userId, initialized])

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

  // ── Derived credits values (credits cannot go below zero) ──
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

  // ── Orders ──
  const addOrder = useCallback((order: Omit<Order, 'id' | 'date'>) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    }
    setOrders(prev => [newOrder, ...prev])
  }, [])

  // ── Wishlist ──
  const isWishlisted = useCallback((id: string) => wishlist.some(w => w.id === id), [wishlist])

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist(prev =>
      prev.some(w => w.id === item.id)
        ? prev.filter(w => w.id !== item.id)
        : [item, ...prev]
    )
  }, [])

  // ── Credits ──
  const addCredits = useCallback((entry: Omit<CreditsEntry, 'id' | 'date'>) => {
    setCreditsLog(prev => {
      // Prevent spending more credits than available
      if (entry.credits < 0) {
        const currentTotal = Math.max(0, prev.reduce((s, e) => s + e.credits, 0))
        if (currentTotal + entry.credits < 0) {
          entry = { ...entry, credits: -currentTotal }
        }
      }
      return [{
        ...entry,
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
      }, ...prev]
    })
  }, [])

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
