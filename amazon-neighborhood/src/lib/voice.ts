/**
 * Voice pipeline:
 *   User speaks  →  Web Speech API (free, browser-native)  →  text transcript
 *   AI text out  →  ElevenLabs TTS API  →  <audio> playback
 *
 * ElevenLabs free tier: 10 000 characters/month, no credit card needed.
 * Voice used: "Rachel" (voice_id: 21m00Tcm4TlvDq8ikWAM) — calm, professional.
 */

const EL_API_KEY  = import.meta.env.VITE_ELEVEN_LABS_API_KEY || ''
const VOICE_ID    = '21m00Tcm4TlvDq8ikWAM'           // Rachel — free tier voice
const EL_ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`

// ── Speech-to-Text (Web Speech API) ─────────────────────────────────────────

type TranscriptCallback = (text: string) => void
type StatusCallback     = (status: 'listening' | 'stopped' | 'error') => void

export function startListening(
  onTranscript: TranscriptCallback,
  onStatus: StatusCallback
): (() => void) {
  const SpeechRecognition =
    (window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
      .SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition

  if (!SpeechRecognition) {
    onStatus('error')
    return () => { /* noop */ }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognition = new (SpeechRecognition as any)()
  recognition.continuous    = false
  recognition.interimResults = false
  recognition.lang          = 'en-IN'
  recognition.maxAlternatives = 1

  recognition.onstart  = () => onStatus('listening')
  recognition.onend    = () => onStatus('stopped')
  recognition.onerror  = () => onStatus('error')
  recognition.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
    const transcript = e.results[0][0].transcript
    if (transcript) onTranscript(transcript)
  }

  recognition.start()
  return () => { try { recognition.stop() } catch { /* ignore */ } }
}

// ── Text-to-Speech (ElevenLabs) ─────────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
}

export async function speak(text: string): Promise<void> {
  stopSpeaking()

  if (!EL_API_KEY || !text.trim()) return

  // Truncate to stay within free tier limits (max 500 chars per call for demo)
  const safeText = text.slice(0, 500)

  try {
    const res = await fetch(EL_ENDPOINT, {
      method: 'POST',
      headers: {
        'xi-api-key':   EL_API_KEY,
        'Content-Type': 'application/json',
        Accept:         'audio/mpeg',
      },
      body: JSON.stringify({
        text: safeText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    })

    if (!res.ok) return  // fail silently — TTS is enhancement, not critical

    const blob = URL.createObjectURL(await res.blob())
    currentAudio = new Audio(blob)
    await currentAudio.play()
  } catch {
    // TTS failure never breaks the UI
  }
}

// Detect if browser supports Web Speech API
export function hasSpeechRecognition(): boolean {
  return !!(
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}
