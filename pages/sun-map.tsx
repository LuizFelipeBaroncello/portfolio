import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useTheme } from '../lib/use-theme'
import {
  getSunPosition,
  getSunTimes,
  timeToMinutes,
  minutesToDate,
  formatTimeFromMinutes,
  formatTime,
  SunPosition,
} from '../lib/sun-calc-utils'
import {
  DEFAULT_LAT,
  DEFAULT_LNG,
  DEFAULT_ZOOM,
  SPEEDS,
  BUILDING_COLORS,
  getMapStyle,
  formatDateISO,
  getSkyGradient,
  polygonCentroid,
  computeAllShadows,
  buildingsToGeoJSON,
  addMapLayers,
  updateSunLighting,
  updateDrawingPreview,
  CustomBuilding,
} from '../lib/sun-map-config'
import InteriorView from '../components/sun-map/InteriorView'
import SunMapControls from '../components/sun-map/SunMapControls'
import ErrorMessage from '../components/ErrorMessage'

function loadCustomBuildings() {
  try {
    const saved = localStorage.getItem('sun-map-buildings')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveCustomBuildings(buildings) {
  localStorage.setItem('sun-map-buildings', JSON.stringify(buildings))
}

interface SolarCompassProps {
  sunPos: SunPosition
  sunTimes: any
  bearing: number
  lat: number
  lng: number
  size?: number
}

/* ===== Solar Compass Component ===== */
function SolarCompass({ sunPos, sunTimes, bearing, lat, lng, size = 140 }: SolarCompassProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  const sunAngleRad = ((sunPos.azimuth - bearing) * Math.PI) / 180
  const sunX = cx + r * 0.75 * Math.sin(sunAngleRad)
  const sunY = cy - r * 0.75 * Math.cos(sunAngleRad)

  const arcPoints = []
  const steps = 48
  if (sunTimes.sunrise && sunTimes.sunset) {
    const riseTime = sunTimes.sunrise.getTime()
    const setTime = sunTimes.sunset.getTime()
    for (let i = 0; i <= steps; i++) {
      const t = riseTime + (setTime - riseTime) * (i / steps)
      const pos = getSunPosition(lat, lng, new Date(t))
      const a = ((pos.azimuth - bearing) * Math.PI) / 180
      const dist = r * 0.75
      arcPoints.push({
        x: cx + dist * Math.sin(a),
        y: cy - dist * Math.cos(a),
      })
    }
  }

  const arcPath =
    arcPoints.length > 1
      ? `M${arcPoints[0].x},${arcPoints[0].y}` +
        arcPoints
          .slice(1)
          .map((p) => `L${p.x},${p.y}`)
          .join('')
      : ''

  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'L', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'O', angle: 270 },
  ]

  const isDay = sunPos.altitude > 0
  const sunColor = isDay ? '#fb923c' : '#4a9eff'
  const sunGlow = isDay ? 'rgba(251,146,60,0.4)' : 'rgba(74,158,255,0.2)'

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="sm-compass-svg">
      {/* Background */}
      <circle cx={cx} cy={cy} r={r + 14} fill="rgba(0,0,0,0.45)" />

      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Tick marks */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = ((i * 10 - bearing) * Math.PI) / 180
        const isMajor = i % 9 === 0
        const len = isMajor ? 6 : 3
        const x1 = cx + (r - len) * Math.sin(a)
        const y1 = cy - (r - len) * Math.cos(a)
        const x2 = cx + r * Math.sin(a)
        const y2 = cy - r * Math.cos(a)
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isMajor ? 1.5 : 0.75}
          />
        )
      })}

      {/* Cardinal labels */}
      {cardinals.map((c) => {
        const a = ((c.angle - bearing) * Math.PI) / 180
        const lx = cx + (r + 9) * Math.sin(a)
        const ly = cy - (r + 9) * Math.cos(a)
        return (
          <text
            key={c.label}
            x={lx} y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill={c.label === 'N' ? '#fb923c' : 'rgba(255,255,255,0.55)'}
            fontSize="9"
            fontWeight={c.label === 'N' ? '700' : '500'}
            fontFamily="var(--font-main)"
          >
            {c.label}
          </text>
        )
      })}

      {/* Sun arc */}
      {arcPath && (
        <path d={arcPath} fill="none" stroke="rgba(251,146,60,0.25)" strokeWidth="1.5" strokeLinecap="round" />
      )}

      {/* Azimuth line */}
      <line
        x1={cx} y1={cy}
        x2={sunX} y2={sunY}
        stroke={sunColor}
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.5"
      />

      {/* Sun dot */}
      <circle cx={sunX} cy={sunY} r="5" fill={sunColor} opacity="0.9" />
      <circle cx={sunX} cy={sunY} r="8" fill={sunGlow} opacity="0.5" />

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2" fill="rgba(255,255,255,0.6)" />

      {/* Altitude + Azimuth text */}
      <text
        x={cx} y={size - 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="8"
        fontFamily="var(--font-main)"
        fontWeight="500"
      >
        Alt: {sunPos.altitude.toFixed(1)}&deg; &middot; Az: {sunPos.azimuth.toFixed(1)}&deg;
      </text>
    </svg>
  )
}

export default function SunMap() {
  const [theme, toggleTheme] = useTheme()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastFrameRef = useRef(null)
  const shadowThrottleRef = useRef(null)

  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [currentMinutes, setCurrentMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(5)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInfo, setShowInfo] = useState(false)
  const [bearing, setBearing] = useState(-30)

  // Play mode state
  const [playMode, setPlayMode] = useState('single-day') // 'single-day' | 'date-range' | 'fixed-hour'
  const playModeRef = useRef('single-day')

  // Date range state
  const [startDate, setStartDate] = useState(() => new Date())
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7); return d
  })
  const [currentPlayDate, setCurrentPlayDate] = useState(() => new Date())
  const currentPlayDateRef = useRef(new Date())
  const endDateRef = useRef(null)

  // Fixed-hour yearly state
  const [fixedHour, setFixedHour] = useState(12)
  const [fixedMinute, setFixedMinute] = useState(0)
  const [yearProgress, setYearProgress] = useState(0)
  const yearProgressRef = useRef(0)

  // How it works panel state
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // Interior view state
  const [showInterior, setShowInterior] = useState(false)
  const [interiorBuildingIdx, setInteriorBuildingIdx] = useState(null)

  // Building drawing state
  const [drawingMode, setDrawingMode] = useState(false)
  const [drawingPoints, setDrawingPoints] = useState([])
  const [buildingHeight, setBuildingHeight] = useState(20)
  const [buildingColor, setBuildingColor] = useState('#8899aa')
  const [customBuildings, setCustomBuildings] = useState([])
  const [showBuildingPanel, setShowBuildingPanel] = useState(false)

  // Selection + move state
  const [selectedBuildingIdx, setSelectedBuildingIdx] = useState(null)
  const [movingBuilding, setMovingBuilding] = useState(false)
  const moveOriginRef = useRef(null)

  const sunTimesRef = useRef(null)

  // Night-skip toggle
  const [skipNight, setSkipNight] = useState(false)
  const skipNightRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { playModeRef.current = playMode }, [playMode])
  useEffect(() => { endDateRef.current = endDate }, [endDate])
  useEffect(() => { skipNightRef.current = skipNight }, [skipNight])

  // Compute effective date/minutes based on play mode
  const effectiveDate = playMode === 'date-range' ? currentPlayDate
    : playMode === 'fixed-hour' ? (() => {
        const d = new Date(selectedDate.getFullYear(), 0, 1)
        d.setDate(d.getDate() + Math.floor(yearProgress))
        return d
      })()
    : selectedDate
  const effectiveMinutes = playMode === 'fixed-hour'
    ? (fixedHour * 60 + fixedMinute)
    : currentMinutes

  const currentTime = minutesToDate(effectiveDate, effectiveMinutes)
  const sunPos = getSunPosition(lat, lng, currentTime)
  const sunTimes = getSunTimes(lat, lng, effectiveDate)

  // Keep sunTimes ref in sync for rAF callback
  useEffect(() => { sunTimesRef.current = sunTimes }, [sunTimes])

  // Load custom buildings from localStorage
  useEffect(() => {
    setCustomBuildings(loadCustomBuildings())
  }, [])

  // Initialize map
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const container = mapContainerRef.current
    if (!container) return

    import('maplibre-gl').then(({ default: maplibregl }) => {
      let map: any
      try {
        map = new maplibregl.Map({
          container: container,
          style: getMapStyle(theme),
          center: [lng, lat],
          zoom: DEFAULT_ZOOM,
          pitch: 60,
          bearing: -30,
          antialias: true,
          dragRotate: true,
          touchPitch: true,
          touchZoomRotate: true,
        } as any)
      } catch (err: any) {
        setMapError(err?.message || 'Falha ao inicializar o mapa.')
        return
      }

      // No default nav control — user controls via mouse drag
      // Right-click drag = rotate, Ctrl+drag = pitch

      map.on('error', (e: any) => {
        if (!mapRef.current) {
          setMapError(e?.error?.message || 'Erro ao carregar o mapa.')
        }
      })

      map.on('load', () => {
        const initialSun = getSunPosition(lat, lng, new Date())
        const buildings = loadCustomBuildings()
        addMapLayers(map, initialSun, buildings)
        updateSunLighting(map, initialSun)
        mapRef.current = map
        setMapLoaded(true)
      })

      map.on('moveend', () => {
        const center = map.getCenter()
        setLat(center.lat)
        setLng(center.lng)
        setBearing(map.getBearing())
      })

      map.on('rotate', () => {
        setBearing(map.getBearing())
      })

      map.on('pitchend', () => {
        // Force re-render compass on pitch change
        setBearing(map.getBearing())
      })

    }).catch((err: any) => {
      setMapError(err?.message || 'Falha ao carregar o mapa.')
    })
  }, [])

  // Update sun lighting when time/position changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    updateSunLighting(mapRef.current, sunPos)
  }, [currentMinutes, yearProgress, lat, lng, mapLoaded])

  // Update ground shadows (throttled)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    if (shadowThrottleRef.current) {
      cancelAnimationFrame(shadowThrottleRef.current)
    }

    shadowThrottleRef.current = requestAnimationFrame(() => {
      const map = mapRef.current
      if (!map) return
      const shadowData = computeAllShadows(map, sunPos, customBuildings, lat)
      const src = map.getSource('ground-shadows')
      if (src) {
        src.setData(shadowData)
      }
    })
  }, [currentMinutes, yearProgress, lat, lng, customBuildings, mapLoaded])

  // Switch map style on theme change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const map = mapRef.current
    const newStyle = getMapStyle(theme)

    map.setStyle(newStyle)
    map.once('style.load', () => {
      addMapLayers(map, sunPos, customBuildings)
      updateSunLighting(map, sunPos)
    })
  }, [theme, mapLoaded])

  // Update custom buildings source when they change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    const src = mapRef.current.getSource('custom-buildings')
    if (src) {
      src.setData(buildingsToGeoJSON(customBuildings))
    }
    // Update selection highlight
    updateSelectionHighlight(mapRef.current, customBuildings, selectedBuildingIdx)
  }, [customBuildings, mapLoaded, selectedBuildingIdx])

  // Auto-pan to selected building
  useEffect(() => {
    if (selectedBuildingIdx === null || !mapRef.current || !mapLoaded) return
    const b = customBuildings[selectedBuildingIdx]
    if (!b || !b.coordinates) return
    const coords = b.coordinates
    let cx = 0, cy = 0
    for (const [lng, lat] of coords) { cx += lng; cy += lat }
    cx /= coords.length; cy /= coords.length
    mapRef.current.flyTo({ center: [cx, cy], duration: 800 })
  }, [selectedBuildingIdx, mapLoaded])

  // Drawing mode: handle map clicks
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const map = mapRef.current

    function handleClick(e) {
      if (movingBuilding) return
      if (drawingMode) {
        const point = [e.lngLat.lng, e.lngLat.lat]
        setDrawingPoints((prev) => {
          const next = [...prev, point]
          updateDrawingPreview(map, next)
          return next
        })
        return
      }

      // Check if clicked on a custom building
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['custom-buildings-3d'],
      })
      if (features.length > 0) {
        const idx = features[0].properties.index
        setSelectedBuildingIdx(idx)
        setInteriorBuildingIdx(idx)
        setShowInterior(true)
      } else {
        setSelectedBuildingIdx(null)
      }
    }

    map.on('click', handleClick)

    if (drawingMode) {
      map.getCanvas().style.cursor = 'crosshair'
    } else if (movingBuilding) {
      map.getCanvas().style.cursor = 'move'
    } else {
      map.getCanvas().style.cursor = ''
      updateDrawingPreview(map, [])
    }

    function handleMouseMove(e) {
      if (drawingMode || movingBuilding) return
      const hovered = map.queryRenderedFeatures(e.point, {
        layers: ['custom-buildings-3d'],
      })
      map.getCanvas().style.cursor = hovered.length > 0 ? 'pointer' : ''
    }

    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('click', handleClick)
      map.off('mousemove', handleMouseMove)
    }
  }, [drawingMode, movingBuilding, mapLoaded])

  // Moving building: track mouse and update coordinates
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !movingBuilding || selectedBuildingIdx === null) return

    const map = mapRef.current
    map.dragPan.disable()

    function handleMouseMove(e) {
      if (!moveOriginRef.current) return
      const { lngLat } = e
      const origin = moveOriginRef.current

      const dLng = lngLat.lng - origin.lng
      const dLat = lngLat.lat - origin.lat

      moveOriginRef.current = { lng: lngLat.lng, lat: lngLat.lat }

      setCustomBuildings((prev) => {
        const updated = [...prev]
        const b = { ...updated[selectedBuildingIdx] }
        b.coordinates = b.coordinates.map((c) => [c[0] + dLng, c[1] + dLat])
        updated[selectedBuildingIdx] = b
        return updated
      })
    }

    function handleClick(e) {
      e.preventDefault()
      setMovingBuilding(false)
      moveOriginRef.current = null
      map.dragPan.enable()
      // Save after move
      setCustomBuildings((prev) => {
        saveCustomBuildings(prev)
        return prev
      })
    }

    map.on('mousemove', handleMouseMove)
    map.once('click', handleClick)

    return () => {
      map.off('mousemove', handleMouseMove)
      map.off('click', handleClick)
      map.dragPan.enable()
    }
  }, [movingBuilding, selectedBuildingIdx, mapLoaded])

  // Update preview when points change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    updateDrawingPreview(mapRef.current, drawingPoints)
  }, [drawingPoints, mapLoaded])

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      lastFrameRef.current = null
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      return
    }

    function animate(timestamp) {
      if (lastFrameRef.current !== null) {
        const delta = (timestamp - lastFrameRef.current) / 1000

        if (playModeRef.current === 'date-range') {
          setCurrentMinutes((prev) => {
            let next = prev + delta * speed
            while (next >= 1440) {
              next -= 1440
              const d = new Date(currentPlayDateRef.current)
              d.setDate(d.getDate() + 1)
              if (endDateRef.current && d > endDateRef.current) {
                setIsPlaying(false)
                return prev
              }
              currentPlayDateRef.current = d
              setCurrentPlayDate(new Date(d))
            }
            // Night-skip: jump past dark hours
            if (skipNightRef.current) {
              const st = sunTimesRef.current
              if (st && st.sunrise && st.sunset) {
                const sunriseMin = st.sunrise.getHours() * 60 + st.sunrise.getMinutes()
                const sunsetMin = st.sunset.getHours() * 60 + st.sunset.getMinutes()
                if (sunriseMin < sunsetMin) { // guard against polar edge cases
                  if (next < sunriseMin) {
                    next = sunriseMin
                  } else if (next > sunsetMin) {
                    // Jump to sunrise of next day
                    const d = new Date(currentPlayDateRef.current)
                    d.setDate(d.getDate() + 1)
                    if (endDateRef.current && d > endDateRef.current) {
                      setIsPlaying(false)
                      return prev
                    }
                    currentPlayDateRef.current = d
                    setCurrentPlayDate(new Date(d))
                    next = sunriseMin
                  }
                }
              }
            }
            return next
          })
        } else if (playModeRef.current === 'fixed-hour') {
          setYearProgress((prev) => {
            const next = prev + delta * speed
            if (next >= 365) {
              yearProgressRef.current = 0
              return 0
            }
            yearProgressRef.current = next
            return next
          })
        } else {
          setCurrentMinutes((prev) => {
            let next = prev + delta * speed
            if (next >= 1440) next -= 1440
            if (skipNightRef.current) {
              const st = sunTimesRef.current
              if (st && st.sunrise && st.sunset) {
                const sunriseMin = st.sunrise.getHours() * 60 + st.sunrise.getMinutes()
                const sunsetMin = st.sunset.getHours() * 60 + st.sunset.getMinutes()
                if (sunriseMin < sunsetMin) {
                  if (next < sunriseMin) next = sunriseMin
                  else if (next > sunsetMin) next = sunriseMin
                }
              }
            }
            return next
          })
        }
      }
      lastFrameRef.current = timestamp
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, speed])

  // Location search
  const handleSearch = useCallback(
    async (e) => {
      e.preventDefault()
      if (!searchQuery.trim() || !mapRef.current) return

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=1`,
          { headers: { 'Accept-Language': 'pt-BR,en' } }
        )
        const data = await res.json()
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat)
          const newLng = parseFloat(data[0].lon)
          mapRef.current.flyTo({
            center: [newLng, newLat],
            zoom: 16,
            pitch: 60,
            duration: 2000,
          })
        }
      } catch {
        // search failed silently
      }
    },
    [searchQuery]
  )

  const handleDateChange = (e) => {
    const parts = e.target.value.split('-')
    const d = new Date(selectedDate)
    d.setFullYear(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    setSelectedDate(d)
  }

  const handleSliderChange = (e) => {
    setCurrentMinutes(parseFloat(e.target.value))
  }

  const cycleSpeed = () => {
    const idx = SPEEDS.findIndex((s) => s.value === speed)
    const next = SPEEDS[(idx + 1) % SPEEDS.length]
    setSpeed(next.value)
  }

  // Building actions
  const finishBuilding = () => {
    if (drawingPoints.length < 3) return
    const closed = [...drawingPoints, drawingPoints[0]]
    const newBuilding = {
      coordinates: closed,
      height: buildingHeight,
      color: buildingColor,
    }
    const updated = [...customBuildings, newBuilding]
    setCustomBuildings(updated)
    saveCustomBuildings(updated)
    setDrawingPoints([])
    setDrawingMode(false)
  }

  const cancelDrawing = () => {
    setDrawingPoints([])
    setDrawingMode(false)
  }

  const undoLastPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1))
  }

  const removeBuilding = (index) => {
    const updated = customBuildings.filter((_, i) => i !== index)
    setCustomBuildings(updated)
    saveCustomBuildings(updated)
    if (selectedBuildingIdx === index) setSelectedBuildingIdx(null)
    else if (selectedBuildingIdx !== null && selectedBuildingIdx > index) {
      setSelectedBuildingIdx(selectedBuildingIdx - 1)
    }
  }

  const clearAllBuildings = () => {
    setCustomBuildings([])
    saveCustomBuildings([])
    setSelectedBuildingIdx(null)
    setMovingBuilding(false)
  }

  const startMoveBuilding = () => {
    if (selectedBuildingIdx === null) return
    const b = customBuildings[selectedBuildingIdx]
    const centroid = polygonCentroid(b.coordinates)
    moveOriginRef.current = { lng: centroid[0], lat: centroid[1] }
    setMovingBuilding(true)
  }

  function updateSelectionHighlight(map, buildings, idx) {
    if (!map) return
    const src = map.getSource('selected-building')
    if (!src) return

    if (idx === null || idx === undefined || !buildings[idx]) {
      src.setData({ type: 'FeatureCollection', features: [] })
      return
    }

    src.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [buildings[idx].coordinates],
          },
        },
      ],
    })
  }

  // Computed values for slider
  const sunriseMin = sunTimes.sunrise ? timeToMinutes(sunTimes.sunrise) : 360
  const sunsetMin = sunTimes.sunset ? timeToMinutes(sunTimes.sunset) : 1080
  const sliderPercent = (currentMinutes / 1440) * 100
  const daylightLeft = (sunriseMin / 1440) * 100
  const daylightWidth = ((sunsetMin - sunriseMin) / 1440) * 100

  return (
    <div className="sm-page">
      <Head>
        <title>Sun Position Map</title>
        <meta name="description" content="Mapa interativo de posição solar 3D. Visualize a direção do sol, sombras e raios solares para qualquer local e horário." />
        <meta name="keywords" content="sol, posição solar, mapa solar, sombras, 3D, sun map, azimute, altitude solar" />
        <meta property="og:title" content="Sun Position Map — Mapa Solar 3D" />
        <meta property="og:description" content="Mapa interativo de posição solar 3D. Visualize a direção do sol, sombras e raios solares para qualquer local e horário." />
        <meta property="og:image" content="/og-image.svg" />
        <meta property="og:url" content="https://luizfelipebaroncello.com/sun-map" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sun Position Map — Mapa Solar 3D" />
        <meta name="twitter:description" content="Mapa interativo de posição solar 3D. Visualize a direção do sol, sombras e raios solares para qualquer local e horário." />
        <meta name="twitter:image" content="/og-image.svg" />
      </Head>

      {/* Map */}
      <div ref={mapContainerRef} className="sm-map-container" />

      {/* FAB: open interior modal */}
      {mapLoaded && (
        <button
          className="sm-fab-interior"
          onClick={() => {
            if (selectedBuildingIdx !== null) {
              setInteriorBuildingIdx(selectedBuildingIdx)
            }
            setShowInterior(true)
          }}
          title="Edifícios 3D"
          aria-label="Abrir edifícios 3D"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Sky gradient overlay */}
      <div
        className="sm-sky-overlay"
        style={{ background: getSkyGradient(sunPos.altitude) }}
      />

      {/* Loading / Error */}
      {mapError ? (
        <div className="sm-loading" style={{ flexDirection: 'column' }}>
          <ErrorMessage message={mapError} />
        </div>
      ) : (
        <div className={`sm-loading ${mapLoaded ? 'hidden' : ''}`}>
          <span className="sm-loading-text">Carregando mapa...</span>
        </div>
      )}

      {/* Header */}
      <div className="sm-header">
        <div className="sm-header-left">
          <a href="/" className="sm-back-link" title="Voltar">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <span className="sm-title">Sun Position Map</span>
        </div>
        <div className="sm-header-right">
          <button
            className={`sm-build-toggle ${showHowItWorks ? 'active' : ''}`}
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            title="Como funciona"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
          <button
            className={`sm-build-toggle ${showBuildingPanel ? 'active' : ''}`}
            onClick={() => {
              setShowBuildingPanel(!showBuildingPanel)
              if (drawingMode) cancelDrawing()
            }}
            title="Edificios"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M9 22V12h6v10M9 6h.01M15 6h.01M9 10h.01M15 10h.01" />
            </svg>
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {theme === 'dark' ? (
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Como funciona Panel */}
      {showHowItWorks && (
        <div className="sm-info-panel sm-how-it-works-panel">
          <div className="sm-info-title">Como funciona</div>
          <ul className="sm-how-list">
            <li className="sm-how-item">
              <span className="sm-how-icon">☀️</span>
              Usa dados astronomicos reais (suncalc) para calcular azimute e altitude solar em qualquer horario e localizacao.
            </li>
            <li className="sm-how-item">
              <span className="sm-how-icon">🗺️</span>
              Renderiza edificios 3D via MapLibre GL com dados OpenStreetMap para uma visualizacao realista do ambiente urbano.
            </li>
            <li className="sm-how-item">
              <span className="sm-how-icon">🔺</span>
              Projeta poligonos de sombra via geometria vetorial em tempo real, calculando o comprimento e direcao das sombras a partir da altitude solar.
            </li>
          </ul>
        </div>
      )}

      {/* Building Panel */}
      {showBuildingPanel && (
        <div className="sm-build-panel">
          <div className="sm-info-title">Edificios 3D</div>

          {!drawingMode ? (
            <>
              <button
                className="sm-build-action-btn primary"
                onClick={() => {
                  setDrawingMode(true)
                  setSelectedBuildingIdx(null)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Adicionar edificio
              </button>

              {customBuildings.length > 0 && (
                <>
                  <div className="sm-build-list">
                    {customBuildings.map((b, i) => (
                      <div
                        key={i}
                        className={`sm-build-item ${selectedBuildingIdx === i ? 'selected' : ''}`}
                        onClick={() => setSelectedBuildingIdx(selectedBuildingIdx === i ? null : i)}
                        onDoubleClick={() => {
                          setInteriorBuildingIdx(i)
                          setShowInterior(true)
                        }}
                      >
                        <span
                          className="sm-build-color-dot"
                          style={{ background: b.color }}
                        />
                        <span className="sm-build-item-label">
                          {b.height}m
                        </span>
                        <button
                          className="sm-build-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBuilding(i)
                          }}
                          title="Remover"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Selected building actions */}
                  {selectedBuildingIdx !== null && (
                    <div className="sm-build-selected-actions">
                      <button
                        className={`sm-build-action-btn ${movingBuilding ? 'active-move' : ''}`}
                        onClick={() => {
                          if (movingBuilding) {
                            setMovingBuilding(false)
                            moveOriginRef.current = null
                            if (mapRef.current) mapRef.current.dragPan.enable()
                          } else {
                            startMoveBuilding()
                          }
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                        </svg>
                        {movingBuilding ? 'Clique para posicionar' : 'Mover'}
                      </button>
                      <button
                        className="sm-build-action-btn primary"
                        onClick={() => {
                          setInteriorBuildingIdx(selectedBuildingIdx)
                          setShowInterior(true)
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M3 9h18M9 3v18" />
                        </svg>
                        Interior
                      </button>
                      <button
                        className="sm-build-action-btn danger"
                        onClick={() => removeBuilding(selectedBuildingIdx)}
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  <button
                    className="sm-build-action-btn danger"
                    onClick={clearAllBuildings}
                    style={{ marginTop: 6 }}
                  >
                    Limpar todos
                  </button>
                </>
              )}

              {customBuildings.length === 0 && (
                <p className="sm-build-hint">
                  Clique em &quot;Adicionar&quot; e depois clique no mapa para desenhar
                  a forma do edificio.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="sm-build-hint">
                Clique no mapa para adicionar vertices.
                {drawingPoints.length >= 3 &&
                  ' Clique em "Finalizar" para criar o edificio.'}
              </p>

              <div className="sm-build-field">
                <label className="sm-build-field-label">Altura (metros)</label>
                <input
                  type="range"
                  min="3"
                  max="200"
                  value={buildingHeight}
                  onChange={(e) => setBuildingHeight(parseInt(e.target.value))}
                  className="sm-build-height-slider"
                />
                <span className="sm-build-height-value">{buildingHeight}m</span>
              </div>

              <div className="sm-build-field">
                <label className="sm-build-field-label">Cor</label>
                <div className="sm-build-colors">
                  {BUILDING_COLORS.map((c) => (
                    <button
                      key={c.value}
                      className={`sm-build-color-btn ${buildingColor === c.value ? 'active' : ''}`}
                      style={{ background: c.value }}
                      onClick={() => setBuildingColor(c.value)}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="sm-build-field">
                <span className="sm-build-field-label">
                  Vertices: {drawingPoints.length}
                </span>
              </div>

              <div className="sm-build-actions">
                {drawingPoints.length > 0 && (
                  <button className="sm-build-action-btn" onClick={undoLastPoint}>
                    Desfazer
                  </button>
                )}
                {drawingPoints.length >= 3 && (
                  <button
                    className="sm-build-action-btn primary"
                    onClick={finishBuilding}
                  >
                    Finalizar
                  </button>
                )}
                <button className="sm-build-action-btn danger" onClick={cancelDrawing}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compass overlay on map */}
      <div className="sm-compass-overlay">
        <SolarCompass
          sunPos={sunPos}
          sunTimes={sunTimes}
          bearing={bearing}
          lat={lat}
          lng={lng}
          size={130}
        />
      </div>

      {/* Info Panel (no compass here, text only) */}
      <div className={`sm-info-panel ${showInfo ? 'visible' : ''}`}>
        <div className="sm-info-title">Informacoes do Sol</div>
        <div className="sm-info-row">
          <span className="sm-info-label">
            <span className={`sm-sun-indicator ${sunPos.altitude > 0 ? 'above' : 'below'}`} />
            {sunPos.altitude > 0 ? 'Sol acima' : 'Sol abaixo'}
          </span>
        </div>
        <div className="sm-info-row">
          <span className="sm-info-label">Nascer</span>
          <span className="sm-info-value">
            {sunTimes.sunrise ? formatTime(sunTimes.sunrise) : '--:--'}
          </span>
        </div>
        <div className="sm-info-row">
          <span className="sm-info-label">Por do sol</span>
          <span className="sm-info-value">
            {sunTimes.sunset ? formatTime(sunTimes.sunset) : '--:--'}
          </span>
        </div>
        <div className="sm-info-row">
          <span className="sm-info-label">Meio-dia solar</span>
          <span className="sm-info-value">
            {sunTimes.solarNoon ? formatTime(sunTimes.solarNoon) : '--:--'}
          </span>
        </div>
        <div className="sm-info-row">
          <span className="sm-info-label">Duracao do dia</span>
          <span className="sm-info-value">
            {sunTimes.sunrise && sunTimes.sunset
              ? (() => {
                  const diff = sunTimes.sunset - sunTimes.sunrise
                  const hours = Math.floor(diff / 3600000)
                  const mins = Math.floor((diff % 3600000) / 60000)
                  return `${hours}h ${mins}m`
                })()
              : '--'}
          </span>
        </div>
      </div>

      {/* Info toggle (mobile) */}
      <button
        className="sm-info-toggle"
        onClick={() => setShowInfo(!showInfo)}
        title="Info do sol"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>

      {/* Move mode banner */}
      {movingBuilding && (
        <div className="sm-move-banner">
          Arraste o mouse para mover &middot; Clique para posicionar
        </div>
      )}

      {/* Controls */}
      <SunMapControls
        playMode={playMode}
        setPlayMode={setPlayMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        speed={speed}
        cycleSpeed={cycleSpeed}
        skipNight={skipNight}
        setSkipNight={setSkipNight}
        currentMinutes={currentMinutes}
        setCurrentMinutes={setCurrentMinutes}
        yearProgress={yearProgress}
        setYearProgress={setYearProgress}
        yearProgressRef={yearProgressRef}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        currentPlayDate={currentPlayDate}
        setCurrentPlayDate={setCurrentPlayDate}
        currentPlayDateRef={currentPlayDateRef}
        fixedHour={fixedHour}
        setFixedHour={setFixedHour}
        fixedMinute={fixedMinute}
        setFixedMinute={setFixedMinute}
        effectiveDate={effectiveDate}
        lat={lat}
        lng={lng}
        daylightLeft={daylightLeft}
        daylightWidth={daylightWidth}
        sliderPercent={sliderPercent}
        handleSearch={handleSearch}
        handleDateChange={handleDateChange}
        handleSliderChange={handleSliderChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Interior view modal */}
      {showInterior && interiorBuildingIdx !== null && customBuildings[interiorBuildingIdx] && (
        <InteriorView
          building={customBuildings[interiorBuildingIdx]}
          buildingIndex={interiorBuildingIdx}
          sunPos={sunPos}
          effectiveDate={effectiveDate}
          effectiveMinutes={effectiveMinutes}
          onClose={() => setShowInterior(false)}
          onUpdateBuilding={(updated) => {
            const next = [...customBuildings]
            next[interiorBuildingIdx] = updated
            setCustomBuildings(next)
            saveCustomBuildings(next)
          }}
          playMode={playMode}
          setPlayMode={setPlayMode}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          currentMinutes={currentMinutes}
          setCurrentMinutes={setCurrentMinutes}
          yearProgress={yearProgress}
          setYearProgress={setYearProgress}
          yearProgressRef={yearProgressRef}
          speed={speed}
          cycleSpeed={cycleSpeed}
          SPEEDS={SPEEDS}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          fixedHour={fixedHour}
          setFixedHour={setFixedHour}
          fixedMinute={fixedMinute}
          setFixedMinute={setFixedMinute}
          sunTimes={sunTimes}
          daylightLeft={daylightLeft}
          daylightWidth={daylightWidth}
          handleSliderChange={handleSliderChange}
          handleDateChange={handleDateChange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          currentPlayDate={currentPlayDate}
          setCurrentPlayDate={setCurrentPlayDate}
          currentPlayDateRef={currentPlayDateRef}
          skipNight={skipNight}
          setSkipNight={setSkipNight}
          formatDateISO={formatDateISO}
        />
      )}
    </div>
  )
}
