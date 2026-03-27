/**
 * MapLibre configuration constants, layer/source definitions,
 * building constants, shadow casting, and convex hull utilities
 * for the Sun Map page.
 */

import { mapAltitudeToIntensity, mapAltitudeToColor, SunPosition } from './sun-calc-utils'

// ─── Map constants ────────────────────────────────────────────────────────────

export const DEFAULT_LAT = -27.5934
export const DEFAULT_LNG = -48.5828
export const DEFAULT_ZOOM = 16

export const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
export const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

export const SPEEDS = [
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '30x', value: 30 },
  { label: '60x', value: 60 },
  { label: '120x', value: 120 },
  { label: '240x', value: 240 },
]

export const BUILDING_COLORS = [
  { label: 'Cinza', value: '#8899aa' },
  { label: 'Azul', value: '#4a9eff' },
  { label: 'Verde', value: '#34d399' },
  { label: 'Laranja', value: '#fb923c' },
  { label: 'Roxo', value: '#a78bfa' },
  { label: 'Rosa', value: '#f472b6' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getMapStyle(theme: string): string {
  return theme === 'light' ? STYLE_LIGHT : STYLE_DARK
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getSkyGradient(altitude: number): string {
  if (altitude < -12) return 'linear-gradient(to bottom, #0a0a1a 0%, #111122 100%)'
  if (altitude < -6) return 'linear-gradient(to bottom, #0f1033 0%, #1a1a3e 100%)'
  if (altitude < 0) return 'linear-gradient(to bottom, #1a1a3e 0%, #c45c2a 60%, #e8a04a 100%)'
  if (altitude < 10) return 'linear-gradient(to bottom, #3a6fb5 0%, #e8975a 50%, #f0c87a 100%)'
  if (altitude < 30) return 'linear-gradient(to bottom, #4a90d9 0%, #6db3f0 50%, #a8d4f5 100%)'
  return 'linear-gradient(to bottom, #3a7bd5 0%, #6db3f0 100%)'
}

/** Centroid of a polygon ring (array of [lng, lat] pairs). */
export function polygonCentroid(coords: [number, number][]): [number, number] {
  let sumLng = 0
  let sumLat = 0
  const verts =
    coords[coords.length - 1][0] === coords[0][0] &&
    coords[coords.length - 1][1] === coords[0][1]
      ? coords.slice(0, -1)
      : coords
  for (const c of verts) {
    sumLng += c[0]
    sumLat += c[1]
  }
  return [sumLng / verts.length, sumLat / verts.length]
}

// ─── Convex hull (Andrew's monotone chain) ────────────────────────────────────

export function convexHull(points: [number, number][]): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length <= 2) return pts

  const cross = (O: [number, number], A: [number, number], B: [number, number]) =>
    (A[0] - O[0]) * (B[1] - O[1]) - (A[1] - O[1]) * (B[0] - O[0])

  const lower: [number, number][] = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }

  const upper: [number, number][] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }

  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// ─── Shadow polygon from building footprint ───────────────────────────────────

export function computeShadowPolygon(
  coords: [number, number][],
  height: number,
  sunPos: SunPosition,
  centerLat: number
) {
  if (sunPos.altitude <= 0.5 || !coords || coords.length < 3) return null

  const altRad = (sunPos.altitude * Math.PI) / 180
  const azRad = (sunPos.azimuth * Math.PI) / 180
  const shadowDir = azRad + Math.PI
  const shadowLen = height / Math.tan(altRad)

  const cappedLen = Math.min(shadowLen, 500)
  const cosLat = Math.cos((centerLat * Math.PI) / 180)
  const dLat = (cappedLen * Math.cos(shadowDir)) / 111320
  const dLng = (cappedLen * Math.sin(shadowDir)) / (111320 * cosLat)

  let verts: [number, number][] = coords
  if (
    verts.length > 1 &&
    verts[0][0] === verts[verts.length - 1][0] &&
    verts[0][1] === verts[verts.length - 1][1]
  ) {
    verts = verts.slice(0, -1)
  }

  const projected: [number, number][] = verts.map((c) => [c[0] + dLng, c[1] + dLat])
  const allPoints: [number, number][] = [...verts, ...projected]
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

// ─── Compute shadows for all visible buildings ────────────────────────────────

export interface CustomBuilding {
  coordinates: [number, number][]
  height: number
  color?: string
}

export function computeAllShadows(
  map: any,
  sunPos: SunPosition,
  customBuildings: CustomBuilding[],
  centerLat: number
) {
  const features: any[] = []

  if (sunPos.altitude <= 0.5) {
    return { type: 'FeatureCollection', features }
  }

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
              ? f.geometry.coordinates.map((p: any) => p[0])
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

  for (const b of customBuildings) {
    const shadow = computeShadowPolygon(b.coordinates, b.height, sunPos, centerLat)
    if (shadow) features.push(shadow)
  }

  return { type: 'FeatureCollection', features }
}

// ─── GeoJSON helpers ──────────────────────────────────────────────────────────

export function buildingsToGeoJSON(buildings: CustomBuilding[]) {
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

// ─── MapLibre layer/source setup ──────────────────────────────────────────────

export function addMapLayers(map: any, sunPos: SunPosition, customBuildings: CustomBuilding[]) {
  if (map.getLayer('building')) {
    map.removeLayer('building')
  }

  const layers = map.getStyle().layers || []
  let labelLayerId: string | undefined
  for (const layer of layers) {
    if (layer.type === 'symbol' && layer.layout && layer.layout['text-field']) {
      labelLayerId = layer.id
      break
    }
  }

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

// ─── Sun lighting update ──────────────────────────────────────────────────────

export function updateSunLighting(map: any, sunPos: SunPosition) {
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

  let buildingColor: string, buildingOpacity: number
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

// ─── Drawing preview update ───────────────────────────────────────────────────

export function updateDrawingPreview(map: any, points: [number, number][]) {
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
