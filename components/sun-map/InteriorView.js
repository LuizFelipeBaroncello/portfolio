import { useState, useEffect, useRef, useCallback } from 'react'
import { formatTimeFromMinutes } from '../../lib/sun-calc-utils'
import {
  latlngToLocalMeters,
  getWallSegments,
  computeWindowRect,
  computeSunRayPatches,
  sunFacesWall,
  projectPoint,
  getInteriorCamera,
} from '../../lib/sun-ray-utils'

const DEFAULT_WINDOW = {
  offsetX: 0.5,
  offsetY: 1.0,
  width: 2.0,
  height: 1.5,
}

const WALK_STEP = 0.3
const ZOOM_STEP = 0.5
const CAMERA_ICON_RADIUS = 10

function drawPolygon(ctx, points, fillStyle, strokeStyle, lineWidth) {
  if (!points || points.length < 3) return
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth || 1
    ctx.stroke()
  }
}

function drawFloorGrid(ctx, localCoords, camera) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const p of localCoords) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.z < minZ) minZ = p.z
    if (p.z > maxZ) maxZ = p.z
  }
  const gMinX = Math.floor(minX), gMaxX = Math.ceil(maxX)
  const gMinZ = Math.floor(minZ), gMaxZ = Math.ceil(maxZ)

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
  ctx.lineWidth = 0.5

  // X-aligned lines (varying X, spanning Z)
  for (let x = gMinX; x <= gMaxX; x++) {
    const p1 = projectPoint({ x, y: 0, z: gMinZ }, camera)
    const p2 = projectPoint({ x, y: 0, z: gMaxZ }, camera)
    if (p1 && p2) {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
  }
  // Z-aligned lines (varying Z, spanning X)
  for (let z = gMinZ; z <= gMaxZ; z++) {
    const p1 = projectPoint({ x: gMinX, y: 0, z }, camera)
    const p2 = projectPoint({ x: gMaxX, y: 0, z }, camera)
    if (p1 && p2) {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
  }
}

function renderInterior(ctx, canvas, localCoords, walls, windowConfigs, sunPos, buildingHeight, camera) {
  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, w, h)

  const faces = []

  // Floor
  const floorPoints = localCoords.map((p) =>
    projectPoint({ x: p.x, y: 0, z: p.z }, camera)
  ).filter(Boolean)
  if (floorPoints.length >= 3) {
    const avgDepth = floorPoints.reduce((s, p) => s + p.depth, 0) / floorPoints.length
    faces.push({ points: floorPoints, fill: 'rgba(220, 220, 230, 0.9)', stroke: 'rgba(180, 180, 190, 0.5)', depth: avgDepth, type: 'floor' })
  }

  // Ceiling
  const ceilPoints = localCoords.map((p) =>
    projectPoint({ x: p.x, y: buildingHeight, z: p.z }, camera)
  ).filter(Boolean)
  if (ceilPoints.length >= 3) {
    const avgDepth = ceilPoints.reduce((s, p) => s + p.depth, 0) / ceilPoints.length
    faces.push({ points: ceilPoints, fill: 'rgba(235, 235, 240, 0.8)', stroke: 'rgba(200, 200, 210, 0.4)', depth: avgDepth, type: 'ceiling' })
  }

  // Walls
  for (const wall of walls) {
    const wallCorners = [
      { x: wall.start.x, y: 0, z: wall.start.z },
      { x: wall.end.x, y: 0, z: wall.end.z },
      { x: wall.end.x, y: buildingHeight, z: wall.end.z },
      { x: wall.start.x, y: buildingHeight, z: wall.start.z },
    ]

    const projected = wallCorners.map((p) => projectPoint(p, camera)).filter(Boolean)
    if (projected.length >= 3) {
      const avgDepth = projected.reduce((s, p) => s + p.depth, 0) / projected.length
      const isSunlit = sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal) && sunPos.altitude > 0

      const fill = isSunlit ? 'rgba(230, 210, 170, 0.6)' : 'rgba(200, 200, 210, 0.6)'

      faces.push({ points: projected, fill, stroke: 'rgba(150, 150, 160, 0.4)', depth: avgDepth, type: 'wall', wallIndex: wall.wallIndex })
    }

    const wallWindows = windowConfigs.filter((wc) => wc.wallIndex === wall.wallIndex)
    for (const wc of wallWindows) {
      const rect = computeWindowRect(wall, wc)
      const projWin = rect.map((p) => projectPoint(p, camera)).filter(Boolean)
      if (projWin.length >= 3) {
        const avgDepth = projWin.reduce((s, p) => s + p.depth, 0) / projWin.length
        const isSunlit = sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal) && sunPos.altitude > 0
        faces.push({
          points: projWin,
          fill: isSunlit ? 'rgba(135, 206, 250, 0.3)' : 'rgba(100, 140, 180, 0.2)',
          stroke: 'rgba(80, 130, 170, 0.5)',
          depth: avgDepth - 0.01,
          type: 'window',
        })

        if (isSunlit) {
          const patches = computeSunRayPatches(sunPos.azimuth, sunPos.altitude, rect, buildingHeight, walls)
          for (const patch of patches) {
            const projPatch = patch.points.map((p) => projectPoint(p, camera)).filter(Boolean)
            if (projPatch.length >= 3) {
              const patchDepth = projPatch.reduce((s, p) => s + p.depth, 0) / projPatch.length
              const isFloor = patch.surface === 'floor'
              faces.push({
                points: projPatch,
                fill: isFloor
                  ? `rgba(251, 191, 60, ${Math.min(0.5, sunPos.altitude / 90 * 0.6 + 0.1)})`
                  : `rgba(251, 191, 60, ${Math.min(0.35, sunPos.altitude / 90 * 0.4 + 0.08)})`,
                stroke: 'rgba(251, 191, 60, 0.3)',
                depth: patchDepth - 0.02,
                type: 'light',
              })
            }
          }
        }
      }
    }
  }

  faces.sort((a, b) => b.depth - a.depth)
  for (const face of faces) {
    drawPolygon(ctx, face.points, face.fill, face.stroke, face.type === 'light' ? 1.5 : 0.5)
    if (face.type === 'floor') {
      drawFloorGrid(ctx, localCoords, camera)
    }
  }

  // Sun direction indicator
  const indicatorR = 30
  const ix = w - 50
  const iy = 50
  ctx.beginPath()
  ctx.arc(ix, iy, indicatorR, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  if (sunPos.altitude > 0) {
    const azRad = (sunPos.azimuth - camera.rotY * 180 / Math.PI) * Math.PI / 180
    const sx = ix + Math.sin(azRad) * indicatorR * 0.7
    const sy = iy - Math.cos(azRad) * indicatorR * 0.7
    ctx.beginPath()
    ctx.arc(sx, sy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fbbf3c'
    ctx.fill()
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.font = '10px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText('N', ix, iy - indicatorR - 4)
}

function renderInterior2D(ctx, canvas, localCoords, walls, windowConfigs, sunPos, buildingHeight, cameraPos, viewAngle) {
  const w = canvas.width
  const h = canvas.height
  const dpr = window.devicePixelRatio || 1

  ctx.fillStyle = '#0a0a14'
  ctx.fillRect(0, 0, w, h)

  // Compute bounding box
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
  for (const p of localCoords) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.z < minZ) minZ = p.z
    if (p.z > maxZ) maxZ = p.z
  }

  const padding = 40 * dpr
  const rangeX = maxX - minX || 1
  const rangeZ = maxZ - minZ || 1
  const scale = Math.min((w - padding * 2) / rangeX, (h - padding * 2) / rangeZ)
  const cx = w / 2
  const cz = h / 2
  const midX = (minX + maxX) / 2
  const midZ = (minZ + maxZ) / 2

  function toScreen(x, z) {
    return {
      x: cx + (x - midX) * scale,
      y: cz - (z - midZ) * scale, // flip Z for screen coords (up = +Z)
    }
  }

  // Draw floor polygon
  ctx.beginPath()
  const first = toScreen(localCoords[0].x, localCoords[0].z)
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < localCoords.length; i++) {
    const p = toScreen(localCoords[i].x, localCoords[i].z)
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.fillStyle = '#1a1a24'
  ctx.fill()
  ctx.strokeStyle = '#2a2a3a'
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw sun ray patches on floor (clipped to building polygon)
  ctx.save()
  ctx.beginPath()
  const clipP0 = toScreen(localCoords[0].x, localCoords[0].z)
  ctx.moveTo(clipP0.x, clipP0.y)
  for (let i = 1; i < localCoords.length; i++) {
    const cp = toScreen(localCoords[i].x, localCoords[i].z)
    ctx.lineTo(cp.x, cp.y)
  }
  ctx.closePath()
  ctx.clip()

  for (const wall of walls) {
    const isSunlit = sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal) && sunPos.altitude > 0
    if (!isSunlit) continue
    const wallWindows = windowConfigs.filter((wc) => wc.wallIndex === wall.wallIndex)
    for (const wc of wallWindows) {
      const rect = computeWindowRect(wall, wc)
      const patches = computeSunRayPatches(sunPos.azimuth, sunPos.altitude, rect, buildingHeight, walls)
      for (const patch of patches) {
        if (patch.surface !== 'floor') continue // Only draw floor patches in 2D
        const pts = patch.points.map((p) => toScreen(p.x, p.z))
        if (pts.length >= 3) {
          ctx.beginPath()
          ctx.moveTo(pts[0].x, pts[0].y)
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
          ctx.closePath()
          ctx.fillStyle = `rgba(251, 191, 60, ${Math.min(0.4, sunPos.altitude / 90 * 0.5 + 0.1)})`
          ctx.fill()
        }
      }
    }
  }
  ctx.restore()

  // Draw walls
  for (const wall of walls) {
    const s = toScreen(wall.start.x, wall.start.z)
    const e = toScreen(wall.end.x, wall.end.z)
    const isSunlit = sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal) && sunPos.altitude > 0

    ctx.beginPath()
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(e.x, e.y)
    ctx.strokeStyle = isSunlit ? '#fbbf3c' : '#4a4a5a'
    ctx.lineWidth = 3 * dpr
    ctx.stroke()

    // Draw windows on this wall
    const wallWindows = windowConfigs.filter((wc) => wc.wallIndex === wall.wallIndex)
    for (const wc of wallWindows) {
      const dx = wall.end.x - wall.start.x
      const dz = wall.end.z - wall.start.z
      const wcx = wall.start.x + dx * wc.offsetX
      const wcz = wall.start.z + dz * wc.offsetX
      const ux = dx / wall.length
      const uz = dz / wall.length
      const halfW = wc.width / 2
      const ws = toScreen(wcx - ux * halfW, wcz - uz * halfW)
      const we = toScreen(wcx + ux * halfW, wcz + uz * halfW)
      ctx.beginPath()
      ctx.moveTo(ws.x, ws.y)
      ctx.lineTo(we.x, we.y)
      ctx.strokeStyle = isSunlit ? 'rgba(135, 206, 250, 0.8)' : 'rgba(100, 140, 180, 0.5)'
      ctx.lineWidth = 5 * dpr
      ctx.stroke()
    }

    // Wall label
    const ms = toScreen((wall.start.x + wall.end.x) / 2, (wall.start.z + wall.end.z) / 2)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = `${10 * dpr}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`P${wall.wallIndex + 1}`, ms.x, ms.y)
  }

  // Draw camera icon
  const camX = cameraPos ? cameraPos.x : midX
  const camZ = cameraPos ? cameraPos.z : midZ
  const cs = toScreen(camX, camZ)
  const r = CAMERA_ICON_RADIUS * dpr

  // Camera body (circle)
  ctx.beginPath()
  ctx.arc(cs.x, cs.y, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(251, 146, 60, 0.8)'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.5 * dpr
  ctx.stroke()

  // Direction indicator (triangle)
  const rad = -viewAngle * Math.PI / 180 // negate for screen coords
  const tipLen = r * 1.8
  const tipX = cs.x + Math.sin(-rad) * tipLen
  const tipY = cs.y - Math.cos(-rad) * tipLen
  const baseAngle = 0.4
  const bx1 = cs.x + Math.sin(-rad + baseAngle) * r
  const by1 = cs.y - Math.cos(-rad + baseAngle) * r
  const bx2 = cs.x + Math.sin(-rad - baseAngle) * r
  const by2 = cs.y - Math.cos(-rad - baseAngle) * r

  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(bx1, by1)
  ctx.lineTo(bx2, by2)
  ctx.closePath()
  ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'
  ctx.fill()

  // North indicator
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `${11 * dpr}px system-ui`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('N', cx, padding * 0.6)

  // Sun direction arrow
  if (sunPos.altitude > 0) {
    const sunRad = sunPos.azimuth * Math.PI / 180
    const arrowLen = 25 * dpr
    const sunAx = w - 40 * dpr
    const sunAy = 40 * dpr
    ctx.beginPath()
    ctx.arc(sunAx, sunAy, 20 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.fill()
    const sdx = Math.sin(sunRad) * arrowLen
    const sdy = -Math.cos(sunRad) * arrowLen
    ctx.beginPath()
    ctx.moveTo(sunAx, sunAy)
    ctx.lineTo(sunAx + sdx, sunAy + sdy)
    ctx.strokeStyle = '#fbbf3c'
    ctx.lineWidth = 2 * dpr
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(sunAx + sdx, sunAy + sdy, 3 * dpr, 0, Math.PI * 2)
    ctx.fillStyle = '#fbbf3c'
    ctx.fill()
  }

  // Return toScreen for hit testing
  return { toScreen, scale, midX, midZ }
}

export default function InteriorView({
  building,
  buildingIndex,
  sunPos,
  effectiveDate,
  effectiveMinutes,
  onClose,
  onUpdateBuilding,
  // Time control props
  playMode,
  setPlayMode,
  isPlaying,
  setIsPlaying,
  currentMinutes,
  setCurrentMinutes,
  yearProgress,
  setYearProgress,
  yearProgressRef,
  speed,
  cycleSpeed,
  SPEEDS,
  selectedDate,
  setSelectedDate,
  fixedHour,
  setFixedHour,
  fixedMinute,
  setFixedMinute,
  sunTimes,
  daylightLeft,
  daylightWidth,
  handleSliderChange,
  handleDateChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  currentPlayDate,
  setCurrentPlayDate,
  currentPlayDateRef,
  skipNight,
  setSkipNight,
  formatDateISO,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [viewAngle, setViewAngle] = useState(0)
  const [viewPitch, setViewPitch] = useState(0)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, z: 0 })
  const [cameraOffsetY, setCameraOffsetY] = useState(0)
  const [selectedWallIndex, setSelectedWallIndex] = useState(null)
  const [windowConfigs, setWindowConfigs] = useState(() =>
    building.windows || []
  )
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef(null)
  const viewStartRef = useRef(null)
  const [viewMode, setViewMode] = useState('3d') // '2d' | '3d'
  const [camera2dPos, setCamera2dPos] = useState(null) // {x, z} in local meters, null = centroid
  const [draggingCamera2d, setDraggingCamera2d] = useState(false)
  const transform2dRef = useRef(null) // store last 2D transform for hit testing

  // Convert building to local meters
  const { localCoords } = latlngToLocalMeters(
    building.coordinates,
    building.coordinates[0][1]
  )
  const walls = getWallSegments(localCoords, building.height)

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Compute centroid for camera default position
  const centroid = { x: 0, z: 0 }
  for (const p of localCoords) { centroid.x += p.x; centroid.z += p.z }
  centroid.x /= localCoords.length
  centroid.z /= localCoords.length

  // Render on changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    if (viewMode === '2d') {
      const result = renderInterior2D(ctx, canvas, localCoords, walls, windowConfigs, sunPos, building.height, camera2dPos || centroid, viewAngle)
      transform2dRef.current = result
    } else {
      const camera = getInteriorCamera(
        localCoords,
        building.height,
        viewAngle,
        viewPitch,
        canvas.width,
        canvas.height
      )
      camera.x += cameraOffset.x
      camera.z += cameraOffset.z
      camera.y += cameraOffsetY
      renderInterior(ctx, canvas, localCoords, walls, windowConfigs, sunPos, building.height, camera)
      transform2dRef.current = null
    }
  }, [sunPos, viewAngle, viewPitch, windowConfigs, building, cameraOffset, cameraOffsetY, viewMode, camera2dPos])

  // Sync camera position when switching from 2D to 3D
  const prevViewModeRef = useRef(viewMode)
  useEffect(() => {
    if (prevViewModeRef.current === '2d' && viewMode === '3d' && camera2dPos) {
      setCameraOffset({
        x: camera2dPos.x - centroid.x,
        z: camera2dPos.z - centroid.z,
      })
    }
    prevViewModeRef.current = viewMode
  }, [viewMode])

  // Mouse drag for camera rotation (3D) or camera position (2D)
  const handleMouseDown = useCallback((e) => {
    if (viewMode === '2d') {
      const t = transform2dRef.current
      if (!t) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const mx = (e.clientX - rect.left) * dpr
      const my = (e.clientY - rect.top) * dpr
      // Hit test: is click near camera icon?
      const camPos = camera2dPos || centroid
      const cs = t.toScreen(camPos.x, camPos.z)
      const dist = Math.sqrt((mx - cs.x) ** 2 + (my - cs.y) ** 2)
      if (dist < CAMERA_ICON_RADIUS * dpr * 2.5) {
        setDraggingCamera2d(true)
        setIsDragging(true)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
      } else {
        // Drag to rotate view angle
        setIsDragging(true)
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        viewStartRef.current = { angle: viewAngle, pitch: viewPitch }
      }
    } else {
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      viewStartRef.current = { angle: viewAngle, pitch: viewPitch }
    }
  }, [viewAngle, viewPitch, viewMode, camera2dPos, centroid])

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStartRef.current) return
    if (viewMode === '2d' && draggingCamera2d) {
      const t = transform2dRef.current
      if (!t) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const mx = (e.clientX - rect.left) * dpr
      const my = (e.clientY - rect.top) * dpr
      // Inverse transform: screen -> local meters
      const localX = (mx - canvas.width / 2) / t.scale + t.midX
      const localZ = -(my - canvas.height / 2) / t.scale + t.midZ
      setCamera2dPos({ x: localX, z: localZ })
    } else if (viewMode === '2d') {
      // Rotate view angle
      const dx = e.clientX - dragStartRef.current.x
      setViewAngle(viewStartRef.current.angle + dx * 0.5)
    } else {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setViewAngle(viewStartRef.current.angle + dx * 0.5)
      setViewPitch(Math.max(-30, Math.min(30, viewStartRef.current.pitch - dy * 0.3)))
    }
  }, [isDragging, viewMode, draggingCamera2d])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggingCamera2d(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // WASD / Arrow key movement + Space/Shift for vertical
  useEffect(() => {
    const handleKeyDown = (e) => {
      const rad = viewAngle * Math.PI / 180
      const pitchRad = viewPitch * Math.PI / 180
      const cosP = Math.cos(pitchRad)
      const sinP = Math.sin(pitchRad)

      // Forward follows full 3D look direction
      const forwardX = Math.sin(rad) * cosP * WALK_STEP
      const forwardZ = Math.cos(rad) * cosP * WALK_STEP
      const forwardY = sinP * WALK_STEP

      // Strafe stays horizontal
      const rightX = Math.cos(rad) * WALK_STEP
      const rightZ = -Math.sin(rad) * WALK_STEP

      switch (e.key) {
        case 'w': case 'W': case 'ArrowUp':
          setCameraOffset((p) => ({ x: p.x + forwardX, z: p.z + forwardZ }))
          setCameraOffsetY((y) => y + forwardY)
          e.preventDefault()
          break
        case 's': case 'S': case 'ArrowDown':
          setCameraOffset((p) => ({ x: p.x - forwardX, z: p.z - forwardZ }))
          setCameraOffsetY((y) => y - forwardY)
          e.preventDefault()
          break
        case 'a': case 'A': case 'ArrowLeft':
          setCameraOffset((p) => ({ x: p.x - rightX, z: p.z - rightZ }))
          e.preventDefault()
          break
        case 'd': case 'D': case 'ArrowRight':
          setCameraOffset((p) => ({ x: p.x + rightX, z: p.z + rightZ }))
          e.preventDefault()
          break
        case ' ':
          setCameraOffsetY((y) => y + WALK_STEP)
          e.preventDefault()
          break
        case 'Shift':
          setCameraOffsetY((y) => y - WALK_STEP)
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewAngle, viewPitch])

  // Scroll to zoom (move forward/back in look direction)
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const step = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const rad = viewAngle * Math.PI / 180
    const pitchRad = viewPitch * Math.PI / 180
    const cosP = Math.cos(pitchRad)
    setCameraOffset((p) => ({
      x: p.x + Math.sin(rad) * cosP * step,
      z: p.z + Math.cos(rad) * cosP * step,
    }))
    setCameraOffsetY((y) => y + Math.sin(pitchRad) * step)
  }, [viewAngle, viewPitch])

  const addWindow = (wallIndex) => {
    setWindowConfigs((prev) => [...prev, { ...DEFAULT_WINDOW, wallIndex }])
  }

  const updateWindow = (index, key, value) => {
    setWindowConfigs((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  const removeWindow = (index) => {
    setWindowConfigs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onUpdateBuilding({ ...building, windows: windowConfigs })
  }

  const selectedWallWindows = windowConfigs
    .map((wc, i) => ({ ...wc, _idx: i }))
    .filter((wc) => wc.wallIndex === selectedWallIndex)

  const sliderPercent = (currentMinutes / 1440) * 100

  return (
    <div className="sm-interior-modal">
      <div className="sm-interior-header">
        <span className="sm-interior-title">
          Interior &mdash; Edificio {buildingIndex + 1}
        </span>
        <div className="sm-interior-header-actions">
          <button
            className={`sm-interior-view-toggle ${viewMode}`}
            onClick={() => setViewMode((v) => v === '3d' ? '2d' : '3d')}
            title={viewMode === '3d' ? 'Mudar para vista 2D' : 'Mudar para vista 3D'}
          >
            {viewMode === '3d' ? '2D' : '3D'}
          </button>
          <button className="sm-interior-save-btn" onClick={handleSave}>
            Salvar
          </button>
          <button className="sm-interior-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>

      <div className="sm-interior-body">
        <div className="sm-interior-canvas-wrap" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="sm-interior-canvas"
            onMouseDown={handleMouseDown}
            onWheel={viewMode === '3d' ? handleWheel : undefined}
            style={{ cursor: isDragging ? 'grabbing' : (viewMode === '2d' ? 'default' : 'grab') }}
          />
          <div className="sm-interior-canvas-hint">
            {viewMode === '2d'
              ? 'Arraste o icone para mover a camera \u00b7 Arraste fora para girar'
              : 'Arraste para girar \u00b7 WASD para mover \u00b7 Space/Shift sobe/desce \u00b7 Scroll para zoom'}
          </div>
        </div>

        <div className="sm-interior-sidebar">
          <div className="sm-interior-section">
            <h4 className="sm-interior-section-title">Paredes</h4>
            <div className="sm-interior-wall-list">
              {walls.map((wall) => {
                const wallWindowCount = windowConfigs.filter(
                  (wc) => wc.wallIndex === wall.wallIndex
                ).length
                const isSelected = selectedWallIndex === wall.wallIndex
                const isSunlit = sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal) && sunPos.altitude > 0

                return (
                  <div
                    key={wall.wallIndex}
                    className={`sm-interior-wall-item ${isSelected ? 'selected' : ''} ${isSunlit ? 'sunlit' : ''}`}
                    onClick={() => setSelectedWallIndex(isSelected ? null : wall.wallIndex)}
                  >
                    <span className="sm-interior-wall-name">
                      {wall.midLabel}
                      {isSunlit && <span className="sm-interior-sun-badge" title="Recebe sol">&#9728;</span>}
                    </span>
                    <span className="sm-interior-wall-info">
                      {wall.length.toFixed(1)}m
                      {wallWindowCount > 0 && ` \u00b7 ${wallWindowCount} jan.`}
                    </span>
                    <button
                      className="sm-interior-add-win-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        addWindow(wall.wallIndex)
                        setSelectedWallIndex(wall.wallIndex)
                      }}
                      title="Adicionar janela"
                    >
                      +
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {selectedWallIndex !== null && selectedWallWindows.length > 0 && (
            <div className="sm-interior-section">
              <h4 className="sm-interior-section-title">
                Janelas &mdash; Parede {selectedWallIndex + 1}
              </h4>
              {selectedWallWindows.map((wc) => (
                <div key={wc._idx} className="sm-interior-window-config">
                  <div className="sm-interior-slider-row">
                    <label>Posicao</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.01"
                      value={wc.offsetX}
                      onChange={(e) => updateWindow(wc._idx, 'offsetX', parseFloat(e.target.value))}
                    />
                    <span>{(wc.offsetX * 100).toFixed(0)}%</span>
                  </div>
                  <div className="sm-interior-slider-row">
                    <label>Altura</label>
                    <input
                      type="range"
                      min="0.3"
                      max={building.height - 1}
                      step="0.1"
                      value={wc.offsetY}
                      onChange={(e) => updateWindow(wc._idx, 'offsetY', parseFloat(e.target.value))}
                    />
                    <span>{wc.offsetY.toFixed(1)}m</span>
                  </div>
                  <div className="sm-interior-slider-row">
                    <label>Largura</label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={wc.width}
                      onChange={(e) => updateWindow(wc._idx, 'width', parseFloat(e.target.value))}
                    />
                    <span>{wc.width.toFixed(1)}m</span>
                  </div>
                  <div className="sm-interior-slider-row">
                    <label>Alt. Jan.</label>
                    <input
                      type="range"
                      min="0.3"
                      max="3"
                      step="0.1"
                      value={wc.height}
                      onChange={(e) => updateWindow(wc._idx, 'height', parseFloat(e.target.value))}
                    />
                    <span>{wc.height.toFixed(1)}m</span>
                  </div>
                  <button
                    className="sm-interior-remove-win-btn"
                    onClick={() => removeWindow(wc._idx)}
                  >
                    Remover janela
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="sm-interior-section">
            <h4 className="sm-interior-section-title">Sol</h4>
            <div className="sm-interior-sun-info">
              <div>Altitude: {sunPos.altitude.toFixed(1)}&deg;</div>
              <div>Azimute: {sunPos.azimuth.toFixed(1)}&deg;</div>
              <div>
                {sunPos.altitude > 0 ? 'Acima do horizonte' : 'Abaixo do horizonte'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full time controls bar */}
      <div className="sm-interior-controls">
        {/* Mode selector */}
        <div className="sm-interior-controls-row">
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
        </div>

        {/* Slider row */}
        <div className="sm-interior-slider-row-controls">
          <button
            className={`sm-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
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

          <span className="sm-interior-date-label">
            {effectiveDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        </div>

        {/* Date indicator for date-range mode */}
        {playMode === 'date-range' && isPlaying && (
          <div className="sm-interior-date-label" style={{ textAlign: 'center' }}>
            {effectiveDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            {startDate && endDate && (() => {
              const totalDays = Math.round((endDate - startDate) / 86400000)
              const currentDay = Math.round((currentPlayDate - startDate) / 86400000) + 1
              return ` (Dia ${currentDay} de ${totalDays})`
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
