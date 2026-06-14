import React, { useEffect, useRef } from 'react'

interface PassportQRProps {
  listingId: string
  serialNumber: string
}

export function PassportQR({ listingId, serialNumber }: PassportQRProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const passportUrl = `${window.location.origin}/neighborhood/listing/${listingId}`
    import('qrcode').then((QRCode) => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, passportUrl, {
          width: 160,
          margin: 2,
          color: { dark: '#0a6245', light: '#ffffff' },
        })
      }
    })
  }, [listingId])

  return (
    <div className="flex flex-col items-center gap-3 p-4 border border-[#0a6245] rounded bg-[#f0f9f4]">
      <div className="flex items-center gap-2 w-full">
        <div className="w-8 h-8 rounded-full bg-[#0a6245] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Passport QR Code</p>
          <p className="text-xs text-gray-500">Scan at meetpoint to verify ownership chain</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="rounded" aria-label={`QR code for product passport — serial ${serialNumber}`} />

      <div className="text-center">
        <p className="text-xs text-gray-500">Serial: {serialNumber}</p>
        <p className="text-xs text-[#0a6245] font-medium mt-1">
          Buyer scans to see full ownership history on their device
        </p>
      </div>
    </div>
  )
}
