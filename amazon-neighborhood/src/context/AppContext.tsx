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
  const loadingRef = useRef(false)

  // ══════════════════════════════════════════════════════════════════════════════
  // LOAD ALL USER DATA FROM SUPABASE ON LOGIN
  // ══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false

    async function loadUserData() {
      if (!userId) {
        // No user logged in — reset everything
        setCart([])
        setWishlist([])
        setOrders([])
        setCreditsLog([])
        setInitialized(true)
        return
      }

      loadingRef.current = true

      // ── Load Credits Log ──
      const { data: creditsData } = await supabase
        .from('green_credits_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!cancelled) {
        const entries: CreditsEntry[] = (creditsData || []).map(row => ({
          id: row.id,
          date: row.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          action: row.action,
          credits: row.credits,
          co2_saved_kg: row.co2_saved_kg || 0,
          listing_title: row.listing_title || undefined,
        }))
        setCreditsLog(entries)
      }

      // ── Load Orders ──
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (!cancelled && ordersData) {
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
      }

      // ── Load Cart from Supabase ──
      const { data: cartData } = await supabase
        .from('cart_items')
        .select('*, listings(title, asking_price, images, condition_grade, seller_name)')
        .eq('user_id', userId)

      if (!cancelled && cartData) {
        const loadedCart: CartItem[] = cartData
          .filter(row => row.listings)
          .map(row => {
            const listing = row.listings as any
            return {
              id: row.listing_id,
              title: listing.title || '',
              price: Number(listing.asking_price) || 0,
              image: listing.images?.[0] || '',
              condition_grade: listing.condition_grade || 'Good',
              seller_name: listing.seller_name || '',
              quantity: row.quantity || 1,
            }
          })
        setCart(loadedCart)
      }

      // ── Load Wishlist from Supabase ──
      const { data: wishlistData } = await supabase
        .from('wishlist_items')
        .select('*, listings(title, asking_price, original_price, images, condition_grade)')
        .eq('user_id', userId)

      if (!cancelled && wishlistData) {
        const loadedWishlist: WishlistItem[] = wishlistData
          .filter(row => row.listings)
          .map(row => {
            const listing = row.listings as any
            return {
              id: row.listing_id,
              title: listing.title || '',
              asking_price: Number(listing.asking_price) || 0,
              original_price: Number(listing.original_price) || 0,
              image: listing.images?.[0] || '',
              condition_grade: listing.condition_grade || 'Good',
              distance_km: 0,
            }
          })
        setWishlist(loadedWishlist)
      }

      if (!cancelled) {
        loadingRef.current = false
        setInitialized(true)
      }
    }

    setInitialized(false)
    loadUserData()
    return () => { cancelled = true }
  }, [userId])

  // ══════════════════════════════════════════════════════════════════════════════
  // DERIVED CREDITS VALUES
  // ══════════════════════════════════════════════════════════════════════════════
  const totalCredits    = Math.max(0, creditsLog.reduce((s, e) => s + e.credits, 0))
  const totalCO2        = creditsLog.reduce((s, e) => s + e.co2_saved_kg, 0)
  const itemsResold     = creditsLog.filter(e => e.credits > 0 && e.action.startsWith('Sold')).length
  const itemsBought     = creditsLog.filter(e => e.credits > 0 && e.action.startsWith('Bought')).length
  const treesEquivalent = Math.round(totalCO2 / 21)

  // ══════════════════════════════════════════════════════════════════════════════
  // CART — fully Supabase-backed
  // ══════════════════════════════════════════════════════════════════════════════
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0)

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [{ ...item, quantity: 1 }, ...prev]
    })

    if (userId) {
      // Upsert to Supabase cart_items table
      supabase.from('cart_items')
        .upsert(
          { user_id: userId, listing_id: item.id, quantity: 1 },
          { onConflict: 'user_id,listing_id' }
        )
        .then(({ error }) => {
          if (error) console.warn('Cart save failed:', error.message)
        })
    }
  }, [userId])

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(c => c.id !== id))

    if (userId) {
      supabase.from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('listing_id', id)
        .then(() => {})
    }
  }, [userId])

  const clearCart = useCallback(() => {
    setCart([])

    if (userId) {
      supabase.from('cart_items')
        .delete()
        .eq('user_id', userId)
        .then(() => {})
    }
  }, [userId])

  // ══════════════════════════════════════════════════════════════════════════════
  // ORDERS — fully Supabase-backed
  // ══════════════════════════════════════════════════════════════════════════════
  const addOrder = useCallback((order: Omit<Order, 'id' | 'date'>) => {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    }
    setOrders(prev => [newOrder, ...prev])

    // Persist every item to Supabase
    if (userId) {
      for (const item of order.items) {
        supabase.from('orders').insert({
          buyer_id: userId,
          product_title: item.title,
          product_image: item.image || null,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: order.total,
          status: 'confirmed',
        }).then(({ error }) => {
          if (error) console.warn('Order save failed:', error.message)
        })
      }
    }
  }, [userId])

  // ══════════════════════════════════════════════════════════════════════════════
  // WISHLIST — fully Supabase-backed
  // ══════════════════════════════════════════════════════════════════════════════
  const isWishlisted = useCallback((id: string) => wishlist.some(w => w.id === id), [wishlist])

  const toggleWishlist = useCallback((item: WishlistItem) => {
    const exists = wishlist.some(w => w.id === item.id)

    if (exists) {
      setWishlist(prev => prev.filter(w => w.id !== item.id))
      if (userId) {
        supabase.from('wishlist_items')
          .delete()
          .eq('user_id', userId)
          .eq('listing_id', item.id)
          .then(() => {})
      }
    } else {
      setWishlist(prev => [item, ...prev])
      if (userId) {
        supabase.from('wishlist_items')
          .insert({ user_id: userId, listing_id: item.id })
          .then(({ error }) => {
            if (error) console.warn('Wishlist save failed:', error.message)
          })
      }
    }
  }, [userId, wishlist])

  // ══════════════════════════════════════════════════════════════════════════════
  // CREDITS — fully Supabase-backed
  // ══════════════════════════════════════════════════════════════════════════════
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
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
      }

      // Persist to Supabase
      if (userId) {
        supabase.from('green_credits_log').insert({
          user_id: userId,
          action: newEntry.action,
          credits: newEntry.credits,
          co2_saved_kg: newEntry.co2_saved_kg,
          listing_title: newEntry.listing_title || null,
        }).then(({ error }) => {
          if (error) console.warn('Credits save failed:', error.message)
        })

        // Update profile total (the trigger in schema.sql does this too, but let's be safe)
        const newTotal = Math.max(0, prev.reduce((s, e) => s + e.credits, 0) + newEntry.credits)
        supabase.from('profiles')
          .update({ green_credits: newTotal })
          .eq('id', userId)
          .then(() => {})
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
