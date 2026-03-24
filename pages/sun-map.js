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
  mapAltitudeToIntensity,
  mapAltitudeToColor,
} from '../lib/sun-calc-utils'
import InteriorView from '../components/sun-map/InteriorView'

const DEFAULT_LAT = -27.5934
const DEFAULT_LNG = -48.5828
const DEFAULT_ZOOM = 16

const SPEEDS = [
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '30x', value: 30 },
  { label: '60x', value: 60 },
  { label: '120x', value: 120 },
  { label: '240x', value: 240 },
]

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

const BUILDING_COLORS = [
  { label: 'Cinza', value: '#8899aa' },
  { label: 'Azul', value: '#4a9eff' },
  { label: 'Verde', value: '#34d399' },
  { label: 'Laranja', value: '#fb923c' },
  { label: 'Roxo', value: '#a78bfa' },
  { label: 'Rosa', value: '#f472b6' },
]

function getMapStyle(theme) {
  return theme === 'light' ? STYLE_LIGHT : STYLE_DARK
}

function formatDateISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

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

function getSkyGradient(altitude) {
  if (altitude < -12) return 'linear-gradient(to bottom, #0a0a1a 0%, #111122 100%)'
  if (altitude < -6) return 'linear-gradient(to bottom, #0f1033 0%, #1a1a3e 100%)'
  if (altitude < 0) return 'linear-gradient(to bottom, #1a1a3e 0%, #c45c2a 60%, #e8a04a 100%)'
  if (altitude < 10) return 'linear-gradient(to bottom, #3a6fb5 0%, #e8975a 50%, #f0c87a 100%)'
  if (altitude < 30) return 'linear-gradient(to bottom, #4a90d9 0%, #6db3f0 50%, #a8d4f5 100%)'
  return 'linear-gradient(to bottom, #3a7bd5 0%, #6db3f0 100%)'
}

/* ===== Convex Hull (Andrew's monotone chain) ===== */
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length <= 2) return pts

  const cross = (O, A, B) =>
    (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0])

  const lower = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }

  const upper = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

/* ===== Shadow polygon from building footprint ===== */
function computeShadowPolygon(coords, height, sunPos, centerLat) {
  if (sunPos.altitude <= 0.5 || !coords || coords.length < 3) return null

  const altRad = (sunPos.altitude * Math.PI) / 180
  const azRad = (sunPos.azimuth * Math.PI) / 180
  const shadowDir = azRad + Math.PI
  const shadowLen = height / Math.tan(altRad)

  // Cap shadow length to avoid absurdly long shadows at sunset
  const cappedLen = Math.min(shadowLen, 500)
  const cosLat = Math.cos((centerLat * Math.PI) / 180)
  const dLat = (cappedLen * Math.cos(shadowDir)) / 111320
  const dLng = (cappedLen * Math.sin(shadowDir)) / (111320 * cosLat)

  // Original vertices (remove closing duplicate if present)
  let verts = coords
  if (
    verts.length > 1 &&
    verts[0][0] === verts[verts.length - 1][0] &&
    verts[0][1] === verts[verts.length - 1][1]
  ) {
    verts = verts.slice(0, -1)
  }

  const projected = verts.map((c) => [c[0] + dLng, c[1] + dLat])
  const allPoints = [...verts, ...projected]
  const hull = convexHull(allPoints)
  if (hull.length < 3) return null
  const closed = [...hull, hull[0]]

  const opacity = Math.min(0.35, 0.08 + (sunPos.altitude / 90) * 0.27)

  return {
    type: 'Feature',
    properties: { opacity },
    geometry: { type: 'Polygon', coordinates: [closed] },
  }
}

/* ===== Compute shadows for all visible buildings ===== */
function computeAllShadows(map, sunPos, customBuildings, centerLat) {
  const features = []

  if (sunPos.altitude <= 0.5) {
    return { type: 'FeatureCollection', features }
  }

  // OSM buildings from rendered features
  if (map.getLayer('3d-buildings')) {
    try {
      const osmFeatures = map.queryRenderedFeatures({ layers: ['3d-buildings'] })
      const limit = 250
      const subset = osmFeatures.slice(0, limit)
      for (const f of subset) {
        if (!f.geometry) continue
        const rings =
          f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates[0]]
            : f.geometry.type === 'MultiPolygon'
              ? f.geometry.coordinates.map((p) => p[0])
              : []
        const height = f.properties.render_height || f.properties.height || 10
        for (const ring of rings) {
          const shadow = computeShadowPolygon(ring, height, sunPos, centerLat)
          if (shadow) features.push(shadow)
        }
      }
    } catch {
      // queryRenderedFeatures can fail if style not loaded
    }
  }

  // Custom buildings
  for (const b of customBuildings) {
    const shadow = computeShadowPolygon(b.coordinates, b.height, sunPos, centerLat)
    if (shadow) features.push(shadow)
  }

  return { type: 'FeatureCollection', features }
}

function buildingsToGeoJSON(buildings) {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b, i) => ({
      type: 'Feature',
      id: i,
      properties: { height: b.height, color: b.color || '#8899aa', index: i },
      geometry: {
        type: 'Polygon',
        coordinates: [b.coordinates],
      },
    })),
  }
}

function addMapLayers(map, sunPos, customBuildings) {
  // Remove the flat building layer
  if (map.getLayer('building')) {
    map.removeLayer('building')
  }

  const layers = map.getStyle().layers || []
  let labelLayerId
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      labelLayerId = layer.id
      break
    }
  }

  // 3D buildings (add first so shadow layer can reference it)
  if (!map.getLayer('3d-buildings')) {
    map.addLayer(
      {
        id: '3d-buildings',
        source: 'openmaptiles',
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 13,
        paint: {
          'fill-extrusion-color': '#aaaaaa',
          'fill-extrusion-height': [
            'coalesce',
            ['get', 'render_height'],
            ['get', 'height'],
            10,
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.75,
        },
      },
      labelLayerId
    )
  }

  // Ground shadow layer — uses fill-extrusion with tiny height so it renders
  // in the 3D compositing pass (flat fill layers are hidden under extrusions)
  if (!map.getSource('ground-shadows')) {
    map.addSource('ground-shadows', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  if (!map.getLayer('ground-shadows-fill')) {
    map.addLayer(
      {
        id: 'ground-shadows-fill',
        type: 'fill-extrusion',
        source: 'ground-shadows',
        paint: {
          'fill-extrusion-color': '#1a1a2e',
          'fill-extrusion-height': 0.5,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.45,
        },
      },
      '3d-buildings'
    )
  }

  // Custom buildings source + layer
  if (!map.getSource('custom-buildings')) {
    map.addSource('custom-buildings', {
      type: 'geojson',
      data: buildingsToGeoJSON(customBuildings),
    })
  }

  if (!map.getLayer('custom-buildings-3d')) {
    map.addLayer({
      id: 'custom-buildings-3d',
      type: 'fill-extrusion',
      source: 'custom-buildings',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8,
      },
    })
  }

  // Selected building highlight
  if (!map.getSource('selected-building')) {
    map.addSource('selected-building', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  if (!map.getLayer('selected-building-outline')) {
    map.addLayer({
      id: 'selected-building-outline',
      type: 'line',
      source: 'selected-building',
      paint: {
        'line-color': '#fb923c',
        'line-width': 3,
        'line-dasharray': [2, 1],
      },
    })
  }

  // Drawing polygon preview
  if (!map.getSource('drawing-preview')) {
    map.addSource('drawing-preview', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  if (!map.getLayer('drawing-preview-fill')) {
    map.addLayer({
      id: 'drawing-preview-fill',
      type: 'fill',
      source: 'drawing-preview',
      paint: {
        'fill-color': '#fb923c',
        'fill-opacity': 0.3,
      },
    })
  }

  if (!map.getLayer('drawing-preview-line')) {
    map.addLayer({
      id: 'drawing-preview-line',
      type: 'line',
      source: 'drawing-preview',
      paint: {
        'line-color': '#fb923c',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    })
  }

  // Drawing vertices
  if (!map.getSource('drawing-points')) {
    map.addSource('drawing-points', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }

  if (!map.getLayer('drawing-points-layer')) {
    map.addLayer({
      id: 'drawing-points-layer',
      type: 'circle',
      source: 'drawing-points',
      paint: {
        'circle-radius': 5,
        'circle-color': '#fb923c',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })
  }
}

function updateSunLighting(map, sunPos) {
  if (!map || !map.getStyle()) return

  const { azimuth, altitude } = sunPos
  const intensity = mapAltitudeToIntensity(altitude)
  const color = mapAltitudeToColor(altitude)

  map.setLight({
    anchor: 'map',
    position: [1.5, azimuth, Math.max(0, altitude)],
    color: color,
    intensity: intensity,
  })

  let buildingColor, buildingOpacity
  if (altitude < -6) {
    buildingColor = '#333344'
    buildingOpacity = 0.6
  } else if (altitude < 0) {
    buildingColor = '#665544'
    buildingOpacity = 0.65
  } else if (altitude < 10) {
    buildingColor = '#cc9966'
    buildingOpacity = 0.75
  } else {
    buildingColor = '#aaaaaa'
    buildingOpacity = 0.75
  }

  if (map.getLayer('3d-buildings')) {
    map.setPaintProperty('3d-buildings', 'fill-extrusion-color', buildingColor)
    map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', buildingOpacity)
  }

  if (map.getLayer('custom-buildings-3d')) {
    map.setPaintProperty('custom-buildings-3d', 'fill-extrusion-opacity', buildingOpacity)
  }
}

function updateDrawingPreview(map, points) {
  if (!map) return

  const pointFeatures = points.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: p },
  }))
  const pointsSrc = map.getSource('drawing-points')
  if (pointsSrc) {
    pointsSrc.setData({ type: 'FeatureCollection', features: pointFeatures })
  }

  const previewSrc = map.getSource('drawing-preview')
  if (previewSrc) {
    if (points.length >= 3) {
      const closed = [...points, points[0]]
      previewSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [closed] },
          },
        ],
      })
    } else if (points.length >= 2) {
      previewSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: points },
          },
        ],
      })
    } else {
      previewSrc.setData({ type: 'FeatureCollection', features: [] })
    }
  }
}

/* ===== Centroid of a polygon ring ===== */
function polygonCentroid(coords) {
  let sumLng = 0
  let sumLat = 0
  const verts = coords[coords.length - 1][0] === coords[0][0] && coords[coords.length - 1][1] === coords[0][1]
    ? coords.slice(0, -1)
    : coords
  for (const c of verts) {
    sumLng += c[0]
    sumLat += c[1]
  }
  return [sumLng / verts.length, sumLat / verts.length]
}

/* ===== Solar Compass Component ===== */
function SolarCompass({ sunPos, sunTimes, bearing, lat, lng, size = 140 }) {
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
      const map = new maplibregl.Map({
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
      })

      // No default nav control — user controls via mouse drag
      // Right-click drag = rotate, Ctrl+drag = pitch

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

      map.on('error', (e) => {
        console.error('MapLibre error:', e.error)
      })
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
  }, [theme])

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

    return () => {
      map.off('click', handleClick)
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
      </Head>

      {/* Map */}
      <div ref={mapContainerRef} className="sm-map-container" />

      {/* Sky gradient overlay */}
      <div
        className="sm-sky-overlay"
        style={{ background: getSkyGradient(sunPos.altitude) }}
      />

      {/* Loading */}
      <div className={`sm-loading ${mapLoaded ? 'hidden' : ''}`}>
        <span className="sm-loading-text">Carregando mapa...</span>
      </div>

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
      <div className="sm-controls">
        {/* Mode selector */}
        <div className="sm-mode-selector">
          {[
            { key: 'single-day', label: 'Dia' },
            { key: 'date-range', label: 'Intervalo' },
            { key: 'fixed-hour', label: 'Ano' },
          ].map((m) => (
            <button
              key={m.key}
              className={`sm-mode-btn ${playMode === m.key ? 'active' : ''}`}
              onClick={() => {
                setPlayMode(m.key)
                setIsPlaying(false)
                if (m.key === 'date-range') {
                  setCurrentPlayDate(new Date(startDate))
                  currentPlayDateRef.current = new Date(startDate)
                } else if (m.key === 'fixed-hour') {
                  setYearProgress(0)
                  yearProgressRef.current = 0
                }
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="sm-controls-top">
          <form className="sm-search-wrapper" onSubmit={handleSearch}>
            <span className="sm-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              className="sm-search-input"
              placeholder="Buscar local..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Date inputs - mode aware */}
          {playMode === 'date-range' ? (
            <div className="sm-date-range-inputs">
              <input
                type="date"
                className="sm-date-input sm-date-small"
                value={formatDateISO(startDate)}
                onChange={(e) => {
                  const d = new Date(e.target.value + 'T12:00:00')
                  if (!isNaN(d)) {
                    setStartDate(d)
                    setCurrentPlayDate(new Date(d))
                    currentPlayDateRef.current = new Date(d)
                  }
                }}
              />
              <span className="sm-date-range-sep">&rarr;</span>
              <input
                type="date"
                className="sm-date-input sm-date-small"
                value={formatDateISO(endDate)}
                onChange={(e) => {
                  const d = new Date(e.target.value + 'T12:00:00')
                  if (!isNaN(d)) setEndDate(d)
                }}
              />
            </div>
          ) : playMode === 'fixed-hour' ? (
            <div className="sm-fixed-hour-inputs">
              <input
                type="number"
                className="sm-year-input"
                value={selectedDate.getFullYear()}
                min="1900"
                max="2100"
                onChange={(e) => {
                  const y = parseInt(e.target.value)
                  if (!isNaN(y) && y >= 1900 && y <= 2100) {
                    const d = new Date(selectedDate)
                    d.setFullYear(y)
                    setSelectedDate(d)
                  }
                }}
              />
              <input
                type="time"
                className="sm-time-input"
                value={`${String(fixedHour).padStart(2, '0')}:${String(fixedMinute).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number)
                  if (!isNaN(h)) setFixedHour(h)
                  if (!isNaN(m)) setFixedMinute(m)
                }}
              />
            </div>
          ) : (
            <input
              type="date"
              className="sm-date-input"
              value={formatDateISO(selectedDate)}
              onChange={handleDateChange}
            />
          )}

          <button className="sm-speed-btn" onClick={cycleSpeed} title="Velocidade">
            {playMode === 'fixed-hour'
              ? `${speed}d/s`
              : (SPEEDS.find((s) => s.value === speed)?.label || '5x')}
          </button>

          <button
            className={`sm-skip-night-btn ${skipNight ? 'active' : ''}`}
            onClick={() => setSkipNight((v) => !v)}
            title={skipNight ? 'Pular noite: ligado' : 'Pular noite: desligado'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          </button>

          <span className="sm-coords">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        {/* Date indicator for date-range mode */}
        {playMode === 'date-range' && isPlaying && (
          <div className="sm-date-indicator">
            {effectiveDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {startDate && endDate && (() => {
              const totalDays = Math.round((endDate - startDate) / 86400000)
              const currentDay = Math.round((currentPlayDate - startDate) / 86400000) + 1
              return ` (Dia ${currentDay} de ${totalDays})`
            })()}
          </div>
        )}

        {/* Month indicator for fixed-hour mode */}
        {playMode === 'fixed-hour' && (
          <div className="sm-date-indicator">
            {effectiveDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
          </div>
        )}

        <div className="sm-slider-row">
          <button
            className={`sm-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => {
              if (!isPlaying && playMode === 'date-range') {
                setCurrentPlayDate(new Date(startDate))
                currentPlayDateRef.current = new Date(startDate)
                setCurrentMinutes(0)
              }
              if (!isPlaying && playMode === 'fixed-hour') {
                setYearProgress(0)
                yearProgressRef.current = 0
              }
              setIsPlaying(!isPlaying)
            }}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4l14 8-14 8V4z" />
              </svg>
            )}
          </button>

          <span className="sm-time-display">
            {playMode === 'fixed-hour'
              ? `${String(fixedHour).padStart(2, '0')}:${String(fixedMinute).padStart(2, '0')}`
              : formatTimeFromMinutes(Math.floor(currentMinutes))}
          </span>

          {playMode === 'fixed-hour' ? (
            <div className="sm-slider-container">
              <div className="sm-slider-track">
                <div
                  className="sm-slider-fill"
                  style={{ width: `${(yearProgress / 365) * 100}%` }}
                />
              </div>
              <input
                type="range"
                className="sm-time-slider"
                min="0"
                max="365"
                step="0.1"
                value={yearProgress}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  setYearProgress(v)
                  yearProgressRef.current = v
                }}
              />
            </div>
          ) : (
            <div className="sm-slider-container">
              <div className="sm-slider-track">
                <div
                  className="sm-slider-daylight"
                  style={{
                    left: `${daylightLeft}%`,
                    width: `${daylightWidth}%`,
                  }}
                />
                <div
                  className="sm-slider-fill"
                  style={{ width: `${sliderPercent}%` }}
                />
              </div>
              <input
                type="range"
                className="sm-time-slider"
                min="0"
                max="1439"
                step="1"
                value={Math.floor(currentMinutes)}
                onChange={handleSliderChange}
              />
            </div>
          )}
        </div>
      </div>

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
