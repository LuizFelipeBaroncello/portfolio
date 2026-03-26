import { useState, useCallback, useRef, useEffect } from 'react'

const SNAP_ANGLE = Math.PI / 2 // 90 degrees
const LERP_SPEED = 8
const MIN_ZOOM = 2
const MAX_ZOOM = 20

export default function useIsometricControls(initialZoom = 8) {
  const [angle, setAngle] = useState(Math.PI / 4) // start at 45deg for nice isometric
  const [targetAngle, setTargetAngle] = useState(Math.PI / 4)
  const [zoom, setZoom] = useState(initialZoom)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(null)
  const angleStartRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const animFrameRef = useRef(null)

  // Animate toward target angle
  useEffect(() => {
    let running = true
    const animate = () => {
      if (!running) return
      setAngle((prev) => {
        const diff = targetAngle - prev
        if (Math.abs(diff) < 0.001) {
          isAnimatingRef.current = false
          return targetAngle
        }
        isAnimatingRef.current = true
        animFrameRef.current = requestAnimationFrame(animate)
        return prev + diff * 0.15
        })
    }
    animFrameRef.current = requestAnimationFrame(animate)
    return () => {
      running = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [targetAngle])

  // Click to snap 90 degrees
  const handleClick = useCallback(() => {
    if (isDragging) return
    setTargetAngle((prev) => prev + SNAP_ANGLE)
  }, [isDragging])

  // Drag to rotate freely
  const handlePointerDown = useCallback((e) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    angleStartRef.current = angle
    setIsDragging(false)
  }, [angle])

  const handlePointerMove = useCallback((e) => {
    if (!dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    if (Math.abs(dx) > 3) setIsDragging(true)
    const newAngle = angleStartRef.current + dx * 0.008
    setAngle(newAngle)
    setTargetAngle(newAngle)
  }, [])

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null
    // Reset isDragging after a short delay so click handler can check it
    setTimeout(() => setIsDragging(false), 50)
  }, [])

  // Scroll to zoom
  const handleWheel = useCallback((e) => {
    e.stopPropagation()
    setZoom((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + (e.deltaY > 0 ? 0.5 : -0.5))))
  }, [])

  return {
    angle,
    zoom,
    isDragging,
    handleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  }
}
