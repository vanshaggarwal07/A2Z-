import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { ConditionBadge } from '../components/ui/Badge'
import { DispositionCard } from '../components/triage/DispositionCard'
import { CostBenefitCard } from '../components/triage/CostBenefitCard'
import { type GradingResult } from '../lib/grading'
import { analyzeProductCondition } from '../lib/conditionAnalyzer'
import { publishListing } from '../hooks/useListings'
import { publishListingToSupabase } from '../lib/listingsService'
import { useAuth } from '../context/AuthContext'
import { callPriceSuggestion } from '../lib/groq'
import { getTriage, type TriageResult } from '../lib/triage'
import { useAppContext } from '../context/AppContext'

const STEPS = ['Photos & AI Grade', 'AI Triage', 'Details & Price', 'Location & Handoff', 'Publish']

interface FormData {
  images: File[]
  imageUrls: string[]
  videoFile: File | null
  grading: GradingResult | null
  disposition: string
  triage: TriageResult | null
  name: string
  originalPrice: string
  purchaseDate: string
  category: string
  suggestedPrice: number | null
  priceRange: { min: number; max: number } | null
  depreciationPercent: number
  finalPrice: number
  handoff: string
  lockerId: string
  locationLat: number
  locationLng: number
  // Seller story fields
  reasonForSelling: string
  underWarranty: string
  originalPackaging: string
  additionalNotes: string
}

const DEFAULT_FORM: FormData = {
  images: [],
  imageUrls: [],
  videoFile: null,
  grading: null,
  disposition: 'resell',
  triage: null,
  name: '',
  originalPrice: '',
  purchaseDate: '',
  category: '',
  suggestedPrice: null,
  priceRange: null,
  depreciationPercent: 0,
  finalPrice: 0,
  handoff: 'amazon_pickup',
  lockerId: 'addr-1',
  locationLat: 28.6139,
  locationLng: 77.209,
  reasonForSelling: '',
  underWarranty: 'no',
  originalPackaging: 'no',
  additionalNotes: '',
}

export function ListItem() {
  const navigate = useNavigate()
  const { addCredits } = useAppContext()
  const { user, profile } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [gradingLoading, setGradingLoading] = useState(false)
  const [triageLoading, setTriageLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [published, setPublished] = useState(false)

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    const videoFiles = files.filter(f => f.type.startsWith('video/'))

    const urls = imageFiles.map(f => URL.createObjectURL(f))
    const videoUrl = videoFiles.length > 0 ? URL.createObjectURL(videoFiles[0]) : ''

    setForm(prev => ({
      ...prev,
      images: imageFiles,
      imageUrls: urls,
      videoFile: videoFiles[0] || null,
      // Store video URL for preview in imageUrls if no images uploaded
      ...(imageFiles.length === 0 && videoUrl ? { imageUrls: [videoUrl] } : {}),
    }))
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter(f =>
        f.type.startsWith('image/') || f.type.startsWith('video/')
      )
      if (files.length === 0) return

      const imageFiles = files.filter(f => f.type.startsWith('image/'))
      const videoFiles = files.filter(f => f.type.startsWith('video/'))
      const urls = imageFiles.map(f => URL.createObjectURL(f))
      const videoUrl = videoFiles.length > 0 ? URL.createObjectURL(videoFiles[0]) : ''

      setForm(prev => ({
        ...prev,
        images: imageFiles,
        imageUrls: urls.length > 0 ? urls : (videoUrl ? [videoUrl] : []),
        videoFile: videoFiles[0] || null,
      }))
    },
    []
  )

  const handleStep1Next = async () => {
    // If no grading yet, run the full ML analysis
    if (!form.grading) {
      setGradingLoading(true)
      
      // Run the PHOTO-BASED condition analyzer
      // It uses BLIP (sees the photo) + CLIP (classifies condition) + Groq (reasons about grade)
      const conditionResult = await analyzeProductCondition(
        form.name,
        form.category || 'other',
        form.purchaseDate || '2024-01',
        parseInt(form.originalPrice) || 1000,
        form.images.length,
        form.images[0] || undefined,
        form.videoFile || undefined,
      )

      setForm(prev => ({
        ...prev,
        grading: {
          condition_grade: conditionResult.gradeLabel as GradingResult['condition_grade'],
          condition_summary: conditionResult.reason,
          defects_detected: conditionResult.photoAnalysis ? [conditionResult.photoAnalysis] : [],
          estimated_category: form.category || 'other',
          estimated_product_name: form.name,
          confidence_score: conditionResult.confidenceScore / 100,
          recommended_disposition: conditionResult.recommendation,
        },
        disposition: conditionResult.recommendation,
        category: form.category || 'other',
        depreciationPercent: conditionResult.depreciationPct,
        suggestedPrice: conditionResult.suggestedPrice,
      }))
      setGradingLoading(false)
      return // Stay on step 1 to show results
    }

    // Grading already done → proceed to triage
    setTriageLoading(true)
    const triage = await getTriage(
      'new-listing',
      form.name || form.grading.estimated_product_name,
      form.grading.estimated_category,
      form.grading.condition_grade,
      parseInt(form.originalPrice) || 1000,
      form.grading.defects_detected
    )
    setForm(prev => ({ ...prev, triage }))
    setTriageLoading(false)
    setStep(1)
  }

  const handleStep2Next = () => setStep(2)

  const handleStep3Next = async () => {
    if (!form.name || !form.originalPrice) return
    setPriceLoading(true)
    try {
      const result = await callPriceSuggestion(
        form.name,
        parseInt(form.originalPrice),
        form.purchaseDate || 'Jan 2024',
        form.grading?.condition_grade || 'Good',
        form.category
      )
      setForm((prev) => ({
        ...prev,
        suggestedPrice: result.suggested_price,
        priceRange: result.price_range,
        depreciationPercent: result.depreciation_percent,
        finalPrice: result.suggested_price,
      }))
    } catch {
      const fallback = Math.round(parseInt(form.originalPrice) * 0.45)
      setForm((prev) => ({
        ...prev,
        suggestedPrice: fallback,
        priceRange: { min: Math.round(fallback * 0.7), max: Math.round(fallback * 1.3) },
        depreciationPercent: 55,
        finalPrice: fallback,
      }))
    }
    setPriceLoading(false)
    setStep(3)
  }

  const handlePublish = async () => {
    // Award green credits for listing an item
    addCredits({
      action: `Listed ${form.name.slice(0, 40)}`,
      credits: form.triage?.green_credits_earned || 30,
      co2_saved_kg: parseFloat(((form.triage?.green_credits_earned || 30) * 0.047).toFixed(2)),
      listing_title: form.name,
    })

    const askingPrice = form.finalPrice || form.suggestedPrice || Math.round((parseInt(form.originalPrice) || 1000) * 0.6)
    const sellerName = profile?.full_name || user?.email?.split('@')[0] || 'Seller'

    // Combine image files and video file into one array for upload
    const allMediaFiles: File[] = [...form.images]
    if (form.videoFile) allMediaFiles.push(form.videoFile)

    // Save to Supabase (images + video + listing data — visible globally to everyone)
    const { success, imageUrls } = await publishListingToSupabase(
      {
        title: form.name,
        category: form.category || 'other',
        original_price: parseInt(form.originalPrice) || 1000,
        asking_price: askingPrice,
        purchase_date: form.purchaseDate || 'Jan 2024',
        condition_grade: form.grading?.condition_grade || 'Good',
        condition_summary: form.grading?.condition_summary || 'Good condition',
        defects: form.grading?.defects_detected || [],
        listing_type: form.disposition === 'donate' ? 'donate' : form.disposition === 'exchange' ? 'exchange' : 'resell',
        images: form.imageUrls,
        location_lat: form.locationLat,
        location_lng: form.locationLng,
        location_area: 'Delhi NCR',
        seller_name: sellerName,
        seller_rating: 5.0,
        green_credits: form.triage?.green_credits_earned || 30,
        resale_value_1yr: Math.round(askingPrice * 0.5),
        serial_number: `SN-${Date.now()}`,
      },
      allMediaFiles, // image + video File objects for Supabase upload
      user?.id,
    )

    // Also add to local store (immediate visibility even if Supabase is slow)
    // Use the imageUrls from Supabase (or base64 fallback) — never blob URLs
    const persistentImages = imageUrls.length > 0 ? imageUrls : ['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80']

    const localListing: import('../hooks/useListings').Listing = {
      id: success ? `sb-${Date.now()}` : `local-${Date.now()}`,
      seller_id: user?.id || 'anonymous',
      seller_name: sellerName,
      seller_rating: 5.0,
      seller_since: 2024,
      title: form.name,
      category: form.category || 'other',
      original_price: parseInt(form.originalPrice) || 1000,
      asking_price: askingPrice,
      purchase_date: form.purchaseDate || 'Jan 2024',
      condition_grade: form.grading?.condition_grade || 'Good',
      condition_summary: form.grading?.condition_summary || 'Good condition',
      defects: form.grading?.defects_detected || [],
      listing_type: form.disposition === 'donate' ? 'donate' : form.disposition === 'exchange' ? 'exchange' : 'resell',
      images: persistentImages,
      location_lat: form.locationLat,
      location_lng: form.locationLng,
      location_area: 'Delhi NCR',
      distance_km: 0,
      status: 'active',
      is_local_artisan: false,
      serial_number: `SN-${Date.now()}`,
      resale_value_1yr: Math.round(askingPrice * 0.5),
      green_credits: form.triage?.green_credits_earned || 30,
      return_rate_key: null,
      seller_story: form.reasonForSelling ? {
        reason_for_selling: form.reasonForSelling,
        under_warranty: form.underWarranty === 'yes',
        original_packaging: form.originalPackaging === 'yes',
        additional_notes: form.additionalNotes,
      } : undefined,
      passport_nodes: [{
        owner_alias: sellerName,
        owned_from: form.purchaseDate || 'Jan 2024',
        owned_until: null,
        condition_at_transfer: form.grading?.condition_grade || 'Good',
        grade_at_transfer: form.grading?.condition_grade || 'Good',
        reason_for_transfer: form.disposition,
        is_original_purchase: true,
      }],
    }
    publishListing(localListing)

    setPublished(true)
  }

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Published!</h1>
        <p className="text-gray-600 mb-2">
          Your {form.name} is now live on Amazon Neighborhood.
        </p>
        <p className="text-[#2D6A4F] font-semibold mb-6">
           You'll earn {form.triage?.green_credits_earned || 30} credits when it sells
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/neighborhood')} variant="primary">
            Browse Neighborhood
          </Button>
          <Button onClick={() => navigate('/seller/returns')} variant="secondary">
            Seller Hub
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-gray-900">List an Item</h1>
          <span className="text-sm text-gray-500">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-[#FF9900]' : 'bg-gray-200'
              }`}
              aria-label={`Step ${i + 1}: ${s} — ${i <= step ? 'completed' : 'pending'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">{STEPS[step]}</p>
      </div>

      {/* Step 1: Product Info + Photos + AI Grade */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Product Information & Photos</h2>
          <p className="text-sm text-gray-500">Enter product details and upload 4-5 photos. Our ML model will analyze the product quality.</p>

          {/* Product name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              placeholder="e.g. Nike Air Max Running Shoes, Philips Baby Monitor..."
            />
          </div>

          {/* Purchase date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="month"
              value={form.purchaseDate}
              onChange={(e) => setForm(prev => ({ ...prev, purchaseDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
            />
          </div>

          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm(prev => ({ ...prev, originalPrice: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
              placeholder="3499"
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photos (4-5 images)</label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#FF9900] transition-colors cursor-pointer"
            >
              <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple onChange={handleImageUpload} className="hidden" id="photo-upload" />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <svg className="w-10 h-10 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
                <p className="mt-2 font-medium text-gray-700">Drop photos or video here, or click to upload</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, MP4, WebM - Upload 4 to 5 photos or 1 video</p>
              </label>
            </div>
          </div>

          {/* Image/Video previews */}
          {(form.imageUrls.length > 0 || form.videoFile) && (
            <div className="flex gap-2 overflow-x-auto pb-1 items-center">
              {form.imageUrls.map((url, i) => (
                <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-[#FF9900]">
                  <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
              {form.videoFile && (
                <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-[#FF9900] bg-gray-900 flex items-center justify-center relative">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  <span className="absolute bottom-0.5 right-1 text-[8px] text-white bg-black/60 px-1 rounded">VIDEO</span>
                </div>
              )}
              <p className="self-center text-xs text-gray-400 ml-2">
                {form.images.length} photo(s){form.videoFile ? ' + 1 video' : ''}
              </p>
            </div>
          )}

          {/* ML Analysis Loading */}
          {gradingLoading && (
            <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded-xl p-5 text-center">
              <div className="w-10 h-10 border-3 border-[#0a6245] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="font-semibold text-[#0a6245] text-sm">ML Model Analyzing Product...</p>
              <p className="text-xs text-gray-500 mt-1">Cross-referencing product database, assessing condition grade, calculating depreciation</p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="text-[10px] bg-[#0a6245] text-white px-2 py-0.5 rounded animate-pulse">Identifying product</span>
                <span className="text-[10px] bg-[#0a6245]/70 text-white px-2 py-0.5 rounded animate-pulse" style={{ animationDelay: '0.5s' }}>Grading quality</span>
                <span className="text-[10px] bg-[#0a6245]/50 text-white px-2 py-0.5 rounded animate-pulse" style={{ animationDelay: '1s' }}>Computing price</span>
              </div>
            </div>
          )}

          {/* Grading result */}
          {form.grading && !gradingLoading && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{form.grading.estimated_product_name}</p>
                  <p className="text-xs text-gray-500">{form.grading.estimated_category}</p>
                </div>
                <ConditionBadge grade={form.grading.condition_grade} />
              </div>

              <p className="text-sm text-gray-700">{form.grading.condition_summary}</p>

              {form.grading.defects_detected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.grading.defects_detected.map((d, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{d}</span>
                  ))}
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>AI Confidence</span>
                  <span>{Math.round(form.grading.confidence_score * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#067D62] rounded-full" style={{ width: `${form.grading.confidence_score * 100}%` }} />
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-[#067D62]">
                  Grade: {form.grading.condition_grade} | AI recommends: <span className="capitalize">{form.grading.recommended_disposition}</span>
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleStep1Next}
            disabled={!form.name || !form.purchaseDate || (form.imageUrls.length < 1 && !form.videoFile) || gradingLoading}
            loading={triageLoading}
            size="lg"
            className="w-full"
          >
            {form.grading ? 'Continue to AI Triage' : 'Analyze Product'}
          </Button>
        </div>
      )}

      {/* Step 2: Triage */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">AI Triage Result</h2>
          <p className="text-sm text-gray-500">Based on product category, condition, and age, the AI has determined the best course of action.</p>

          {/* Single recommended disposition (not user-selectable) */}
          <div className="border-2 border-[#0a6245] bg-[#f0f9f4] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#0a6245] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">AI Recommendation</p>
                <p className="text-lg font-bold text-[#0a6245] capitalize">{form.disposition}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              {form.disposition === 'resell' && 'This product is in suitable condition for resale on Amazon Neighbourhood. It will reach a local buyer at a fair price.'}
              {form.disposition === 'refurbish' && 'This product needs minor refurbishment before it can be resold. Amazon partners can restore it to sellable condition.'}
              {form.disposition === 'donate' && 'This product is best suited for donation. It can still be useful to someone in need.'}
              {form.disposition === 'recycle' && 'This product should be responsibly recycled. Due to its category or condition, it cannot be resold or donated.'}
              {form.disposition === 'exchange' && 'This product qualifies for an exchange programme where you can trade it for credit towards a new purchase.'}
            </p>
          </div>

          {form.triage && <CostBenefitCard triage={form.triage} />}

          <div className="flex gap-3">
            <Button onClick={() => setStep(0)} variant="secondary" size="lg" className="flex-1">
              Back
            </Button>
            <Button onClick={handleStep2Next} size="lg" className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Details & Price */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Product Details</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="product-name">
                Product Name
              </label>
              <input
                id="product-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                placeholder="e.g. Nike Air Max Running Shoes"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="original-price">
                  Original Price (₹)
                </label>
                <input
                  id="original-price"
                  type="number"
                  value={form.originalPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, originalPrice: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                  placeholder="3499"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="purchase-date">
                  Purchase Date
                </label>
                <input
                  id="purchase-date"
                  type="month"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                />
              </div>
            </div>
          </div>

          {/* Price suggestion loading */}
          {priceLoading && <Spinner message="Calculating fair market price…" />}

          {/* Price suggestion result */}
          {form.suggestedPrice && !priceLoading && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="font-semibold text-gray-900">Suggested Price</p>
              <p className="text-4xl font-bold text-[#111]">₹{form.suggestedPrice.toLocaleString()}</p>
              <p className="text-sm text-[#067D62]">
                ↓ {form.depreciationPercent}% from original — fair for this category
              </p>

              {form.priceRange && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>₹{form.priceRange.min.toLocaleString()}</span>
                    <span>₹{form.priceRange.max.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={form.priceRange.min}
                    max={form.priceRange.max}
                    value={form.finalPrice}
                    onChange={(e) => setForm((prev) => ({ ...prev, finalPrice: parseInt(e.target.value) }))}
                    className="w-full accent-[#FF9900]"
                    aria-label={`Set asking price, currently ₹${form.finalPrice}`}
                  />
                  <p className="text-center text-lg font-bold text-[#FF9900] mt-1">
                    Your Price: ₹{form.finalPrice.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Seller Story Section */}
          <div className="bg-[#faf8f5] border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-[#FF9900]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2z" clipRule="evenodd" />
              </svg>
              Tell buyers about your product
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Selling <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.reasonForSelling}
                onChange={e => setForm(prev => ({ ...prev, reasonForSelling: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900]"
                placeholder="e.g. Upgraded to a newer model, no longer needed..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Under Warranty?</label>
                <select
                  value={form.underWarranty}
                  onChange={e => setForm(prev => ({ ...prev, underWarranty: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Original Packaging?</label>
                <select
                  value={form.originalPackaging}
                  onChange={e => setForm(prev => ({ ...prev, originalPackaging: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] bg-white"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anything else the buyer should know?</label>
              <textarea
                value={form.additionalNotes}
                onChange={e => setForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9900] resize-none"
                rows={3}
                placeholder="Share any additional details about the product's history, accessories included, minor issues, how to care etc."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep(1)} variant="secondary" size="lg" className="flex-1">
              ← Back
            </Button>
            <Button
              onClick={handleStep3Next}
              disabled={!form.name || !form.originalPrice}
              loading={priceLoading}
              size="lg"
              className="flex-1"
            >
              Get Price Suggestion →
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Pickup Address */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Pickup Address</h2>
          <p className="text-sm text-gray-500">Amazon will pick up the item from your address and deliver it to the buyer.</p>

          <button
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(
                (pos) => setForm((prev) => ({
                  ...prev,
                  locationLat: pos.coords.latitude,
                  locationLng: pos.coords.longitude,
                })),
                () => {}
              )
            }}
            className="w-full flex items-center gap-2 border border-[#FF9900] text-[#FF9900] rounded-xl px-4 py-3 font-semibold text-sm hover:bg-orange-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use my current location
          </button>

          {/* Saved addresses */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Or select a saved address:</p>
            {[
              { id: 'addr-1', label: '42, Rajpur Road, Near Metro Station, New Delhi - 110001' },
              { id: 'addr-2', label: '15, MG Road, Block B, Sector 5, Gurugram - 122001' },
            ].map((addr) => (
              <button
                key={addr.id}
                onClick={() => setForm((prev) => ({ ...prev, lockerId: addr.id }))}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  form.lockerId === addr.id ? 'border-[#FF9900] bg-orange-50' : 'border-gray-200 bg-white'
                }`}
                aria-pressed={form.lockerId === addr.id}
              >
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <p className="text-sm text-gray-800">{addr.label}</p>
              </button>
            ))}
            <button className="text-sm text-[#007185] hover:underline font-medium mt-1">+ Add a new address</button>
          </div>

          <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded-lg p-3 text-xs text-[#0a6245]">
            <p className="font-semibold">How it works:</p>
            <p className="mt-1">Amazon picks up from your address within 24-48 hours of a sale. The buyer receives the item via standard Amazon delivery. Your exact address is never shared with the buyer.</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep(2)} variant="secondary" size="lg" className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep(4)} size="lg" className="flex-1">
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Passport & Publish */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Review & Publish</h2>

          {/* Summary card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
            {form.imageUrls[0] && (
              <img src={form.imageUrls[0]} alt="" className="w-20 h-20 rounded-lg object-cover" />
            )}
            <div>
              <p className="font-semibold text-gray-900">{form.name}</p>
              {form.grading && <ConditionBadge grade={form.grading.condition_grade} />}
              <p className="text-lg font-bold text-[#111] mt-1">
                ₹{(form.finalPrice || form.suggestedPrice || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 capitalize">{form.disposition} · Amazon Pickup</p>
            </div>
          </div>

          {/* Passport preview */}
          <div className="border border-[#067D62] rounded-xl p-4 bg-green-50">
            <p className="font-semibold text-[#067D62] text-sm mb-2"> Product Passport — First Entry</p>
            <div className="bg-white rounded-lg p-3 text-xs space-y-1 text-gray-700">
              <p><span className="font-medium">Owner 1:</span> You (Demo User)</p>
              <p><span className="font-medium">Purchased:</span> {form.purchaseDate || 'Recently'}</p>
              <p><span className="font-medium">Listed:</span> {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
              <p><span className="font-medium">Grade:</span> {form.grading?.condition_grade || 'Good'}</p>
              <p><span className="font-medium">Reason:</span> {form.disposition}</p>
            </div>
            <p className="text-xs text-[#067D62] mt-2 font-medium">
               You'll earn {form.triage?.green_credits_earned || 30} credits when this sells
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep(3)} variant="secondary" size="lg" className="flex-1">
              ← Back
            </Button>
            <Button onClick={handlePublish} size="lg" className="flex-1">
              Publish Listing
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

