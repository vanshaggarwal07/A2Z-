import { useState, useEffect, useCallback, useRef } from 'react'

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable' | 'loading'

export interface LocationState {
  lat: number
  lng: number
  area: string
  accuracy: number | null          // metres
  permission: PermissionState
  loading: boolean
  error: string | null
}

// Delhi NCR centre — fallback only
const DEFAULT: LocationState = {
  lat: 28.6139,
  lng: 77.2090,
  area: 'Connaught Place, New Delhi',
  accuracy: null,
  permission: 'prompt',
  loading: false,
  error: null,
}

// Reverse-geocode using Nominatim (OpenStreetMap, completely free, no key)
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    if (!res.ok) return 'Your Location'
    const data = await res.json()
    const a = data.address || {}
    const parts = [a.suburb || a.neighbourhood || a.village, a.city || a.town || a.county]
      .filter(Boolean)
    return parts.join(', ') || 'Your Location'
  } catch {
    return 'Your Location'
  }
}

export function useLocation() {
  const [loc, setLoc] = useState<LocationState>(DEFAULT)
  const watchRef      = useRef<number | null>(null)

  // Check current permission state without asking
  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      setLoc(prev => ({
        ...prev,
        permission: result.state as PermissionState,
      }))
      // If already granted, start watching immediately
      if (result.state === 'granted') startTracking()
      result.onchange = () => {
        setLoc(prev => ({ ...prev, permission: result.state as PermissionState }))
        if (result.state === 'granted') startTracking()
        if (result.state === 'denied')  stopTracking()
      }
    }).catch(() => { /* permissions API not supported */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopTracking = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
  }, [])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLoc(prev => ({ ...prev, permission: 'unavailable', error: 'Geolocation not supported' }))
      return
    }
    stopTracking()

    setLoc(prev => ({ ...prev, loading: true }))

    watchRef.current = navigator.geolocation.watchPosition(
      async pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const area = await reverseGeocode(lat, lng)
        setLoc({
          lat, lng, area, accuracy,
          permission: 'granted',
          loading: false,
          error: null,
        })
      },
      err => {
        const msg = err.code === 1 ? 'Location access denied' :
                    err.code === 2 ? 'Location unavailable'    : 'Location request timed out'
        setLoc(prev => ({
          ...prev,
          permission: err.code === 1 ? 'denied' : prev.permission,
          loading: false,
          error: msg,
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }, [stopTracking])

  // Request permission + start tracking (called when user clicks "Use my location")
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLoc(prev => ({ ...prev, permission: 'unavailable' }))
      return
    }
    setLoc(prev => ({ ...prev, loading: true, permission: 'loading' }))
    // One-shot first to get immediate result, then watch for updates
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        const area = await reverseGeocode(lat, lng)
        setLoc({ lat, lng, area, accuracy, permission: 'granted', loading: false, error: null })
        startTracking()
      },
      err => {
        setLoc(prev => ({
          ...prev,
          permission: err.code === 1 ? 'denied' : 'prompt',
          loading: false,
          error: err.code === 1 ? 'Location access denied' : 'Could not get location',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [startTracking])

  // Cleanup on unmount
  useEffect(() => () => stopTracking(), [stopTracking])

  return { ...loc, requestLocation }
}
