import { useState, useMemo, useEffect, useCallback } from 'react'
import seedListings from '../data/seed_listings.json'
import dummyJsonCache from '../data/dummyjson_cache.json'
import { haversineDistance } from '../lib/haversine'
import { fetchAllListings, type SupabaseListing } from '../lib/listingsService'
import { fetchLiveDummyJson, fetchSerpApiProducts, type RawProduct, type SerpProduct } from '../lib/productDataService'

export interface Listing {
  id: string
  seller_id: string
  seller_name: string
  seller_rating: number
  seller_since: number
  title: string
  category: string
  original_price: number
  asking_price: number
  purchase_date: string
  condition_grade: string
  condition_summary: string
  defects: string[]
  listing_type: string
  exchange_want?: string
  images: string[]
  location_lat: number
  location_lng: number
  location_area: string
  distance_km: number
  status: string
  is_local_artisan: boolean
  serial_number: string
  resale_value_1yr: number
  green_credits: number
  return_rate_key: string | null
  description?: string
  brand?: string
  reviews?: Array<{ rating: number; comment: string; reviewerName: string }>
  passport_nodes: Array<{
    owner_alias: string
    owned_from: string
    owned_until: string | null
    condition_at_transfer: string
    grade_at_transfer: string
    reason_for_transfer: string
    is_original_purchase: boolean
  }>
  // Seller story fields
  seller_story?: {
    reason_for_selling: string
    under_warranty: boolean
    original_packaging: boolean
    additional_notes: string
  }
}

interface UseListingsOptions {
  radiusKm?: number
  userLat?: number
  userLng?: number
  tab?: string
  searchFilters?: {
    category?: string
    max_price?: number | null
    keywords?: string[]
    listing_type_preference?: string
  } | null
}

// ── Fetch products from DummyJSON and convert to Listing format ──────────────

interface DummyJsonProduct {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand: string
  images: string[]
  thumbnail: string
  reviews: Array<{ rating: number; comment: string; reviewerName: string; date: string }>
  returnPolicy: string
  warrantyInformation: string
  shippingInformation: string
}

// Delhi NCR locations for placing DummyJSON products nearby
const DUMMY_LOCATIONS = [
  { lat: 28.6280, lng: 77.2190, area: 'Connaught Place' },
  { lat: 28.5535, lng: 77.2588, area: 'Saket' },
  { lat: 28.6692, lng: 77.4538, area: 'Noida' },
  { lat: 28.4595, lng: 77.0266, area: 'Gurugram' },
  { lat: 28.6353, lng: 77.2250, area: 'Rajiv Chowk' },
  { lat: 28.5672, lng: 77.2100, area: 'Hauz Khas' },
  { lat: 28.6139, lng: 77.2090, area: 'New Delhi' },
  { lat: 28.7041, lng: 77.1025, area: 'Rohini' },
]

const SELLER_NAMES = ['Priya S.', 'Amit K.', 'Rohan M.', 'Sneha G.', 'Vikram P.', 'Neha R.', 'Arjun D.', 'Kavita B.']

function dummyJsonToListing(product: DummyJsonProduct, index: number): Listing {
  // Use product.id for deterministic location/seller assignment (stable across renders)
  const locIdx = product.id % DUMMY_LOCATIONS.length
  const sellerIdx = product.id % SELLER_NAMES.length
  const loc = DUMMY_LOCATIONS[locIdx]
  const seller = SELLER_NAMES[sellerIdx]
  const secondHandPrice = Math.round(product.price * 55 * (1 - product.discountPercentage / 100)) // Convert USD to INR approx, apply discount
  const originalInr = Math.round(product.price * 83) // USD to INR
  const conditionGrades = ['Like New', 'Good', 'Good', 'Fair']
  const grade = conditionGrades[product.id % conditionGrades.length]

  return {
    id: `dj-${product.id}`,
    seller_id: `seller-dj-${product.id}`,
    seller_name: seller,
    seller_rating: Math.round((product.rating + 0.5) * 10) / 10,
    seller_since: 2020 + (product.id % 5),
    title: product.title,
    category: product.category,
    original_price: originalInr,
    asking_price: secondHandPrice,
    purchase_date: `${2024 - (product.id % 3)}-${String((product.id % 12) + 1).padStart(2, '0')}`,
    condition_grade: grade,
    condition_summary: product.description,
    defects: [],
    listing_type: 'resell',
    images: product.images.length > 0 ? product.images : [product.thumbnail],
    location_lat: loc.lat,
    location_lng: loc.lng,
    location_area: loc.area,
    distance_km: 0,
    status: 'active',
    is_local_artisan: false,
    serial_number: `SN-DJ-${product.id}`,
    resale_value_1yr: Math.round(secondHandPrice * 0.6),
    green_credits: Math.round(secondHandPrice * 0.03) + 15,
    return_rate_key: null,
    description: product.description,
    brand: product.brand,
    reviews: product.reviews?.map(r => ({ rating: r.rating, comment: r.comment, reviewerName: r.reviewerName })) || [],
    passport_nodes: [{
      owner_alias: seller,
      owned_from: 'Jan 2024',
      owned_until: null,
      condition_at_transfer: grade,
      grade_at_transfer: grade,
      reason_for_transfer: 'upgrade',
      is_original_purchase: true,
    }],
  }
}

// ── Load DummyJSON products from local cache (Tier 1: instant, no network) ──

function loadCachedDummyJsonListings(): Listing[] {
  return (dummyJsonCache as DummyJsonProduct[])
    .map((p, i) => dummyJsonToListing(p, i))
}

const cachedDummyListings = loadCachedDummyJsonListings()

// ── Convert SerpAPI product to Listing ──────────────────────────────────────

function serpProductToListing(sp: SerpProduct, index: number): Listing {
  const loc = DUMMY_LOCATIONS[index % DUMMY_LOCATIONS.length]
  const seller = SELLER_NAMES[index % SELLER_NAMES.length]
  const price = Math.round(sp.price)
  const originalPrice = Math.round(price / 0.55) // ~45% discount

  return {
    id: `serp-${index}`,
    seller_id: `seller-serp-${index}`,
    seller_name: seller,
    seller_rating: sp.rating || 4.2,
    seller_since: 2022,
    title: sp.title,
    category: sp.category,
    original_price: originalPrice,
    asking_price: price,
    purchase_date: '2024-01',
    condition_grade: 'Good',
    condition_summary: sp.title,
    defects: [],
    listing_type: 'resell',
    images: sp.image ? [sp.image] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'],
    location_lat: loc.lat,
    location_lng: loc.lng,
    location_area: loc.area,
    distance_km: 0,
    status: 'active',
    is_local_artisan: false,
    serial_number: `SN-SERP-${index}`,
    resale_value_1yr: Math.round(price * 0.5),
    green_credits: Math.round(price * 0.02) + 10,
    return_rate_key: null,
    passport_nodes: [{
      owner_alias: seller,
      owned_from: 'Jan 2024',
      owned_until: null,
      condition_at_transfer: 'Good',
      grade_at_transfer: 'Good',
      reason_for_transfer: 'upgrade',
      is_original_purchase: true,
    }],
  }
}

// ── Shared global store for user-published listings (localStorage fallback) ─
const STORAGE_KEY = 'amazon_nh_published_listings'
const CLEANUP_VERSION_KEY = 'amazon_nh_cleanup_v'
const CURRENT_CLEANUP_VERSION = '2' // Increment to force a re-clean

function loadLocalListings(): Listing[] {
  try {
    // Force cleanup of broken listings from previous versions
    const cleanupVersion = localStorage.getItem(CLEANUP_VERSION_KEY)
    if (cleanupVersion !== CURRENT_CLEANUP_VERSION) {
      // Clear all old local listings that had wrong/placeholder images
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(CLEANUP_VERSION_KEY, CURRENT_CLEANUP_VERSION)
      return []
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      let listings = JSON.parse(stored) as Listing[]
      
      // Only keep listings with real user-uploaded images (base64) or Supabase URLs
      listings = listings.filter(l => {
        if (!l.images || l.images.length === 0) return false
        return l.images.some(img => 
          img.startsWith('data:image/') || 
          img.includes('supabase')
        )
      })

      // Remove duplicates by title
      const seenTitles = new Set<string>()
      listings = listings.filter(l => {
        const key = l.title.toLowerCase().trim()
        if (seenTitles.has(key)) return false
        seenTitles.add(key)
        return true
      })

      saveLocalListings(listings)
      return listings
    }
  } catch { /* ignore */ }
  return []
}

function saveLocalListings(listings: Listing[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(listings)) } catch { /* ignore */ }
}

let globalLocalListings: Listing[] = loadLocalListings()
let globalListeners: Array<() => void> = []

function notifyListeners() { globalListeners.forEach(fn => fn()) }

export function publishListing(listing: Listing) {
  globalLocalListings = [listing, ...globalLocalListings]
  saveLocalListings(globalLocalListings)
  notifyListeners()
}

// ── Smart fallback images based on product keywords ─────────────────────────

export function getSmartFallbackImage(title: string, category: string): string {
  const t = title.toLowerCase()
  const c = category.toLowerCase()

  // Bags
  if (t.includes('bag') || t.includes('purse') || t.includes('handbag') || t.includes('tote')) {
    return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80'
  }
  // Table / Furniture
  if (t.includes('table') || t.includes('desk') || t.includes('furniture')) {
    return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80'
  }
  // Kurta / Indian clothing
  if (t.includes('kurta') || t.includes('saree') || t.includes('ethnic')) {
    return 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&q=80'
  }
  // Shoes
  if (t.includes('shoe') || t.includes('sneaker') || t.includes('sandal')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'
  }
  // Electronics
  if (t.includes('phone') || t.includes('mobile') || t.includes('samsung') || t.includes('iphone')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80'
  }
  if (t.includes('laptop') || t.includes('computer') || t.includes('macbook')) {
    return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80'
  }
  if (t.includes('headphone') || t.includes('earphone') || t.includes('earbuds') || t.includes('boat')) {
    return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'
  }
  if (t.includes('watch') || t.includes('smartwatch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'
  }
  if (t.includes('camera') || t.includes('dslr')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80'
  }
  if (t.includes('speaker') || t.includes('alexa') || t.includes('echo')) {
    return 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&q=80'
  }
  if (t.includes('router') || t.includes('wifi')) {
    return 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&q=80'
  }
  // Kitchen
  if (t.includes('mixer') || t.includes('grinder') || t.includes('blender')) {
    return 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80'
  }
  if (t.includes('kettle') || t.includes('cooker') || t.includes('kitchen')) {
    return 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'
  }
  // Baby
  if (t.includes('baby') || t.includes('stroller') || t.includes('monitor') || c.includes('baby')) {
    return 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&q=80'
  }
  // Fashion general
  if (t.includes('jacket') || t.includes('coat')) {
    return 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80'
  }
  if (t.includes('shirt') || t.includes('t-shirt') || t.includes('tee')) {
    return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'
  }
  if (c.includes('fashion') || t.includes('cloth') || t.includes('dress')) {
    return 'https://images.unsplash.com/photo-1558171813-01ac71f68330?w=400&q=80'
  }
  // Sports / Fitness
  if (t.includes('cycle') || t.includes('bike') || t.includes('bicycle')) {
    return 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&q=80'
  }
  if (t.includes('treadmill') || t.includes('gym') || t.includes('fitness')) {
    return 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80'
  }
  // Books
  if (t.includes('book') || t.includes('novel')) {
    return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80'
  }
  // Perfume
  if (t.includes('perfume') || t.includes('fragrance') || t.includes('cologne') || t.includes('eau de')) {
    return 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80'
  }
  // Toys
  if (t.includes('toy') || t.includes('game') || t.includes('puzzle')) {
    return 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80'
  }
  // Default
  if (c.includes('electronic')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80'
  }
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'
}

// ── Convert Supabase row to Listing interface ───────────────────────────────

function supabaseToListing(row: SupabaseListing): Listing {
  return {
    id: row.id,
    seller_id: row.seller_id || '',
    seller_name: row.seller_name || 'Seller',
    seller_rating: row.seller_rating || 4.5,
    seller_since: 2024,
    title: row.title,
    category: row.category,
    original_price: row.original_price,
    asking_price: row.asking_price,
    purchase_date: row.purchase_date || '',
    condition_grade: row.condition_grade,
    condition_summary: row.condition_summary || '',
    defects: row.defects || [],
    listing_type: row.listing_type || 'resell',
    images: (() => {
      const imgs = (row.images || []).filter((img: string) => img && !img.startsWith('blob:'))
      return imgs.length > 0 ? imgs : [getSmartFallbackImage(row.title, row.category)]
    })(),
    location_lat: row.location_lat || 28.6139,
    location_lng: row.location_lng || 77.209,
    location_area: row.location_area || 'Delhi NCR',
    distance_km: 0,
    status: row.status,
    is_local_artisan: row.is_local_artisan,
    serial_number: row.serial_number || '',
    resale_value_1yr: row.resale_value_1yr || 0,
    green_credits: row.green_credits || 30,
    return_rate_key: null,
    passport_nodes: [{
      owner_alias: row.seller_name || 'Seller',
      owned_from: row.purchase_date || 'Jan 2024',
      owned_until: null,
      condition_at_transfer: row.condition_grade,
      grade_at_transfer: row.condition_grade,
      reason_for_transfer: 'Listed for resale',
      is_original_purchase: true,
    }],
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useListings(options: UseListingsOptions = {}) {
  const {
    radiusKm = 10,
    userLat = 28.6139,
    userLng = 77.209,
    tab = 'all',
    searchFilters = null,
  } = options

  const [localListings, setLocalListings] = useState<Listing[]>(globalLocalListings)
  const [supabaseListings, setSupabaseListings] = useState<Listing[]>([])
  const [extraListings, setExtraListings] = useState<Listing[]>([]) // Tier 2/3 products
  const [dataLoading, setDataLoading] = useState(false)

  // Subscribe to local listing changes (real-time within same browser)
  useEffect(() => {
    const listener = () => setLocalListings([...globalLocalListings])
    globalListeners.push(listener)
    return () => { globalListeners = globalListeners.filter(l => l !== listener) }
  }, [])

  // Fetch from Supabase on mount (visible to everyone globally)
  useEffect(() => {
    let cancelled = false
    fetchAllListings().then(rows => {
      if (!cancelled && rows.length > 0) {
        setSupabaseListings(rows.map(supabaseToListing))
      }
      if (!cancelled) setDataLoading(false)
    }).catch(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Tier 2 & 3: Background fetch for additional products
  useEffect(() => {
    let cancelled = false
    // Try Tier 2: Live DummyJSON for any newer products not in cache
    fetchLiveDummyJson().then(liveProducts => {
      if (cancelled) return
      if (liveProducts.length > cachedDummyListings.length) {
        // We got more products than cache — add the extras
        const cachedIds = new Set(cachedDummyListings.map(l => l.id))
        const newProducts = liveProducts
          .filter(p => !cachedIds.has(`dj-${p.id}`))
          .map((p, i) => dummyJsonToListing(p as unknown as DummyJsonProduct, cachedDummyListings.length + i))
        if (newProducts.length > 0) {
          setExtraListings(prev => [...prev, ...newProducts])
        }
      }
    }).catch(() => {
      // Tier 2 failed — try Tier 3: SerpAPI
      if (cancelled) return
      fetchSerpApiProducts('second hand electronics india').then(serpProducts => {
        if (cancelled || serpProducts.length === 0) return
        const serpListings = serpProducts.map((sp, i) => serpProductToListing(sp, i))
        setExtraListings(prev => [...prev, ...serpListings])
      }).catch(() => {})
    })
    return () => { cancelled = true }
  }, [])

  // Combine: Supabase (highest priority) + local + DummyJSON (cached) + seed data
  // Use stable ordering: each source is internally stable, and we maintain insertion order
  const allListings = useMemo(() => {
    const supabaseIds = new Set(supabaseListings.map(l => l.id))
    // For local listings that also exist in Supabase, merge passport/story data into Supabase version
    const enrichedSupabase = supabaseListings.map(sl => {
      // Check if there's a matching local listing with richer data
      const local = localListings.find(ll => 
        ll.title === sl.title && ll.seller_name === sl.seller_name
      )
      if (local) {
        return {
          ...sl,
          passport_nodes: sl.passport_nodes.length > 0 ? sl.passport_nodes : local.passport_nodes,
          seller_story: sl.seller_story || local.seller_story,
        }
      }
      return sl
    })
    const localFiltered = localListings.filter(l => !supabaseIds.has(l.id))
    const combined = [...enrichedSupabase, ...localFiltered, ...cachedDummyListings, ...extraListings, ...(seedListings as Listing[])]
    // Deduplicate by id (keep first occurrence)
    const seenIds = new Set<string>()
    const deduped = combined.filter(l => {
      if (seenIds.has(l.id)) return false
      seenIds.add(l.id)
      return true
    })
    // Also deduplicate by similar title (remove near-duplicates)
    const seenTitleKeys = new Set<string>()
    const seenProductTypes = new Set<string>()
    return deduped.filter(l => {
      // Normalize title: lowercase, remove special chars
      const normalized = l.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
      const words = normalized.split(/\s+/).filter(w => w.length > 2)
      
      // Key based on first 2 meaningful words
      const key2 = words.slice(0, 2).join(' ')
      if (seenTitleKeys.has(key2)) return false
      seenTitleKeys.add(key2)
      
      // Also check product type keywords — only one per category
      const productTypes = ['kurta', 'shoes', 'running', 'earphones', 'earphone', 'headphone', 'headphones',
        'watch', 'jacket', 'purse', 'handbag', 'tote bag', 'stroller', 'monitor', 'baby monitor',
        'tablet', 'router', 'mixer', 'iron', 'fan', 'kettle']
      for (const type of productTypes) {
        if (normalized.includes(type)) {
          if (seenProductTypes.has(type)) return false
          seenProductTypes.add(type)
          break
        }
      }
      
      return true
    })
  }, [supabaseListings, localListings, extraListings])

  const filtered = useMemo(() => {
    let list = allListings.map((l) => ({
      ...l,
      distance_km: haversineDistance(userLat, userLng, l.location_lat, l.location_lng),
    }))

    list = list.filter((l) => l.distance_km <= radiusKm)

    if (tab === 'resell') list = list.filter((l) => l.listing_type === 'resell')
    else if (tab === 'exchange') list = list.filter((l) => l.listing_type === 'exchange')
    else if (tab === 'donate') list = list.filter((l) => l.listing_type === 'donate')
    else if (tab === 'refurbish') list = list.filter((l) => l.listing_type === 'refurbish')
    else if (tab === 'local') list = list.filter((l) => l.is_local_artisan)

    if (searchFilters) {
      if (searchFilters.category && searchFilters.category !== '') {
        list = list.filter((l) => l.category.toLowerCase().includes(searchFilters.category!.toLowerCase()))
      }
      if (searchFilters.max_price) {
        list = list.filter((l) => l.asking_price <= searchFilters.max_price!)
      }
      if (searchFilters.keywords && searchFilters.keywords.length > 0) {
        list = list.filter((l) =>
          searchFilters.keywords!.some((kw) =>
            l.title.toLowerCase().includes(kw.toLowerCase()) || l.category.toLowerCase().includes(kw.toLowerCase())
          )
        )
      }
      if (searchFilters.listing_type_preference && searchFilters.listing_type_preference !== 'any') {
        list = list.filter((l) => l.listing_type === searchFilters.listing_type_preference)
      }
    }

    // Enforce discount range: minimum 45%, maximum 91%
    // Adjust original_price so that (1 - asking_price/original_price)*100 is in [45, 91]
    list = list.map(l => {
      if (l.listing_type === 'donate' || l.listing_type === 'exchange' || l.asking_price <= 0) return l
      const currentDiscount = Math.round((1 - l.asking_price / l.original_price) * 100)
      if (currentDiscount >= 45 && currentDiscount <= 91) return l
      // Generate a deterministic discount between 45-91 based on listing id
      const seed = l.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
      const targetDiscount = 45 + (seed % 47) // 45 to 91
      const newOriginalPrice = Math.round(l.asking_price / (1 - targetDiscount / 100))
      return { ...l, original_price: newOriginalPrice }
    })

    // Stable sort: primary by distance, secondary by id for deterministic ordering
    return list.sort((a, b) => {
      const distDiff = a.distance_km - b.distance_km
      if (Math.abs(distDiff) > 0.001) return distDiff
      return a.id.localeCompare(b.id)
    })
  }, [allListings, radiusKm, userLat, userLng, tab, searchFilters])

  const getById = useCallback((id: string) => allListings.find((l) => l.id === id) || null, [allListings])

  const addListing = useCallback((listing: Listing) => { publishListing(listing) }, [])

  // Refresh from Supabase
  const refresh = useCallback(() => {
    fetchAllListings().then(rows => {
      if (rows.length > 0) setSupabaseListings(rows.map(supabaseToListing))
    })
  }, [])

  return { listings: filtered, getById, addListing, allListings, refresh, loading: dataLoading }
}
