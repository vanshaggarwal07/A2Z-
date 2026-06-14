import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ReturnClusters } from '../components/seller/ReturnClusters'
import { ListingQualityScore } from '../components/seller/ListingQualityScore'
import { ConditionBadge } from '../components/ui/Badge'
import { analyzeReturn, type ReturnAnalysis } from '../lib/productFit'
import aiCache from '../data/ai_cache.json'
import seedListings from '../data/seed_listings.json'
// ── AGX AI Features (non-destructive injection) ───────────────────────────
import {
  F1ListingAccuracyScore,
  F2ReturnRiskBadge,
  F3AITriageDashboard,
  F5BuyerReturnPhotoZone,
  F6SellerHealthCard,
  F7ListingMirrorBadge,
  AGXMasterToggle,
} from '../components/seller/AGXAIFeatures'

// ── Mock Data ────────────────────────────────────────────────────────────────

const RETURN_DATA = [
  { month: 'Jan', returns: 28, recovered: 8, fitReturns: 18 },
  { month: 'Feb', returns: 35, recovered: 15, fitReturns: 22 },
  { month: 'Mar', returns: 42, recovered: 22, fitReturns: 28 },
  { month: 'Apr', returns: 38, recovered: 25, fitReturns: 20 },
  { month: 'May', returns: 31, recovered: 19, fitReturns: 16 },
  { month: 'Jun', returns: 29, recovered: 21, fitReturns: 14 },
]

const RETURN_REASONS_PIE = [
  { name: 'Size/Fit Mismatch', value: 38, color: '#CC0C39' },
  { name: 'Not as Described', value: 24, color: '#FF9900' },
  { name: 'Quality Issues', value: 18, color: '#B8860B' },
  { name: 'Compatibility', value: 12, color: '#0066C0' },
  { name: 'Other', value: 8, color: '#6c757d' },
]

// Mock inventory items (Amazon Seller Central style)
const INVENTORY_ITEMS = seedListings.slice(0, 6).map((l, i) => ({
  ...l,
  asin: `B0${String(i + 1).padStart(2, '0')}K7V${['SNXL', 'NRWS', 'P4TQ', 'M2RK', 'JNFL', 'GHXZ'][i]}`,
  sku: `${l.category.slice(0, 3).toLowerCase()}-${String.fromCharCode(65 + i)}`,
  unitsSold: [23, 19, 45, 12, 31, 8][i],
  pageViews: [538, 289, 892, 156, 445, 67][i],
  salesRank: [159056, 159473, 42890, 312000, 98100, 450000][i],
  availableFBA: [220, 171, 89, 45, 132, 22][i],
  inbound: [0, 0, 12, 0, 5, 0][i],
  unfulfillable: [0, 0, 0, 2, 0, 1][i],
  reserved: [7, 61, 3, 0, 14, 2][i],
  fbaFee: [7.64, 11.51, 5.20, 9.30, 6.85, 4.10][i],
  totalFees: [15.89, 19.76, 12.45, 18.50, 14.20, 9.80][i],
  returned_reason: ['Size too small', 'Battery issues', 'Color mismatch', 'Compatibility', 'Not as described', 'Quality'][i],
  customer_review: [
    'Size runs very small — ordered L but fits like M. Disappointed.',
    'Battery dies in 2 hours, listing said 6. Misleading.',
    'Color is grey, not blue as shown. Photos are edited.',
    'Does NOT work with Jio Fiber. Should mention compatibility.',
    'Multiple scratches not shown in any listing photo.',
    'Build quality feels cheap. Not worth the price.',
  ][i],
  photos_submitted: i % 3 === 0,
  video_submitted: i % 5 === 0,
  auto_grade: ['Like New', 'Good', 'Fair', 'Good', 'Fair', 'Good'][i],
  suggested_price: Math.round(l.asking_price * 0.85),
  analysis: null as ReturnAnalysis | null,
  selected: false,
}))

type InventoryItem = (typeof INVENTORY_ITEMS)[0]

// ── Component ─────────────────────────────────────────────────────────────────

export function SellerDashboard() {
  const [items, setItems] = useState(INVENTORY_ITEMS)
  const [activeTab, setActiveTab] = useState<'inventory' | 'returns_ai' | 'fit_model' | 'clusters' | 'quality' | 'bulk'>('inventory')
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('Sales: Highest on top')
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkListed, setBulkListed] = useState(false)
  // AGX: master AI features toggle
  const [agxEnabled, setAgxEnabled] = useState(true)

  const clusters = (aiCache as Record<string, { clusters?: unknown[] }> & { seller_returns?: { clusters: unknown[] } }).seller_returns?.clusters || []

  const totalReturns = RETURN_DATA.reduce((s, d) => s + d.returns, 0)
  const totalRecovered = RETURN_DATA.reduce((s, d) => s + d.recovered, 0)
  const fitReturns = RETURN_DATA.reduce((s, d) => s + d.fitReturns, 0)
  const fitReturnRate = Math.round((fitReturns / totalReturns) * 100)

  const handleAnalyzeReturn = async (item: InventoryItem) => {
    setAnalyzingId(item.id)
    const analysis = await analyzeReturn(
      item.title,
      item.returned_reason,
      item.customer_review,
      item.photos_submitted ? ['photo1.jpg'] : []
    )
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, analysis } : i))
    setAnalyzingId(null)
  }

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item))
  }

  const selectAll = () => {
    const allSelected = items.every(i => i.selected)
    setItems(prev => prev.map(item => ({ ...item, selected: !allSelected })))
  }

  const handleBulkList = () => {
    setBulkListed(true)
    setTimeout(() => setBulkListed(false), 3000)
  }

  const qualityData = [
    { id: 'lst-001', name: 'Baby Monitor', score: 78, issues: ['Missing battery health info'], fix: 'Add battery health percentage to description', prevents: 3 },
    { id: 'lst-002', name: 'Nike Shoes Size 42', score: 62, issues: ['No size chart', 'High return rate category'], fix: 'Add a size comparison chart to reduce 38% return rate', prevents: 12 },
    { id: 'lst-003', name: 'boAt Earphones', score: 71, issues: ['Missing cable condition photo'], fix: 'Add close-up of cable near jack', prevents: 4 },
    { id: 'lst-004', name: 'TP-Link Router', score: 68, issues: ['No ISP compatibility info'], fix: 'List compatible ISPs and modem types', prevents: 8 },
    { id: 'lst-015', name: 'Bajaj Mixer', score: 69, issues: ['Cracked jar photo missing'], fix: 'Add clear photo of cracked small jar', prevents: 7 },
  ]

  const filteredItems = searchQuery
    ? items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.sku.toLowerCase().includes(searchQuery.toLowerCase()) || i.asin.toLowerCase().includes(searchQuery.toLowerCase()))
    : items

  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════ HEADER — Amazon Seller Central exact replica ═══════════ */}
      <header className="bg-[#232F3E] text-white">
        {/* Top bar */}
        <div className="flex items-center h-12 px-4 gap-3">
          {/* Hamburger */}
          <button className="text-white mr-1" aria-label="Menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <svg className="h-6 w-auto" viewBox="0 0 140 24" fill="none">
              <text x="2" y="18" fill="white" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="16">amazon</text>
              <text x="72" y="18" fill="white" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="normal"> seller central</text>
            </svg>
          </div>

          {/* Business dropdown */}
          <div className="hidden md:flex items-center border border-gray-500 rounded px-3 py-1 ml-4 gap-2 text-sm">
            <span className="text-gray-300 text-xs">Your Business</span>
            <span className="font-medium text-sm">| India</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Search"
                className="flex-1 px-3 py-1.5 text-sm text-black rounded-l focus:outline-none h-8"
              />
              <button className="bg-[#FF9900] hover:bg-[#e68900] px-3 rounded-r h-8 flex items-center justify-center">
                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 text-sm">
            {/* AGX F7: Listing Mirror Badge — injected next to nav icons */}
            {agxEnabled && <F7ListingMirrorBadge />}
            {/* AGX Master Toggle */}
            <AGXMasterToggle enabled={agxEnabled} onToggle={() => setAgxEnabled(e => !e)} />
            <button className="text-white hover:text-gray-300" aria-label="Mail">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </button>
            <button className="text-white hover:text-gray-300" aria-label="Settings">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <span className="text-sm">EN ▾</span>
            <span className="text-sm hover:underline cursor-pointer">Help</span>
          </div>
        </div>

        {/* Secondary nav */}
        <div className="bg-[#37475A] px-4 flex items-center h-9 gap-0 text-[13px] overflow-x-auto">
          {['Add Products', 'Campaign Manager', 'Business Reports', 'Fulfillment', 'Manage All Inventory', 'Brand Analytics', 'Certifications'].map(item => (
            <button key={item} className="px-3 py-1 text-gray-200 hover:text-white whitespace-nowrap transition-colors">
              {item}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <span className="text-gray-400 text-xs">Edit</span>
          </div>
        </div>
      </header>

      {/* ═══════════ FAVORITES BAR ═══════════ */}
      <div className="bg-[#f0f4f4] border-b border-gray-200 px-4 py-1.5 text-xs text-[#008296]">
        <span className="mr-2"></span>
        Add your favourite pages here by clicking this icon in the navigation menu.
        <button className="float-right text-[#008296] hover:underline">Hide</button>
      </div>

      {/* ═══════════ KPI STRIP (Seller Central Dashboard style) ═══════════ */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-0 overflow-x-auto">
          {[
            { label: 'MARKETPLACES', value: '1', hasDropdown: true },
            { label: 'ORDERS', value: '0', hasDropdown: true },
            { label: "TODAY'S SALES", value: '₹0.00', hasDropdown: true },
            { label: 'BUYER MESSAGES', value: '0', hasDropdown: true },
            { label: 'BUY BOX WINS', value: '--', hasDropdown: true },
            { label: 'ACCOUNT HEALTH', value: '', hasDropdown: true },
            { label: 'CUSTOMER FEEDBACK', value: '☆☆☆☆☆ (0)', hasDropdown: true },
            { label: 'TOTAL BALANCE', value: '₹0.00', hasDropdown: false },
          ].map((kpi, i) => (
            <div key={kpi.label} className={`flex-1 min-w-[120px] px-3 py-2 ${i > 0 ? 'border-l border-gray-200' : ''}`}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{kpi.label}</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-semibold text-[#0F1111]">{kpi.value}</p>
                {kpi.hasDropdown && (
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT TABS ═══════════ */}
      <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-24 md:pb-6">

        {/* Tab Navigation */}
        <div className="flex items-center gap-0 border-b border-gray-200 mb-4 overflow-x-auto">
          {[
            { id: 'inventory', label: 'Manage Inventory' },
            { id: 'returns_ai', label: 'AI Return Analysis' },
            { id: 'fit_model', label: 'Product Fit Model' },
            { id: 'clusters', label: 'Return Clusters' },
            { id: 'quality', label: 'Listing Quality' },
            { id: 'bulk', label: 'Bulk Re-list' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-[#008296] text-[#008296]'
                  : 'border-transparent text-gray-600 hover:text-[#008296]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══════════ TAB: Manage Inventory ═══════════ */}
        {activeTab === 'inventory' && (
          <div>
            {/* Page title */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-normal text-[#0F1111]">Manage All Inventory</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage your inventory across marketplaces from a single place.
                  <button className="text-[#008296] hover:underline ml-1">Learn more</button>
                  <button className="text-[#008296] hover:underline ml-2">View product tour</button>
                  <button className="text-[#008296] hover:underline ml-2">Provide feedback</button>
                </p>
              </div>
              <div className="flex gap-2">
                <button className="bg-[#232F3E] text-white text-xs font-medium px-3 py-2 rounded hover:bg-[#37475A] transition-colors">
                  Add a variation
                </button>
                <button className="bg-[#FF9900] text-black text-xs font-medium px-3 py-2 rounded hover:bg-[#e68900] transition-colors">
                  Add a product
                </button>
              </div>
            </div>

            {/* Listing Tools links */}
            <div className="text-xs text-gray-600 mb-2 flex flex-wrap gap-x-3 gap-y-1">
              <span className="font-medium text-[#0F1111]">Listing Tools:</span>
              <button className="text-[#008296] hover:underline font-medium">All Inventory</button>
              <button className="text-[#008296] hover:underline">Search Suppressed and Inactive Listings (1)↗</button>
              <button className="text-[#008296] hover:underline">Improve Listing Quality in bulk↗</button>
              <button className="text-[#008296] hover:underline">Potential Duplicates↗</button>
              <button className="text-[#008296] hover:underline">Complete your drafts</button>
              <button className="text-[#008296] hover:underline">Review compliance</button>
            </div>

            <div className="text-xs text-gray-600 mb-4 flex flex-wrap gap-x-3 gap-y-1">
              <span className="font-medium text-[#0F1111]">FBA Inventory Tools:</span>
              <button className="text-[#008296] hover:underline">FBA Dashboard↗</button>
              <button className="text-[#008296] hover:underline">FBA Inventory↗</button>
              <button className="text-[#008296] hover:underline">Shipments↗</button>
              <button className="text-[#008296] hover:underline">FBA Opportunities↗</button>
              <button className="text-[#008296] hover:underline">FBA Analytics↗</button>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <div className="flex border-2 border-[#FF9900] rounded overflow-hidden">
                <select className="bg-[#e6e6e6] text-xs px-2 py-2 border-r border-gray-300 focus:outline-none">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <input
                  type="text"
                  placeholder="Search SKU, Title/Keyword, FNSKU, ASIN, UPC/EAN"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="px-3 py-2 text-xs w-80 focus:outline-none"
                />
                <button className="bg-white px-3 border-l border-gray-200">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-gray-600">Listing status</span>
                <span className="text-xs bg-[#008296] text-white px-2 py-0.5 rounded">Updated</span>
                <span className="text-xs text-gray-600 ml-2">Fulfilled by</span>
                <select className="text-xs border border-gray-300 rounded px-2 py-1">
                  <option>All</option>
                  <option>FBA</option>
                  <option>Self</option>
                </select>
                <button className="text-xs border border-gray-300 rounded px-3 py-1 flex items-center gap-1 hover:bg-gray-50">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  All filters
                </button>
                <button className="text-xs border border-gray-300 rounded px-3 py-1 flex items-center gap-1 hover:bg-gray-50">
                  Preferences
                </button>
              </div>
            </div>

            {/* Sort row */}
            <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
              <span>1 - {filteredItems.length} of {filteredItems.length}</span>
              <div className="flex items-center gap-1">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                >
                  <option>Sales: Highest on top</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Date: Newest first</option>
                </select>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span>Show only Favorites</span>
                <div className="w-8 h-4 bg-gray-300 rounded-full relative cursor-pointer">
                  <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 left-0.5" />
                </div>
              </div>
              <span className="ml-2 bg-[#e6f4ee] text-[#067D62] px-2 py-0.5 rounded text-xs font-medium">Active ({filteredItems.length})</span>
            </div>

            {/* Table header */}
            <div className="border border-gray-200 rounded-t overflow-hidden">
              <div className="bg-[#f3f3f3] border-b border-gray-200 grid grid-cols-12 gap-0 px-3 py-2 text-[11px] font-medium text-gray-600 uppercase">
                <div className="col-span-1 flex items-center gap-1">
                  <input type="checkbox" className="w-3 h-3" />
                </div>
                <div className="col-span-1">Listing status<br/><span className="font-normal normal-case">Next step</span></div>
                <div className="col-span-3">Product details<br/><span className="font-normal normal-case">Image, Title, ASIN, and SKU</span></div>
                <div className="col-span-2">Performance ⓘ<br/><span className="font-normal normal-case">Last 30 days</span></div>
                <div className="col-span-2">Inventory<br/><span className="font-normal normal-case">Fulfilled by and quantity</span></div>
                <div className="col-span-2">Price and shipping cost<br/><span className="font-normal normal-case">Pricing details</span></div>
                <div className="col-span-1">Estimated fees<br/><span className="font-normal normal-case">per unit sold</span></div>
              </div>

              {/* Table rows */}
              {filteredItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-0 px-3 py-3 border-b border-gray-100 hover:bg-[#f7fafa] transition-colors items-start text-xs">
                  {/* Checkbox + star */}
                  <div className="col-span-1 flex items-center gap-1 pt-1">
                    <input type="checkbox" className="w-3 h-3" />
                    <svg className="w-4 h-4 text-gray-300 hover:text-[#FF9900] cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <span className="text-[#067D62] font-semibold">Active</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(2025, 3, 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Product details */}
                  <div className="col-span-3 flex gap-2">
                    <img src={item.images[0]} alt="" className="w-14 h-14 object-cover rounded border border-gray-200 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[#008296] font-medium text-xs leading-tight line-clamp-2 hover:underline cursor-pointer">
                        {item.title}
                      </p>
                      <div className="mt-1 text-[10px] text-gray-500 space-y-0.5">
                        <p>ASIN: <span className="text-[#0F1111]">{item.asin}</span></p>
                        <p>SKU: <span className="text-[#0F1111]">{item.sku}</span></p>
                      </div>
                      <button className="mt-1 text-[10px] text-[#008296] border border-[#008296] rounded px-2 py-0.5 hover:bg-[#f0fafa]">
                        ▼ Variation Family Details
                      </button>
                      {/* AGX F1: Listing Accuracy Score — injected below title */}
                      {agxEnabled && <F1ListingAccuracyScore item={item} />}
                      {/* AGX F2: Return Risk Badge — injected below F1 */}
                      {agxEnabled && <F2ReturnRiskBadge item={item} />}
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="col-span-2 text-[11px] space-y-0.5">
                    <p><span className="text-gray-500">Sales</span> <span className="font-semibold text-[#0F1111] ml-2">₹{item.pageViews}</span></p>
                    <p><span className="text-gray-500">Units sold</span> <span className="ml-2">{item.unitsSold}</span></p>
                    <p><span className="text-gray-500">Page views</span> <span className="ml-2">--</span></p>
                    <p><span className="text-gray-500">Sales rank</span> <span className="ml-2">{item.salesRank.toLocaleString()}</span></p>
                    <p className="text-gray-400">({item.category})</p>
                  </div>

                  {/* Inventory */}
                  <div className="col-span-2 text-[11px] space-y-0.5">
                    <p><span className="font-medium">Available (FBA)</span> <span className="ml-2 font-semibold text-[#0F1111]">{item.availableFBA}</span></p>
                    <p><span className="text-gray-500">Inbound</span> <span className="ml-2">{item.inbound}</span></p>
                    <p><span className="text-gray-500">Unfulfillable</span> <span className="ml-2">{item.unfulfillable}</span></p>
                    <p><span className="text-gray-500">Reserved</span> <span className="ml-2">{item.reserved}</span></p>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-[11px] space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Price</span>
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden ml-1">
                        <span className="bg-gray-50 px-1 text-[10px] text-gray-500 border-r border-gray-300">USD</span>
                        <input type="text" defaultValue={item.asking_price.toFixed(2)} className="w-14 px-1 py-0.5 text-[11px] focus:outline-none" readOnly />
                      </div>
                    </div>
                    <p className="text-gray-500">Shipping cost <span className="ml-2">+ ₹0.00</span></p>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Min price</span>
                      <div className="flex items-center border border-gray-300 rounded overflow-hidden ml-1">
                        <span className="bg-gray-50 px-1 text-[10px] text-gray-500 border-r border-gray-300">USD</span>
                        <input type="text" className="w-10 px-1 py-0.5 text-[11px] focus:outline-none" readOnly />
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 text-[10px]">
                      <p className="text-[#067D62]">● Featured offer <span className="ml-1">₹{item.asking_price.toFixed(2)} + ₹0.00</span></p>
                      <p className="text-[#CC0C39]">● Lowest price <span className="ml-1">₹{item.asking_price.toFixed(2)} + ₹0.00</span></p>
                      <p className="text-[#067D62]">● Business price <span className="ml-1">₹{(item.asking_price * 0.95).toFixed(2)} + ₹0.00</span></p>
                      <button className="text-[#008296] hover:underline">View reference prices</button>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className="col-span-1 text-[11px] space-y-0.5">
                    <p><span className="text-gray-500">Total fees</span> <span className="ml-1 font-semibold">₹{item.totalFees}</span></p>
                    <p><span className="text-gray-500">FBA fee</span> <span className="ml-1">₹{item.fbaFee}</span></p>
                    <button className="text-[#008296] hover:underline text-[10px] mt-1">Calculate revenue</button>
                    <button className="text-gray-400 hover:text-gray-600 mt-1 block">⋮</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ TAB: AI Return Analysis ═══════════ */}
        {activeTab === 'returns_ai' && (
          <div className="space-y-4">
            {/* AGX F5: Buyer Vision Return Flow — injected at top of returns tab */}
            {agxEnabled && (
              <div className="bg-white rounded border border-gray-200 p-5">
                <h3 className="font-bold text-[#0F1111] text-sm mb-2">Buyer Return Photo Verification</h3>
                <p className="text-xs text-gray-500 mb-1">AI validates buyer photos against their stated return reason to reduce fraudulent returns.</p>
                <F5BuyerReturnPhotoZone returnReason="Not as described" />
              </div>
            )}
            <div className="bg-white rounded border border-gray-200 p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-[#232F3E] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">AI</span>
                </div>
                <div>
                  <h2 className="font-bold text-[#0F1111]">AI Return Feedback Analysis</h2>
                  <p className="text-sm text-gray-500">
                    ML model analyzes return descriptions, customer photos & videos to identify the root cause
                    and gives you actionable recommendations to improve product fit.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {items.slice(0, 6).map(item => (
                  <div key={item.id} className="border border-gray-200 rounded p-4 hover:border-[#008296] transition-colors">
                    <div className="flex items-start gap-3">
                      <img src={item.images[0]} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0 border border-gray-200" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-[#0F1111] text-sm">{item.title}</p>
                            <p className="text-xs text-[#CC0C39] mt-0.5 font-medium">Return: {item.returned_reason}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {item.photos_submitted && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Photos</span>}
                            {item.video_submitted && <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded">Video</span>}
                          </div>
                        </div>

                        <div className="mt-2 bg-gray-50 border border-gray-100 rounded p-2 text-xs text-gray-700 italic">
                          "{item.customer_review}"
                        </div>

                        {item.analysis && (
                          <div className="mt-3 bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                                item.analysis.severity === 'critical' ? 'bg-[#CC0C39]' :
                                item.analysis.severity === 'high' ? 'bg-[#FF9900]' :
                                item.analysis.severity === 'medium' ? 'bg-[#B8860B]' : 'bg-gray-500'
                              }`}>{item.analysis.severity.toUpperCase()}</span>
                              <span className="text-xs font-semibold text-gray-700">Category: {item.analysis.category.replace('_', ' ')}</span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 mb-1">Insights:</p>
                              {item.analysis.actionableInsights.map((insight, i) => (
                                <p key={i} className="text-xs text-gray-700 flex items-start gap-1"><span className="text-[#067D62]">•</span> {insight}</p>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#FF9900] mb-1">How to fix:</p>
                              {item.analysis.sellerRecommendations.map((rec, i) => (
                                <p key={i} className="text-xs text-gray-700 flex items-start gap-1"><span className="text-[#FF9900]">→</span> {rec}</p>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 pt-1 border-t border-[#c3e6cb] text-xs text-[#067D62] font-medium">
                              <span>Can prevent ~{item.analysis.predictedImpact.returnsPreventable} returns/month</span>
                              <span>Save ~₹{item.analysis.predictedImpact.revenueRecoverable.toLocaleString('en-IN')}/month</span>
                            </div>
                          </div>
                        )}

                        {!item.analysis && (
                          <button
                            onClick={() => handleAnalyzeReturn(item)}
                            disabled={analyzingId === item.id}
                            className="mt-2 bg-[#232F3E] hover:bg-[#37475A] text-white text-xs font-medium px-4 py-2 rounded transition-colors disabled:opacity-60 flex items-center gap-2"
                          >
                            {analyzingId === item.id ? (
                              <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Analyzing...</>
                            ) : (
                              <>Analyze with AI</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TAB: Product Fit Model ═══════════ */}
        {activeTab === 'fit_model' && <ProductFitModelTab />}

        {/* ═══════════ TAB: Return Clusters ═══════════ */}
        {activeTab === 'clusters' && (
          <div>
            <div className="bg-white border border-gray-200 rounded p-5 mb-4">
              <h2 className="font-bold text-[#0F1111] mb-1">AI Return Reason Clustering</h2>
              <p className="text-sm text-gray-500">
                AI analysed 200 return reasons this month and found {clusters.length} clusters. Fixing the top 2 could prevent ~73 returns/month.
              </p>
            </div>
            {clusters.length > 0 ? (
              <ReturnClusters clusters={clusters as Parameters<typeof ReturnClusters>[0]['clusters']} />
            ) : (
              <p className="text-gray-400 text-sm">Loading clusters from cache…</p>
            )}
          </div>
        )}

        {/* ═══════════ TAB: Quality Scores ═══════════ */}
        {activeTab === 'quality' && (
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded p-5 mb-4">
              <h2 className="font-bold text-[#0F1111] mb-1">Listing Quality Scores</h2>
              <p className="text-sm text-gray-500">AI-computed quality score. Higher score = fewer returns.</p>
            </div>
            {qualityData.map(q => (
              <ListingQualityScore key={q.id} score={q.score} productName={q.name} mainIssues={q.issues} topFix={q.fix} returnsPreventable={q.prevents} />
            ))}
          </div>
        )}

        {/* ═══════════ TAB: Bulk Re-list ═══════════ */}
        {activeTab === 'bulk' && (
          <div>
            {/* AGX F3 + F4: AI Triage Kanban + Dynamic Relisting — injected at top of bulk tab */}
            {agxEnabled && <F3AITriageDashboard items={items} />}
            <div className="bg-white border border-gray-200 rounded p-5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[#0F1111] mb-1">Bulk Re-list to Neighbourhood</h2>
                  <p className="text-sm text-gray-500">{items.filter(i => i.selected).length} of {items.length} selected — recover revenue by relisting returns locally</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-[#008296] hover:underline font-medium">
                    {items.every(i => i.selected) ? 'Deselect All' : 'Select All'}
                  </button>
                  {items.some(i => i.selected) && (
                    <button onClick={handleBulkList} className="bg-[#FF9900] text-black font-medium text-xs px-4 py-2 rounded hover:bg-[#e68900] transition-colors">
                      Re-list Selected
                    </button>
                  )}
                </div>
              </div>
            </div>

            {bulkListed && (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-3 text-sm text-[#067D62] font-semibold">
                {items.filter(i => i.selected).length} items relisted to Neighborhood!
              </div>
            )}

            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className={`bg-white rounded border-2 p-3 flex items-center gap-3 transition-all ${item.selected ? 'border-[#008296] bg-[#f0fafa]' : 'border-gray-200'}`}>
                  <input type="checkbox" checked={item.selected} onChange={() => toggleItem(item.id)} className="w-4 h-4 accent-[#008296]" />
                  <img src={item.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F1111] truncate">{item.title}</p>
                    <p className="text-xs text-[#CC0C39]">Return: {item.returned_reason}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <ConditionBadge grade={item.auto_grade} />
                      <span className="text-xs font-semibold text-[#0F1111]">₹{item.suggested_price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ DASHBOARD CARDS (Seller Central Home) ═══════════ */}
      {activeTab === 'inventory' && (
        <div className="bg-[#f0f4f4] px-4 py-6 border-t border-gray-200">
          <div className="max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Returns Intelligence */}
              <div className="bg-white rounded shadow-sm border border-gray-200 p-4 lg:col-span-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#0F1111] text-sm">Returns Intelligence</h3>
                  <button className="text-gray-400 hover:text-gray-600">...</button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#CC0C39]/10 flex items-center justify-center">
                    <span className="text-[#CC0C39] text-sm"></span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#CC0C39]">{fitReturnRate}% are fit-related returns</p>
                    <p className="text-[10px] text-gray-500">Preventable with better listing info</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('returns_ai')} className="w-full bg-[#CC0C39] text-white text-xs font-medium py-2 rounded hover:bg-[#a80a2f] transition-colors mt-2">
                  View AI Analysis
                </button>
              </div>

              {/* Product Fit */}
              <div className="bg-white rounded shadow-sm border border-gray-200 p-4 lg:col-span-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#0F1111] text-sm">Product Fit Model</h3>
                  <button className="text-gray-400 hover:text-gray-600">...</button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#067D62]/10 flex items-center justify-center">
                    <span className="text-[#067D62] text-sm"></span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#067D62]">-34% return reduction</p>
                    <p className="text-[10px] text-gray-500">Show match % to customers</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('fit_model')} className="w-full bg-[#067D62] text-white text-xs font-medium py-2 rounded hover:bg-[#055a47] transition-colors mt-2">
                  Configure Fit Model
                </button>
              </div>

              {/* News */}
              <div className="bg-white rounded shadow-sm border border-gray-200 p-4 lg:col-span-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-[#0F1111] text-sm">News</h3>
                  <button className="text-gray-400 hover:text-gray-600">...</button>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-[10px] text-gray-400">6 JAN, 2026</p>
                    <p className="text-[#008296] hover:underline cursor-pointer">Product Fit Model now reduces returns by 34%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">5 JAN, 2026</p>
                    <p className="text-[#008296] hover:underline cursor-pointer">AI Return Analysis available for all sellers</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">4 JAN, 2026</p>
                    <p className="text-[#008296] hover:underline cursor-pointer">Tips for success during Republic Day Sale</p>
                  </div>
                </div>
              </div>

              {/* Tutorials */}
              <div className="bg-[#232F3E] rounded shadow-sm p-4 text-white lg:col-span-1 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-sm mb-2">Tutorials and Training</h3>
                  <p className="text-xs text-gray-300 mb-3">Learn how to reduce returns and improve product fit</p>
                  <button className="bg-[#FF9900] text-black text-xs font-medium px-3 py-1.5 rounded hover:bg-[#e68900]">
                    Visit Seller University
                  </button>
                </div>
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-[#008296]" />
              </div>

              {/* AGX F6: Seller Return Health Score — appended to metrics row */}
              {agxEnabled && <F6SellerHealthCard />}

              {/* List Globally */}
              <div className="bg-[#232F3E] rounded shadow-sm p-4 text-white lg:col-span-1 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-sm mb-2">List Globally</h3>
                  <p className="text-xs text-gray-300 mb-3">Get help reaching millions of customers internationally</p>
                  <button className="bg-[#FF9900] text-black text-xs font-medium px-3 py-1.5 rounded hover:bg-[#e68900]">
                    Manage International Listings
                  </button>
                </div>
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-transparent to-[#067D62]" />
              </div>
            </div>

            {/* Seller Forums */}
            <div className="mt-4 bg-white rounded shadow-sm border border-gray-200 p-4 max-w-sm">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-[#0F1111] text-sm">Seller Forums</h3>
                <button className="text-gray-400 hover:text-gray-600">...</button>
              </div>
              <div className="text-xs">
                <p className="text-[10px] text-gray-400">5 JAN, 2026</p>
                <p className="text-[#008296] hover:underline cursor-pointer">Amazon Product Fit Model rollout for Q1 2026</p>
                <p className="text-[#008296] hover:underline cursor-pointer text-[10px] mt-1">Read more ›</p>
              </div>
              <span className="inline-block mt-2 text-[9px] bg-[#CC0C39] text-white px-2 py-0.5 rounded font-medium">FEEDBACK ×</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Product Fit Model Tab ─────────────────────────────────────────────────────

function ProductFitModelTab() {
  const MOCK_PRODUCTS = [
    {
      id: 'fit-1', title: 'Nike Air Max Running Shoes — Size 42', category: 'fashion', price: 3499,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
      matchPercentage: 72, matchLabel: 'Good Match' as const,
      reasons: ['You bought Nike shoes 3 times before', 'Price is within your budget', 'Running shoes category matches your activity'],
      warnings: ['Size 42 — you previously returned size 42 Nike for being too small. Consider size 43.'],
      improvements: ['Add size comparison chart vs Adidas/Puma', 'Show foot width measurements', 'Add customer photos for size reference'],
    },
    {
      id: 'fit-2', title: 'TP-Link N300 WiFi Router', category: 'electronics', price: 1899,
      image: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=400&q=80',
      matchPercentage: 45, matchLabel: 'Fair Match' as const,
      reasons: ['Electronics is your top category'],
      warnings: ['41% of buyers returned this — check ISP compatibility', 'Your ISP (Jio Fiber) has reported issues with this model'],
      improvements: ['Add ISP compatibility list prominently', 'Show speed test results by ISP', 'Add setup difficulty level'],
    },
    {
      id: 'fit-3', title: 'Samsung Galaxy Tab A7 Lite', category: 'electronics', price: 14999,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
      matchPercentage: 89, matchLabel: 'Excellent Match' as const,
      reasons: ['You searched for tablets 5 times this month', 'Budget matches avg electronics spend', 'Samsung brand loyalty (3 past purchases)'],
      warnings: [],
      improvements: ['Show battery life comparison with iPad', 'Add use-case labels (reading/gaming/work)'],
    },
    {
      id: 'fit-4', title: 'Bajaj Mixer Grinder 750W', category: 'appliances', price: 2199,
      image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
      matchPercentage: 61, matchLabel: 'Good Match' as const,
      reasons: ['Appliances in your recent searches', 'Price within typical spend'],
      warnings: ['22% return rate — most report loud noise', 'You live in apartment — noise may be concern'],
      improvements: ['Add decibel rating comparison', 'Include video showing noise level', 'Show jar capacity for Indian recipes'],
    },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-[#FF9900] flex items-center justify-center flex-shrink-0">
            <span className="text-xl"></span>
          </div>
          <div>
            <h2 className="font-bold text-[#0F1111] text-lg">Product Fit ML Model</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analyzes customer <strong>order history</strong>, <strong>cart</strong>, and <strong>wishlist</strong> to show a match percentage.
              Higher match = higher confidence = fewer returns.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div className="bg-[#f0f9f4] border border-[#c3e6cb] rounded p-3 text-center">
                <p className="text-xl font-bold text-[#067D62]">-34%</p>
                <p className="text-[10px] text-gray-600">Avg return reduction</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
                <p className="text-xl font-bold text-[#FF9900]">+18%</p>
                <p className="text-[10px] text-gray-600">Conversion boost</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <p className="text-xl font-bold text-[#0066C0]">2.1s</p>
                <p className="text-[10px] text-gray-600">Decision time saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <h3 className="font-semibold text-[#0F1111] mb-3">How It Works</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { step: '1', title: 'Analyze History', desc: 'Reads order history, cart & wishlist', icon: '1' },
            { step: '2', title: 'Match Features', desc: 'Compares product with user preferences', icon: '2' },
            { step: '3', title: 'Show Match %', desc: 'Displays fit score on product page', icon: '3' },
            { step: '4', title: 'Prevent Returns', desc: 'Warns on low-fit before purchase', icon: '4' },
          ].map(s => (
            <div key={s.step} className="text-center p-3 border border-gray-100 rounded">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-[10px] font-bold text-[#232F3E]">Step {s.step}</p>
              <p className="text-xs font-semibold text-[#0F1111]">{s.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product previews */}
      <div className="bg-white border border-gray-200 rounded p-5">
        <h3 className="font-semibold text-[#0F1111] mb-1">Live Preview — Customer View</h3>
        <p className="text-xs text-gray-500 mb-4">How your products appear with the Product Fit badge</p>
        <div className="space-y-3">
          {MOCK_PRODUCTS.map(product => {
            const matchColor = product.matchPercentage >= 80 ? '#067D62' : product.matchPercentage >= 60 ? '#FF9900' : '#CC0C39'
            return (
              <div key={product.id} className="border border-gray-200 rounded p-4">
                <div className="flex gap-4">
                  <img src={product.image} alt="" className="w-16 h-16 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#0F1111] text-sm">{product.title}</p>
                        <p className="text-base font-bold text-[#0F1111]">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="flex-shrink-0 text-center">
                        <div className="w-12 h-12 rounded-full border-[3px] flex items-center justify-center" style={{ borderColor: matchColor }}>
                          <span className="text-xs font-bold" style={{ color: matchColor }}>{product.matchPercentage}%</span>
                        </div>
                        <p className="text-[9px] font-semibold mt-0.5" style={{ color: matchColor }}>{product.matchLabel}</p>
                      </div>
                    </div>
                    {product.reasons.length > 0 && (
                      <div className="mt-1.5">
                        {product.reasons.map((r, i) => (
                          <p key={i} className="text-[11px] text-gray-600"><span className="text-[#067D62]">✓</span> {r}</p>
                        ))}
                      </div>
                    )}
                    {product.warnings.length > 0 && (
                      <div className="mt-1.5 bg-[#FFF3CD] rounded px-2 py-1 text-[11px] text-gray-700">
                        {product.warnings.map((w, i) => <p key={i}>{w}</p>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-[#232F3E] uppercase mb-1">Seller Actions:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.improvements.map((imp, i) => (
                      <span key={i} className="text-[10px] bg-orange-50 text-[#e68900] border border-[#FF9900]/20 px-2 py-0.5 rounded-full">{imp}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
