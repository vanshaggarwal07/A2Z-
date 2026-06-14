/**
 * 3-Tier Product Data Loading Architecture
 * 
 * Tier 1: Local cache (dummyjson_cache.json) — instant, bundled with app
 * Tier 2: Live DummyJSON API — background refresh for newer data
 * Tier 3: SerpAPI fallback — real Amazon product data if DummyJSON fails
 */

const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY || ''

export interface RawProduct {
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

// ── Tier 2: Live DummyJSON fetch (background) ─────────────────────────────

export async function fetchLiveDummyJson(): Promise<RawProduct[]> {
  try {
    const allProducts: RawProduct[] = []
    // Fetch in batches
    for (let skip = 0; skip < 200; skip += 30) {
      const res = await fetch(`https://dummyjson.com/products?limit=30&skip=${skip}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) break
      const data = await res.json()
      if (!data.products || data.products.length === 0) break
      allProducts.push(...data.products)
    }
    // Filter out unsuitable categories
    const EXCLUDED_CATEGORIES = ['groceries', 'beauty']
    const EXCLUDED_IDS = [17]
    return allProducts.filter(
      p => !EXCLUDED_IDS.includes(p.id) && !EXCLUDED_CATEGORIES.includes(p.category)
    )
  } catch (err) {
    console.warn('Tier 2 (DummyJSON live) failed:', err)
    return []
  }
}

// ── Tier 3: SerpAPI fallback (real Amazon product data) ───────────────────

export interface SerpProduct {
  title: string
  price: number
  image: string
  rating: number
  reviews_count: number
  category: string
}

export async function fetchSerpApiProducts(query: string = 'electronics'): Promise<SerpProduct[]> {
  if (!SERP_API_KEY) {
    console.warn('Tier 3 (SerpAPI): No API key configured')
    return []
  }

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&location=India&hl=en&gl=in&api_key=${SERP_API_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) {
      console.warn('Tier 3 (SerpAPI): HTTP', res.status)
      return []
    }
    const data = await res.json()
    const results = data.shopping_results || []
    return results.slice(0, 20).map((item: any) => ({
      title: item.title || 'Product',
      price: parseFloat(String(item.extracted_price || item.price || '999').replace(/[^0-9.]/g, '')) || 999,
      image: item.thumbnail || '',
      rating: item.rating || 4.0,
      reviews_count: item.reviews || 0,
      category: query,
    }))
  } catch (err) {
    console.warn('Tier 3 (SerpAPI) failed:', err)
    return []
  }
}

// ── Orchestrator: Load products with 3-tier fallback ─────────────────────

export async function loadProductsWithFallback(
  localCache: RawProduct[]
): Promise<{ products: RawProduct[]; source: 'cache' | 'live' | 'serpapi' }> {
  // Tier 1: Always start with local cache (instant)
  if (localCache.length > 0) {
    // Try Tier 2 in background (non-blocking)
    fetchLiveDummyJson().then(liveProducts => {
      if (liveProducts.length > localCache.length) {
        // Update runtime cache if we got more products
        console.log(`Tier 2: Got ${liveProducts.length} products (vs ${localCache.length} cached)`)
      }
    }).catch(() => {})

    return { products: localCache, source: 'cache' }
  }

  // Tier 2: If no cache, try live DummyJSON
  const liveProducts = await fetchLiveDummyJson()
  if (liveProducts.length > 0) {
    return { products: liveProducts, source: 'live' }
  }

  // Tier 3: If DummyJSON also fails, fall back to SerpAPI
  console.log('Tier 2 failed, trying Tier 3 (SerpAPI)...')
  const serpProducts = await fetchSerpApiProducts('electronics accessories')
  if (serpProducts.length > 0) {
    // Convert SerpAPI format to DummyJSON-like format
    const converted: RawProduct[] = serpProducts.map((sp, i) => ({
      id: 1000 + i,
      title: sp.title,
      description: sp.title,
      category: sp.category,
      price: Math.round(sp.price / 83), // INR to USD approx for consistency
      discountPercentage: 10,
      rating: sp.rating,
      stock: 50,
      brand: sp.title.split(' ')[0],
      images: sp.image ? [sp.image] : [],
      thumbnail: sp.image || '',
      reviews: [],
      returnPolicy: '30 days',
      warrantyInformation: '1 year',
      shippingInformation: 'Free shipping',
    }))
    return { products: converted, source: 'serpapi' }
  }

  return { products: [], source: 'cache' }
}
