const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || ''
const HF_BASE = 'https://api-inference.huggingface.co/models'

// Stage 1a: BLIP image captioning
export async function blipCaption(base64Image: string): Promise<string> {
  const res = await fetch(`${HF_BASE}/Salesforce/blip-image-captioning-large`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: base64Image }),
  })

  if (!res.ok) {
    throw new Error(`BLIP API error: ${res.status}`)
  }

  const data = await res.json()

  // Handle model loading (503)
  if (data.error && data.error.includes('loading')) {
    // Wait and retry once
    await new Promise((r) => setTimeout(r, 5000))
    const retry = await fetch(`${HF_BASE}/Salesforce/blip-image-captioning-large`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: base64Image }),
    })
    const retryData = await retry.json()
    return retryData[0]?.generated_text || 'a used product in average condition'
  }

  return data[0]?.generated_text || 'a used product in average condition'
}

// Stage 1b: CLIP zero-shot classification for condition
export async function clipCondition(
  base64Image: string
): Promise<Array<{ label: string; score: number }>> {
  const res = await fetch(`${HF_BASE}/openai/clip-vit-base-patch32`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        image: base64Image,
        candidate_labels: ['brand new condition', 'lightly used', 'heavily worn', 'damaged'],
      },
    }),
  })

  if (!res.ok) {
    // CLIP is optional — return a sensible default on failure
    return [
      { label: 'lightly used', score: 0.5 },
      { label: 'brand new condition', score: 0.25 },
      { label: 'heavily worn', score: 0.2 },
      { label: 'damaged', score: 0.05 },
    ]
  }

  const data = await res.json()
  return data
}

// Convert a File/Blob to base64 string (data URI stripped)
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip data URI prefix: "data:image/jpeg;base64,"
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
