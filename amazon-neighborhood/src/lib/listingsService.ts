/**
 * Listings Service — Supabase Backend
 * 
 * Handles:
 *   1. Uploading product images to Supabase Storage
 *   2. Saving listing data to the `listings` table
 *   3. Fetching all active listings (publicly visible to everyone)
 * 
 * Storage bucket: "product-images" (must be created in Supabase dashboard)
 * Table: "listings" (created by schema.sql)
 */

import { supabase } from './supabase'

export interface ListingInsert {
  title: string
  category: string
  original_price: number
  asking_price: number
  purchase_date: string
  condition_grade: string
  condition_summary: string
  defects: string[]
  listing_type: string
  images: string[] // will be URLs after upload
  location_lat: number
  location_lng: number
  location_area: string
  seller_name: string
  seller_rating: number
  green_credits: number
  resale_value_1yr: number
  serial_number: string
}

export interface SupabaseListing {
  id: string
  title: string
  category: string
  original_price: number
  asking_price: number
  purchase_date: string | null
  condition_grade: string
  condition_summary: string | null
  defects: string[] | null
  listing_type: string
  images: string[] | null
  location_lat: number | null
  location_lng: number | null
  location_area: string | null
  status: string
  seller_name: string | null
  seller_rating: number | null
  green_credits: number | null
  resale_value_1yr: number | null
  serial_number: string | null
  is_local_artisan: boolean
  created_at: string
  seller_id: string | null
}

// ── Convert File to base64 data URL (persistent fallback for localStorage) ──

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToBase64(files: File[]): Promise<string[]> {
  const results: string[] = []
  for (const file of files) {
    try {
      const base64 = await fileToBase64(file)
      results.push(base64)
    } catch (err) {
      console.error('Failed to convert file to base64:', err)
    }
  }
  return results
}

// ── Upload image/video to Supabase Storage ──────────────────────────────────

export async function uploadProductFile(file: File, listingId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('File upload error:', error.message)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// ── Upload multiple files (images + videos) ─────────────────────────────────

export async function uploadProductFiles(files: File[], listingId: string): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const url = await uploadProductFile(file, listingId)
    if (url) urls.push(url)
  }

  return urls
}

// ── Save listing to Supabase DB ─────────────────────────────────────────────

export async function createListing(listing: ListingInsert, sellerId?: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: sellerId || null,
      title: listing.title,
      category: listing.category,
      original_price: listing.original_price,
      asking_price: listing.asking_price,
      purchase_date: listing.purchase_date,
      condition_grade: listing.condition_grade,
      condition_summary: listing.condition_summary,
      defects: listing.defects,
      listing_type: listing.listing_type,
      images: listing.images,
      location_lat: listing.location_lat,
      location_lng: listing.location_lng,
      location_area: listing.location_area,
      status: 'active',
      seller_name: listing.seller_name,
      seller_rating: listing.seller_rating,
      green_credits: listing.green_credits,
      resale_value_1yr: listing.resale_value_1yr,
      serial_number: listing.serial_number,
      is_local_artisan: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Create listing error:', error.message)
    return { id: null, error: error.message }
  }

  return { id: data?.id || null, error: null }
}

// ── Fetch all active listings (PUBLIC — no auth needed) ─────────────────────

export async function fetchAllListings(): Promise<SupabaseListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Fetch listings error:', error.message)
    return []
  }

  return (data || []) as SupabaseListing[]
}

// ── Full publish flow: upload media (images + videos) + create listing ───────

export async function publishListingToSupabase(
  listing: ListingInsert,
  imageFiles: File[],
  sellerId?: string
): Promise<{ success: boolean; listingId: string | null; imageUrls: string[]; error: string | null }> {
  const tempId = `listing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Step 1: Upload all files (images + videos) to Supabase Storage
  let mediaUrls: string[] = []
  if (imageFiles.length > 0) {
    mediaUrls = await uploadProductFiles(imageFiles, tempId)
  }

  // Step 2: If Supabase Storage upload failed, use base64 as fallback for images only
  // (videos are too large for base64/localStorage, so we skip them in fallback)
  if (mediaUrls.length === 0 && imageFiles.length > 0) {
    const imageOnlyFiles = imageFiles.filter(f => f.type.startsWith('image/'))
    if (imageOnlyFiles.length > 0) {
      mediaUrls = await filesToBase64(imageOnlyFiles)
    }
  }

  // Final fallback: ensure at least one image URL exists
  const finalImages = mediaUrls.length > 0 ? mediaUrls : ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80']

  // Step 3: Create listing in DB with the uploaded media URLs
  const { id, error } = await createListing(
    { ...listing, images: finalImages },
    sellerId
  )

  if (error) {
    // If DB save fails, fall back to localStorage
    console.warn('Supabase DB save failed, using localStorage fallback:', error)
    return { success: false, listingId: null, imageUrls: finalImages, error }
  }

  return { success: true, listingId: id, imageUrls: finalImages, error: null }
}
