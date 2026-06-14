# Amazon Neighborhood 🌱

A hackathon prototype demonstrating a trusted local commerce platform built inside an Amazon India UI clone.

## What it solves

1. **Low-value returns** — ₹500 shoes travelling 600km when a local buyer is 2km away
2. **Idle second-hand goods** — Rahul's baby monitor sitting unused because OLX feels unsafe
3. **Seller return blindness** — 200 returns/month, zero AI insight on root causes

## Key Features

| Feature | Tech |
|---|---|
| AI Condition Grading | BLIP (HF) → CLIP (HF) → Groq Llama 3.3-70B |
| AI Triage Engine | Groq Llama 3.3-70B (free tier) |
| Chatbot Discovery | Groq Llama 3.1-8B-instant |
| Product Passport | Supabase append-only chain + QR code |
| Green Credits Wallet | Supabase + client-side CO₂ calc |
| Seller Return Clustering | Groq Llama 3.3-70B |
| Listing Quality Score | Groq Llama 3.3-70B |
| Maps | Leaflet.js + OpenStreetMap (free) |
| Charts | Recharts |

## Setup

1. Copy `.env.example` → `.env` and fill in keys
2. `npm install`
3. `npm run dev`

### Free API Keys
- **Groq**: [console.groq.com](https://console.groq.com) → API Keys (free tier)
- **Hugging Face**: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → Read token (free)
- **Supabase**: [supabase.com](https://supabase.com) → New project → Settings → API

## Pre-cache AI Responses (CRITICAL for demo)

Before presenting, run once to populate `src/data/ai_cache.json`:

```bash
VITE_GROQ_API_KEY=your-key npm run precache-ai
```

This caches AI responses for all 20 seed listings. During the demo, only **Step 6 (List an Item with a new photo)** hits live APIs — everything else loads instantly from cache.

## 9-Step Demo Path

1. **Home** — Amazon clone UI, "Amazon Neighborhood 🌱" tile highlighted
2. **Neighborhood Feed** — 20 listings, 10km radius, chatbot bar
3. **Chatbot** — Type "baby monitor under ₹1500" → filtered results
4. **Listing Detail** — Product Passport timeline, AI narrative, return risk banner
5. **Checkout** — Escrow box, Amazon Locker map, Green Credits
6. **List an Item** — Live AI pipeline (BLIP→CLIP→Groq), grading, triage, passport init
7. **Green Credits Wallet** — Balance, CO₂ saved, marketplace utility
8. **Seller Dashboard** — Return clusters, quality scores, bulk re-list
9. **Passport QR** — Scan to see full ownership chain

## Architecture

```
User uploads photo (Step 6 only — live AI)
  ↓
Stage 1a: HF BLIP → image caption
Stage 1b: HF CLIP → condition label probabilities
  ↓
Stage 2: Groq Llama 3.3-70B → structured JSON grading
  ↓
Triage/Pricing/Passport: Groq Llama 3.3-70B (JSON mode)
Chatbot: Groq Llama 3.1-8B-instant (fastest, most calls)

All other AI content: ai_cache.json (instant, no API call)
Fallback: DEFAULT_GRADING_RESPONSE if live call times out
```

## Database Schema (Supabase)

Run `scripts/schema.sql` in your Supabase SQL editor. Tables:
- `users` — profiles, size_profile, green_credits
- `listings` — all listing data + AI fields
- `product_passport` — append-only ownership chain
- `transactions` — escrow lifecycle
- `green_credits_log` — CO₂ + credits ledger
- `messages` — in-app chat (no phone/email ever)
- `exchange_requests` — barter listings

## Scope (Hackathon)

- ✅ All 10 screens from spec
- ✅ Free AI only (Groq + HF)
- ✅ Demo cache layer for reliability
- ✅ Product Passport + QR
- ✅ Green Credits with real marketplace utility
- ✅ Seller Return Intelligence (AI clustering + quality scores)
- ❌ Real payment (mock Amazon Pay button)
- ❌ Real Supabase auth (mock session)
- ❌ Real-time chat (polling stub)
