/**
 * DummyJSON Product Service
 * 
 * Fetches real product data (photos, descriptions, reviews) from
 * https://dummyjson.com/products — completely FREE, no API key needed.
 * 
 * This data enriches our listings with Amazon-like product information.
 */

export interface DummyProduct {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  tags: string[]
  brand: string
  sku: string
  images: string[]
  thumbnail: string
  reviews: Array<{
    rating: number
    comment: string
    date: string
    reviewerName: string
    reviewerEmail: string
  }>
  returnPolicy: string
  warrantyInformation: string
  shippingInformation: string
  availabilityStatus: string
}

const BASE_URL = 'https://dummyjson.com'
const CACHE = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function cachedFetch<T>(url: string): Promise<T | null> {
  const cached = CACHE.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    CACHE.set(url, { data, ts: Date.now() })
    return data as T
  } catch {
    return null
  }
}

// ── Fetch all products (paginated) ──────────────────────────────────────────

export async function fetchAllProducts(limit = 30, skip = 0): Promise<DummyProduct[]> {
  const data = await cachedFetch<{ products: DummyProduct[] }>(`${BASE_URL}/products?limit=${limit}&skip=${skip}`)
  return data?.products || []
}

// ── Fetch by category ───────────────────────────────────────────────────────

export async function fetchByCategory(category: string, limit = 10): Promise<DummyProduct[]> {
  const data = await cachedFetch<{ products: DummyProduct[] }>(`${BASE_URL}/products/category/${category}?limit=${limit}`)
  return data?.products || []
}

// ── Search products ─────────────────────────────────────────────────────────

export async function searchProducts(query: string, limit = 10): Promise<DummyProduct[]> {
  const data = await cachedFetch<{ products: DummyProduct[] }>(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  return data?.products || []
}

// ── Fetch single product ────────────────────────────────────────────────────

export async function fetchProduct(id: number): Promise<DummyProduct | null> {
  return cachedFetch<DummyProduct>(`${BASE_URL}/products/${id}`)
}

// ── Get all categories ──────────────────────────────────────────────────────

export async function fetchCategories(): Promise<string[]> {
  const data = await cachedFetch<Array<{ slug: string; name: string }>>(`${BASE_URL}/products/categories`)
  return data?.map(c => c.slug) || []
}

// ── Get product images for condition comparison ─────────────────────────────

export async function getProductReferenceImages(productName: string, category?: string): Promise<string[]> {
  // Try searching by name first
  const results = await searchProducts(productName, 3)
  if (results.length > 0) {
    return results[0].images
  }
  // Try by category
  if (category) {
    const catResults = await fetchByCategory(category, 3)
    if (catResults.length > 0) return catResults[0].images
  }
  return []
}
