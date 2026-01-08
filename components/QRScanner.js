'use client'

import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

export default function QRScanner({ onScan, onError, scanning }) {
  const [cameraId, setCameraId] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const isScannerRunningRef = useRef(false)

  useEffect(() => {
    if (!scanning) {
      // Stop scanning when scanning is false
      if (html5QrCodeRef.current && isScannerRunningRef.current) {
        html5QrCodeRef.current.stop().catch((err) => {
          // Ignore errors if scanner is already stopped
          if (!err.message?.includes('not running')) {
            console.debug('Error stopping scanner:', err)
          }
        })
        html5QrCodeRef.current.clear().catch(() => {})
        isScannerRunningRef.current = false
        html5QrCodeRef.current = null
      }
      setIsInitializing(false)
      setError(null)
      return
    }

    // Reset state when starting
    setIsInitializing(true)
    setError(null)
    setHasPermission(null)

    let isMounted = true

    const initializeScanner = async () => {
      try {
        // Create scanner instance
    const html5QrCode = new Html5Qrcode('qr-scanner')
    html5QrCodeRef.current = html5QrCode

        // Request camera permission and get devices
        const devices = await Html5Qrcode.getCameras()
        
        if (!isMounted) return

        if (!devices || devices.length === 0) {
          setHasPermission(false)
          setIsInitializing(false)
          const errorMsg = 'No camera found on this device'
          setError(errorMsg)
          onError(new Error(errorMsg))
          return
        }

        const cameraIdToUse = devices[0].id
        setCameraId(cameraIdToUse)
          setHasPermission(true)
          
          // Start scanning
        try {
          console.log('Starting camera with ID:', cameraIdToUse)
          await html5QrCode.start(
            cameraIdToUse,
            {
              fps: 10,
              qrbox: function(viewfinderWidth, viewfinderHeight) {
                // Dynamic qrbox based on viewfinder size
                const minEdgePercentage = 0.7
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
                console.log('QR box size:', qrboxSize)
                return {
                  width: qrboxSize,
                  height: qrboxSize
                }
              },
              aspectRatio: 1.0,
              videoConstraints: {
                facingMode: 'environment' // Use back camera on mobile
              }
            },
            (decodedText) => {
              // QR code scanned successfully
              console.log('QR code scanned:', decodedText)
              if (isMounted) {
                isScannerRunningRef.current = false
              onScan(decodedText)
              // Stop scanning after successful scan
                html5QrCode.stop().catch((err) => {
                  // Ignore errors if already stopped
                  if (!err.message?.includes('not running')) {
                    console.debug('Error stopping after scan:', err)
                  }
                })
              }
            },
            (errorMessage) => {
              // Ignore scanning errors (continuous scanning - these are normal)
              // Only log if it's a serious error
              if (errorMessage && !errorMessage.includes('NotFoundException')) {
                console.debug('QR scanning:', errorMessage)
              }
            }
          )
          
          console.log('Camera started successfully')
          if (isMounted) {
            isScannerRunningRef.current = true
            setIsInitializing(false)
            console.log('Scanner ready - should show camera view')
          }
        } catch (startError) {
          console.error('Error starting camera:', startError)
          if (isMounted) {
            isScannerRunningRef.current = false
            setHasPermission(false)
            setIsInitializing(false)
            let errorMsg = 'Failed to start camera. '
            if (startError.message) {
              errorMsg += startError.message
            } else if (startError.name === 'NotAllowedError') {
              errorMsg += 'Camera permission denied. Please allow camera access.'
            } else if (startError.name === 'NotFoundError') {
              errorMsg += 'No camera found on this device.'
            } else if (startError.name === 'NotReadableError') {
              errorMsg += 'Camera is already in use by another application.'
        } else {
              errorMsg += 'Please check permissions and try again.'
            }
            setError(errorMsg)
            onError(new Error(errorMsg))
          }
        }
      } catch (err) {
        console.error('Camera initialization error:', err)
        if (isMounted) {
          setHasPermission(false)
          setIsInitializing(false)
          const errorMsg = err.message || 'Camera access denied. Please allow camera permissions.'
          setError(errorMsg)
          onError(new Error(errorMsg))
        }
      }
    }

    initializeScanner()

    return () => {
      isMounted = false
      if (html5QrCodeRef.current && isScannerRunningRef.current) {
        html5QrCodeRef.current.stop().catch((err) => {
          // Ignore errors if scanner is already stopped
          if (!err.message?.includes('not running')) {
            console.debug('Error stopping scanner in cleanup:', err)
          }
        })
        html5QrCodeRef.current.clear().catch(() => {})
        isScannerRunningRef.current = false
        html5QrCodeRef.current = null
      }
    }
  }, [scanning, onScan, onError])

  // Show error state
  if (hasPermission === false || error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-medium">
          {error || 'Camera access denied'}
        </p>
        <p className="text-sm text-red-500 mt-2">
          {error?.includes('permission') 
            ? 'Please enable camera permissions in your browser settings'
            : 'Please check your camera and try again'}
        </p>
      </div>
    )
  }

  // Always render the scanner div so html5-qrcode has a target to render into
  // Show overlay states on top
  return (
    <div className="relative w-full">
      <div 
        id="qr-scanner" 
        className="w-full aspect-square bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      ></div>
      
      {/* Loading overlay - show during initialization */}
      {(isInitializing || hasPermission === null) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent mx-auto"></div>
            <p className="text-white mt-4">Starting camera...</p>
          </div>
        </div>
      )}
      
      {/* Scan box overlay - only show when camera is active and ready */}
      {hasPermission && !isInitializing && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div 
            className="border-2 border-blue-500 rounded-lg"
            style={{ 
              width: '250px', 
              height: '250px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)'
            }}
          ></div>
        </div>
      )}
    </div>
  )
}

