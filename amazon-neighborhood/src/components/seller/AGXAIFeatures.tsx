/**
 * AGX AI Features — Amazon Seller Hub Enhancer
 * 7 features injected non-destructively into existing SellerDashboard.
 * All wrapped in .agx-injected, collapsible, keyboard accessible, fail-safe.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ── Shared types ──────────────────────────────────────────────────────────────
interface InventoryItem {
  id: string
  asin: string
  title: string
  images: string[]
  asking_price: number
  suggested_price: number
  returned_reason: string
  auto_grade: string
  category: string
}

// ── Shared utilities ──────────────────────────────────────────────────────────

function agxFetch(endpoint: string): Promise<null> {
  // Simulated API call — always returns null (ghost state on failure)
  return new Promise(resolve => setTimeout(() => resolve(null), 600))
}

function useOnEscape(cb: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') cb() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [cb])
}

function AGXDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useOnEscape(onClose)
  if (!open) return null
  return createPortal(
    <div className="agx-injected" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        style={{ width: 420, maxWidth: '95vw', background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ background: '#232F3E', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          <button onClick={onClose} aria-label="Close drawer" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body
  )
}

function AGXModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useOnEscape(onClose)
  if (!open) return null
  return createPortal(
    <div className="agx-injected" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        style={{ background: '#fff', borderRadius: 8, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}
      >
        <div style={{ background: '#232F3E', color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px 8px 0 0' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{title}</span>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>,
    document.body
  )
}

// ── Accuracy score bar ────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return '#067D62'
  if (score >= 50) return '#FF9900'
  return '#CC0C39'
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 1 — AI Listing Accuracy Score
// ═══════════════════════════════════════════════════════════════════════════
export function F1ListingAccuracyScore({ item }: { item: InventoryItem }) {
  const [score] = useState(() => Math.floor(45 + Math.random() * 55))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(true)

  const issues = [
    score < 80 ? 'Main photo low-resolution (< 1000px)' : null,
    score < 70 ? 'Description missing warranty/returns info' : null,
    score < 60 ? 'Title keyword mismatch with search trends' : null,
    score < 50 ? 'No secondary angles (360° recommended)' : null,
  ].filter(Boolean) as string[]

  if (!visible) return null

  return (
    <div className="agx-injected" style={{ margin: '6px 0', padding: '8px 10px', background: '#f8f9fa', borderRadius: 6, border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#37475A', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ background: '#232F3E', color: '#FF9900', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>AI</span>
          Listing Accuracy Score
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(score) }}>{score}/100</span>
          <button
            onClick={() => { setLoading(true); agxFetch(`/api/listing-accuracy?asin=${item.asin}`).then(() => { setLoading(false); setDrawerOpen(true) }) }}
            style={{ fontSize: 10, background: '#FF9900', color: '#000', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {loading ? '…' : 'Fix Issues'}
          </button>
          <button onClick={() => setVisible(false)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12, lineHeight: 1 }}>✕</button>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
        <div title={`${score}/100 — ${issues.length} issue(s) detected`} style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
      {issues.length > 0 && <p style={{ fontSize: 10, color: '#666', marginTop: 3 }}>⚠ {issues[0]}</p>}

      <AGXDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Fix Listing Issues">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>AI-detected issues dragging your score for <strong>{item.title}</strong>:</p>
        {issues.length === 0
          ? <p style={{ color: '#067D62', fontWeight: 600 }}>✓ No issues detected — listing looks great!</p>
          : issues.map((issue, i) => (
            <div key={i} style={{ background: '#fff8e7', border: '1px solid #ffe0a0', borderRadius: 6, padding: '10px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#7a5800' }}>Issue {i + 1}: {issue}</p>
              <p style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                {i === 0 ? 'Upload images ≥ 1000×1000px on white background. Resolution directly impacts conversion rate.' : ''}
                {i === 1 ? 'Add a "What\'s in the box" section and clearly state your return window.' : ''}
                {i === 2 ? 'Add trending keywords: "used", "second-hand", "certified" in the first 80 characters of title.' : ''}
                {i === 3 ? 'Add 3+ angles including front, back, and close-up of any wear.' : ''}
              </p>
              <button style={{ marginTop: 8, fontSize: 11, color: '#007185', background: 'none', border: '1px solid #007185', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                Apply Fix →
              </button>
            </div>
          ))
        }
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 16 }}>AGX Feature 1 · Data from /api/listing-accuracy</p>
      </AGXDrawer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 2 — Return Prediction Score per SKU
// ═══════════════════════════════════════════════════════════════════════════
export function F2ReturnRiskBadge({ item }: { item: InventoryItem }) {
  const [risk] = useState(() => Math.floor(5 + Math.random() * 45))
  const [modalOpen, setModalOpen] = useState(false)
  const [visible, setVisible] = useState(true)

  const badgeColor = risk < 10 ? '#067D62' : risk <= 25 ? '#FF9900' : '#CC0C39'
  const benchmarkRisk = Math.floor(risk * 0.7)

  const reasons = [
    risk > 30 ? 'Category has historically high return rate (electronics/fashion)' : 'Size/fit mismatch likely based on listing data',
    'Condition grade photos incomplete — buyers unsure of actual state',
    'Price-to-condition ratio raises buyer skepticism',
  ].slice(0, 3)

  if (!visible) return null

  return (
    <div className="agx-injected" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
      <button
        onClick={() => setModalOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: badgeColor + '18', border: `1px solid ${badgeColor}`, borderRadius: 99, padding: '2px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: badgeColor }}
        aria-label={`Return risk: ${risk}%`}
      >
        <span>↩</span> {risk}% return risk
      </button>
      <button onClick={() => setVisible(false)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 11 }}>✕</button>

      <AGXModal open={modalOpen} onClose={() => setModalOpen(false)} title="Return Risk Breakdown">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 12px', background: badgeColor + '12', borderRadius: 8, border: `1px solid ${badgeColor}33` }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: `4px solid ${badgeColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: badgeColor }}>{risk}%</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: badgeColor, fontSize: 14 }}>{risk < 10 ? 'Low' : risk <= 25 ? 'Moderate' : 'High'} Return Risk</p>
            <p style={{ fontSize: 12, color: '#555' }}>Category benchmark: {benchmarkRisk}% · You are {risk > benchmarkRisk ? `+${risk - benchmarkRisk}% above` : 'below'} average</p>
          </div>
        </div>

        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#0F1111' }}>Top 3 reasons buyers may return this SKU:</p>
        {reasons.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: '#CC0C39', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
            <p style={{ fontSize: 12, color: '#444' }}>{r}</p>
          </div>
        ))}

        <button style={{ marginTop: 16, width: '100%', background: '#FF9900', border: 'none', borderRadius: 6, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#000' }}
          onClick={() => setModalOpen(false)}>
          ✦ Optimize Listing →
        </button>
        <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 }}>AGX Feature 2 · /api/return-risk?asin={item.asin}</p>
      </AGXModal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 3 — AI Triage Kanban Dashboard
// ═══════════════════════════════════════════════════════════════════════════
const TRIAGE_COLS = ['Resell As-Is', 'Refurbish', 'Donate', 'Recycle', 'Exchange']

interface TriageCard { id: string; title: string; image: string; reason: string; similarity: number; price: number; col: string }

export function F3AITriageDashboard({ items }: { items: InventoryItem[] }) {
  const [visible, setVisible] = useState(true)
  const [cards, setCards] = useState<TriageCard[]>(() =>
    items.slice(0, 6).map((item, i) => ({
      id: item.id,
      title: item.title,
      image: item.images[0],
      reason: item.returned_reason,
      similarity: Math.floor(60 + Math.random() * 39),
      price: item.suggested_price,
      col: TRIAGE_COLS[i % TRIAGE_COLS.length],
    }))
  )
  const [dragging, setDragging] = useState<string | null>(null)
  const [relistModal, setRelistModal] = useState<TriageCard | null>(null)
  const [applied, setApplied] = useState(false)

  const handleDrop = (col: string) => {
    if (!dragging) return
    setCards(prev => prev.map(c => c.id === dragging ? { ...c, col } : c))
    setDragging(null)
  }

  const applyAll = () => { setApplied(true); setTimeout(() => setApplied(false), 2500) }

  if (!visible) return null

  return (
    <div className="agx-injected" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#232F3E', color: '#FF9900', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>AI</span>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0F1111' }}>AI Triage Dashboard</h3>
          <span style={{ background: '#CC0C39', color: '#fff', fontSize: 10, borderRadius: 99, padding: '1px 7px', fontWeight: 700 }}>{cards.length} pending</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={applyAll} style={{ background: '#FF9900', border: 'none', borderRadius: 5, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#000' }}>
            {applied ? '✓ Applied!' : 'Apply All AI Recommendations'}
          </button>
          <button onClick={() => setVisible(false)} style={{ background: '#f0f4f4', border: '1px solid #ddd', borderRadius: 5, padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>Hide</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, overflowX: 'auto' }}>
        {TRIAGE_COLS.map(col => (
          <div key={col}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(col)}
            style={{ background: '#f8f9fa', border: '2px dashed #ddd', borderRadius: 8, minHeight: 200, padding: 8 }}
          >
            <p style={{ fontWeight: 700, fontSize: 11, color: '#37475A', marginBottom: 8, textAlign: 'center' }}>{col}</p>
            {cards.filter(c => c.col === col).map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={() => setDragging(card.id)}
                style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: 8, marginBottom: 8, cursor: 'grab', boxShadow: dragging === card.id ? '0 4px 12px rgba(0,0,0,0.15)' : 'none' }}
              >
                <img src={card.image} alt="" style={{ width: '100%', height: 64, objectFit: 'cover', borderRadius: 4, marginBottom: 6 }} />
                <p style={{ fontSize: 10, fontWeight: 600, color: '#0F1111', lineHeight: 1.3, marginBottom: 4 }}>{card.title.slice(0, 40)}…</p>
                <p style={{ fontSize: 10, color: '#CC0C39', marginBottom: 4 }}>↩ {card.reason}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, background: '#e6f4ee', color: '#067D62', borderRadius: 99, padding: '1px 6px', fontWeight: 600 }}>{card.similarity}% match</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0F1111' }}>₹{card.price.toLocaleString()}</span>
                </div>
                <button onClick={() => setRelistModal(card)} style={{ width: '100%', background: '#232F3E', color: '#FF9900', border: 'none', borderRadius: 4, padding: '4px 0', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                  Auto-Relist →
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Feature 4 modal — Auto-Relist */}
      {relistModal && <F4RelistModal card={relistModal} onClose={() => setRelistModal(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 4 — Dynamic Relisting Engine
// ═══════════════════════════════════════════════════════════════════════════
function F4RelistModal({ card, onClose }: { card: TriageCard; onClose: () => void }) {
  const [grade, setGrade] = useState(card.col === 'Resell As-Is' ? 'Like New' : card.col === 'Refurbish' ? 'Good' : 'Fair')
  const [price, setPrice] = useState(card.price)
  const [desc, setDesc] = useState(`This is a ${grade.toLowerCase()} condition item returned due to "${card.reason}". Fully functional. All original accessories included. Verified by Amazon Neighbourhood AI.`)
  const [listType, setListType] = useState<'renewed' | 'used'>('used')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  const publish = () => {
    setPublishing(true)
    agxFetch('/api/relist').then(() => { setPublishing(false); setPublished(true); setTimeout(onClose, 1800) })
  }

  return (
    <AGXModal open={true} onClose={onClose} title="Auto-Relist Draft">
      {published ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: 32 }}>✓</p>
          <p style={{ fontWeight: 700, color: '#067D62', fontSize: 16 }}>Draft Published!</p>
          <p style={{ color: '#555', fontSize: 13 }}>Listing live on Amazon Neighbourhood.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, padding: 10, background: '#f8f9fa', borderRadius: 6 }}>
            <img src={card.image} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 4 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 13 }}>{card.title}</p>
              <p style={{ fontSize: 11, color: '#CC0C39' }}>Return reason: {card.reason}</p>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#0F1111', display: 'block', marginBottom: 4 }}>AI Condition Label</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 5, padding: '7px 10px', fontSize: 13 }}>
              {['Like New', 'Good', 'Fair', 'Poor'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#0F1111', display: 'block', marginBottom: 4 }}>AI Depreciated Price (editable)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: 5, overflow: 'hidden' }}>
              <span style={{ background: '#f0f0f0', padding: '7px 10px', fontSize: 13, borderRight: '1px solid #ddd' }}>₹</span>
              <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} style={{ flex: 1, border: 'none', padding: '7px 10px', fontSize: 13, outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#0F1111', display: 'block', marginBottom: 4 }}>AI Condition Description (editable)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 5, padding: '7px 10px', fontSize: 12, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            {(['renewed', 'used'] as const).map(t => (
              <button key={t} onClick={() => setListType(t)} style={{ flex: 1, border: `2px solid ${listType === t ? '#FF9900' : '#ddd'}`, borderRadius: 6, padding: '8px 0', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: listType === t ? '#fff8e7' : '#fff', color: listType === t ? '#c46a00' : '#555' }}>
                {t === 'renewed' ? '♻ Amazon Renewed' : '📦 Used Listing'}
              </button>
            ))}
          </div>

          <button onClick={publish} disabled={publishing} style={{ width: '100%', background: '#FF9900', border: 'none', borderRadius: 6, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#000', opacity: publishing ? 0.7 : 1 }}>
            {publishing ? 'Publishing…' : '✦ Publish Draft'}
          </button>
          <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 }}>AGX Feature 4 · /api/relist · No re-photography required</p>
        </>
      )}
    </AGXModal>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 5 — Buyer Vision Return Flow (photo upload zone)
// ═══════════════════════════════════════════════════════════════════════════
export function F5BuyerReturnPhotoZone({ returnReason = 'Not as described' }: { returnReason?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [detection, setDetection] = useState<string | null>(null)
  const [mismatch, setMismatch] = useState(false)
  const [visible, setVisible] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setAnalyzing(true)
    setDetection(null)
    setMismatch(false)
    agxFetch('/api/validate-return-photo').then(() => {
      const detections = ['screen scratch', 'box damage', 'missing accessory', 'color mismatch']
      const detected = detections.slice(0, Math.ceil(Math.random() * 2)).join(', ')
      setDetection(detected)
      setMismatch(returnReason === 'Not as described' && detected.includes('color'))
      setAnalyzing(false)
    })
  }

  if (!visible) return null

  return (
    <div className="agx-injected" style={{ margin: '12px 0', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ background: '#232F3E', color: '#fff', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ background: '#FF9900', color: '#000', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>AI</span>
          Show us the issue (required)
        </span>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
      <div style={{ padding: 12 }}>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{ border: `2px dashed ${preview ? '#067D62' : '#ddd'}`, borderRadius: 8, padding: preview ? 8 : 24, textAlign: 'center', cursor: 'pointer', background: preview ? '#f0f9f4' : '#fafafa', transition: 'all 0.2s' }}
        >
          {preview ? (
            <img src={preview} alt="Return" style={{ maxHeight: 120, borderRadius: 6, objectFit: 'cover' }} />
          ) : (
            <>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#aaa" strokeWidth={1.5} style={{ margin: '0 auto 8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Drag & drop or click to upload</p>
              <p style={{ fontSize: 11, color: '#aaa' }}>JPG, PNG, HEIC supported</p>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

        {analyzing && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#007185', fontSize: 12 }}>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25}/><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity={0.75}/></svg>
            AI is reviewing your photo…
          </div>
        )}
        {detection && !analyzing && (
          <div style={{ marginTop: 10, background: '#f0f9f4', border: '1px solid #c3e6cb', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#0a5c37' }}>
            ✓ We detected: <strong>{detection}</strong>
          </div>
        )}
        {mismatch && (
          <div style={{ marginTop: 6, background: '#fff8e7', border: '1px solid #ffe0a0', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#7a5800' }}>
            ⚠ Your photo shows <strong>{detection}</strong> but you selected <strong>"{returnReason}"</strong> — are you sure?
          </div>
        )}
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 8 }}>AGX Feature 5 · /api/validate-return-photo</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 6 — Seller Return Health Score Card
// ═══════════════════════════════════════════════════════════════════════════
export function F6SellerHealthCard() {
  const [score] = useState(72)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [visible, setVisible] = useState(true)

  const color = score >= 75 ? '#067D62' : score >= 50 ? '#FF9900' : '#CC0C39'
  const trend = +8
  const subMetrics = [
    { label: 'Listing Accuracy Avg', value: '74/100', good: true },
    { label: 'Return Rate vs Benchmark', value: '+3.2%', good: false },
    { label: 'Recovery Rate', value: '61%', good: true },
  ]

  if (!visible) return null

  return (
    <div className="agx-injected" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#37475A', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ background: '#232F3E', color: '#FF9900', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>AI</span>
            Return Health Score
          </p>
        </div>
        <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, lineHeight: 1 }}>…</button>
      </div>

      {/* Circular gauge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
              strokeLinecap="round" transform="rotate(-90 32 32)" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color }}>{score}</span>
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 700, color, fontSize: 13 }}>{score >= 75 ? 'Good' : score >= 50 ? 'Needs Work' : 'At Risk'}</p>
          <p style={{ fontSize: 11, color: trend > 0 ? '#067D62' : '#CC0C39', fontWeight: 600 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last 30 days
          </p>
        </div>
      </div>

      {subMetrics.map(m => (
        <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #f0f0f0', fontSize: 11 }}>
          <span style={{ color: '#666' }}>{m.label}</span>
          <span style={{ fontWeight: 700, color: m.good ? '#067D62' : '#CC0C39' }}>{m.value}</span>
        </div>
      ))}

      <button onClick={() => setDrawerOpen(true)} style={{ marginTop: 10, width: '100%', background: '#232F3E', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
        View Full Report →
      </button>

      <AGXDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Return Health — Per-SKU Breakdown">
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>Detailed return health breakdown by SKU:</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f3f3f3' }}>
              {['SKU', 'Accuracy', 'Return Rate', 'Recovery'].map(h => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #ddd' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['elec-A', 'fash-B', 'appl-C', 'book-D', 'toy-E'].map((sku, i) => {
              const acc = [78, 62, 85, 70, 55][i]
              const ret = [12, 28, 8, 15, 33][i]
              const rec = [65, 48, 78, 60, 40][i]
              return (
                <tr key={sku} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '7px 8px', fontWeight: 600, color: '#0F1111' }}>{sku}</td>
                  <td style={{ padding: '7px 8px', color: acc >= 75 ? '#067D62' : '#FF9900', fontWeight: 600 }}>{acc}/100</td>
                  <td style={{ padding: '7px 8px', color: ret <= 10 ? '#067D62' : ret <= 25 ? '#FF9900' : '#CC0C39', fontWeight: 600 }}>{ret}%</td>
                  <td style={{ padding: '7px 8px', color: rec >= 60 ? '#067D62' : '#FF9900', fontWeight: 600 }}>{rec}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p style={{ fontSize: 10, color: '#aaa', marginTop: 16 }}>AGX Feature 6 · /api/seller-health-score</p>
      </AGXDrawer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE 7 — Listing Mirror Checker (floating nav badge + drift panel)
// ═══════════════════════════════════════════════════════════════════════════
export function F7ListingMirrorBadge() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  const drifts = [
    { asin: 'B001K7VSNXL', title: 'Baby Monitor Pro', severity: 'Critical Mismatch', current: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&q=60', buyer: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=200&q=60' },
    { asin: 'B002K7VNRWS', title: 'boAt Earphones', severity: 'Moderate Drift', current: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=60', buyer: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=200&q=60' },
  ].filter(d => !dismissed.includes(d.asin))

  const openPanel = () => {
    setLoading(true)
    agxFetch('/api/listing-drift').then(() => { setLoading(false); setPanelOpen(true) })
  }

  return (
    <>
      {/* Floating badge injected next to nav */}
      <div className="agx-injected" style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
        <button
          onClick={openPanel}
          aria-label={`Listing Mirror — ${drifts.length} drift${drifts.length !== 1 ? 's' : ''} detected`}
          title="Listing Mirror Checker"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          {loading ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity={0.25}/><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity={0.75}/></svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          )}
          Mirror
        </button>
        {drifts.length > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 4, width: 8, height: 8, background: '#CC0C39', borderRadius: '50%', border: '1.5px solid #232F3E' }} />
        )}
      </div>

      <AGXDrawer open={panelOpen} onClose={() => setPanelOpen(false)} title="Listing Drift Detected">
        {drifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#067D62' }}>
            <p style={{ fontSize: 32 }}>✓</p>
            <p style={{ fontWeight: 700 }}>All listings look accurate!</p>
            <p style={{ fontSize: 12, color: '#555' }}>No drift detected. Auto-refreshes every 24 hours.</p>
          </div>
        ) : (
          drifts.map(drift => (
            <div key={drift.asin} style={{ marginBottom: 20, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: drift.severity === 'Critical Mismatch' ? '#CC0C39' : '#FF9900', color: '#fff', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>{drift.severity}</span>
                <span style={{ fontSize: 11, opacity: 0.85 }}>ASIN: {drift.asin.slice(0, 12)}</span>
              </div>
              <div style={{ padding: 12 }}>
                <p style={{ fontWeight: 600, fontSize: 12, marginBottom: 8 }}>{drift.title}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Your listing photo</p>
                    <img src={drift.current} alt="Current listing" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 5, border: '2px solid #e5e7eb' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>Buyer-submitted photo</p>
                    <div style={{ position: 'relative' }}>
                      <img src={drift.buyer} alt="Buyer photo" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 5, border: `2px solid ${drift.severity === 'Critical Mismatch' ? '#CC0C39' : '#FF9900'}` }} />
                      <div style={{ position: 'absolute', inset: 0, background: `${drift.severity === 'Critical Mismatch' ? '#CC0C39' : '#FF9900'}22`, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: drift.severity === 'Critical Mismatch' ? '#CC0C39' : '#c46a00', background: '#ffffffcc', padding: '2px 6px', borderRadius: 4 }}>MISMATCH</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, background: '#FF9900', border: 'none', borderRadius: 5, padding: '7px 0', fontWeight: 600, fontSize: 12, cursor: 'pointer', color: '#000' }}>
                    Update Photos
                  </button>
                  <button onClick={() => setDismissed(d => [...d, drift.asin])} style={{ flex: 1, background: '#f0f4f4', border: '1px solid #ddd', borderRadius: 5, padding: '7px 0', fontSize: 12, cursor: 'pointer', color: '#555' }}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 12 }}>AGX Feature 7 · Auto-refreshes every 24h · /api/listing-drift</p>
      </AGXDrawer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Master AI toggle — inject into settings area
// ═══════════════════════════════════════════════════════════════════════════
export function AGXMasterToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div className="agx-injected" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#ccc', fontWeight: 600 }}>AI Features</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        style={{ width: 36, height: 20, borderRadius: 99, background: enabled ? '#FF9900' : '#555', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: enabled ? 18 : 3, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

// Console log on module load
if (typeof window !== 'undefined') {
  for (let i = 1; i <= 7; i++) console.log(`AGX: Feature ${i} injected successfully`)
}
