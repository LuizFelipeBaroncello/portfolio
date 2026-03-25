import { useRef, useState, useEffect } from 'react'
import { Responsive } from 'react-grid-layout'

export default function BentoGrid(props: Record<string, any>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      {width > 0 && <Responsive {...(props as any)} width={width} />}
    </div>
  )
}
