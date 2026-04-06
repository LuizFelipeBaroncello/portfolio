/**
 * Sun ray intersection math and coordinate conversion for interior building view.
 */

export interface Point2D {
  x: number
  z: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface WallNormal {
  x: number
  z: number
}

export interface Wall {
  wallIndex: number
  start: Point3D
  end: Point3D
  normal: WallNormal
  length: number
  height: number
  midLabel: string
}

export interface WindowConfig {
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface Camera {
  x: number
  y: number
  z: number
  rotY: number
  rotX: number
  fov: number
  width: number
  height: number
}

export interface ProjectedPoint {
  x: number
  y: number
  depth: number
}

export interface Centroid {
  lng: number
  lat: number
}

export interface LocalCoordsResult {
  localCoords: Point2D[]
  centroid: Centroid
}

export interface SunRayPatch {
  surface: 'floor' | number
  points: Point3D[]
}

const DEG2RAD = Math.PI / 180
const METERS_PER_DEG_LAT = 111320

/**
 * Convert polygon coordinates from [lng, lat] to local XZ meter coords
 * relative to the polygon centroid.
 */
export function latlngToLocalMeters(coordinates: [number, number][], centerLat: number): LocalCoordsResult {
  const n = coordinates.length
  let cx = 0, cy = 0
  for (const [lng, lat] of coordinates) {
    cx += lng
    cy += lat
  }
  cx /= n
  cy /= n

  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos(cy * DEG2RAD)

  return {
    localCoords: coordinates.map(([lng, lat]) => ({
      x: (lng - cx) * metersPerDegLng,
      z: (lat - cy) * METERS_PER_DEG_LAT,
    })),
    centroid: { lng: cx, lat: cy },
  }
}

/**
 * Detect polygon orientation via signed area.
 * Returns 1 for CCW, -1 for CW.
 */
export function getPolygonOrientation(localCoords: Point2D[]): number {
  let area = 0
  const n = localCoords.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += localCoords[i].x * localCoords[j].z
    area -= localCoords[j].x * localCoords[i].z
  }
  return area >= 0 ? 1 : -1
}

/**
 * Get wall segments from local meter coordinates.
 * Each wall: { start, end, normal, length, wallIndex, midLabel }
 */
export function getWallSegments(localCoords: Point2D[], buildingHeight: number): Wall[] {
  const orient = getPolygonOrientation(localCoords)
  const walls: Wall[] = []
  const n = localCoords.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const s = localCoords[i]
    const e = localCoords[j]
    const dx = e.x - s.x
    const dz = e.z - s.z
    const length = Math.sqrt(dx * dx + dz * dz)

    // Outward normal (perpendicular to wall, pointing out)
    const nx = -dz / length * orient
    const nz = dx / length * orient

    walls.push({
      wallIndex: i,
      start: { x: s.x, y: 0, z: s.z },
      end: { x: e.x, y: 0, z: e.z },
      normal: { x: nx, z: nz },
      length,
      height: buildingHeight,
      midLabel: `Parede ${i + 1}`,
    })
  }

  return walls
}

/**
 * Compute the 4 corner points of a window on a wall in 3D.
 * windowConfig: { offsetX (0-1), offsetY (meters from floor), width (m), height (m) }
 */
export function computeWindowRect(wall: Wall, windowConfig: WindowConfig): Point3D[] {
  const { offsetX, offsetY, width, height } = windowConfig
  const dx = wall.end.x - wall.start.x
  const dz = wall.end.z - wall.start.z

  // Window center along wall
  const cx = wall.start.x + dx * offsetX
  const cz = wall.start.z + dz * offsetX

  // Wall direction unit vector
  const ux = dx / wall.length
  const uz = dz / wall.length

  const halfW = width / 2

  return [
    // bottom-left, bottom-right, top-right, top-left
    { x: cx - ux * halfW, y: offsetY, z: cz - uz * halfW },
    { x: cx + ux * halfW, y: offsetY, z: cz + uz * halfW },
    { x: cx + ux * halfW, y: offsetY + height, z: cz + uz * halfW },
    { x: cx - ux * halfW, y: offsetY + height, z: cz - uz * halfW },
  ]
}

/**
 * Compute the light patch on the floor from sun rays through a window.
 * sunAzimuth: degrees (0-360, 0=N, 90=E, 180=S, 270=W)
 * sunAltitude: degrees above horizon
 * Returns array of {x, y, z} points forming the floor patch polygon, or null if sun doesn't shine through.
 */
export function computeSunRayPatch(
  sunAzimuth: number,
  sunAltitude: number,
  windowCorners: Point3D[],
  buildingHeight: number
): Point3D[] | null {
  if (sunAltitude <= 0) return null // Sun below horizon

  // Sun direction vector (from sun toward ground - reversed ray direction)
  const azRad = sunAzimuth * DEG2RAD
  const altRad = sunAltitude * DEG2RAD

  // Direction sunlight travels: from sun toward building interior (inward + downward)
  const sunDirX = -Math.sin(azRad) * Math.cos(altRad)
  const sunDirZ = -Math.cos(azRad) * Math.cos(altRad)
  const sunDirY = -Math.sin(altRad) // downward

  if (sunDirY >= 0) return null // Sun ray going up, no floor patch

  // For each window corner, cast a ray in the sun's direction and intersect with floor (y=0)
  const floorPoints: Point3D[] = []
  for (const corner of windowCorners) {
    // Ray: P = corner + t * sunDir
    // Floor: y = 0 => t = -corner.y / sunDirY
    const t = -corner.y / sunDirY
    if (t <= 0) continue // Ray goes away from floor

    floorPoints.push({
      x: corner.x + t * sunDirX,
      y: 0,
      z: corner.z + t * sunDirZ,
    })
  }

  if (floorPoints.length < 3) return null

  return floorPoints
}

/**
 * Ray-wall intersection: find parameter t where ray hits a wall rectangle.
 * Returns t > 0 if intersection is valid (within wall bounds), else null.
 */
function rayWallIntersect(origin: Point3D, dir: Point3D, wall: Wall, buildingHeight: number): number | null {
  const nx = wall.normal.x, nz = wall.normal.z
  const denom = dir.x * nx + dir.z * nz
  if (Math.abs(denom) < 1e-8) return null // parallel to wall

  const t = ((wall.start.x - origin.x) * nx + (wall.start.z - origin.z) * nz) / denom
  if (t <= 0.001) return null // behind or at origin

  // Check height bounds
  const hy = origin.y + t * dir.y
  if (hy < 0 || hy > buildingHeight) return null

  // Check along-wall bounds (0 to 1 parametric)
  const wx = wall.end.x - wall.start.x
  const wz = wall.end.z - wall.start.z
  const hx = origin.x + t * dir.x
  const hz = origin.z + t * dir.z
  const proj = ((hx - wall.start.x) * wx + (hz - wall.start.z) * wz) / (wall.length * wall.length)
  if (proj < 0 || proj > 1) return null

  return t
}

/**
 * Compute light patches on all surfaces (floor + walls) from sun rays through a window.
 * Returns array of { surface: 'floor' | wallIndex, points: [{x,y,z}, ...] }.
 */
export function computeSunRayPatches(
  sunAzimuth: number,
  sunAltitude: number,
  windowCorners: Point3D[],
  buildingHeight: number,
  walls: Wall[]
): SunRayPatch[] {
  if (sunAltitude <= 0) return []

  const azRad = sunAzimuth * DEG2RAD
  const altRad = sunAltitude * DEG2RAD
  // Direction sunlight travels: from sun toward building interior (inward + downward)
  const sunDirX = -Math.sin(azRad) * Math.cos(altRad)
  const sunDirZ = -Math.cos(azRad) * Math.cos(altRad)
  const sunDirY = -Math.sin(altRad)

  if (sunDirY >= 0) return []

  const dir: Point3D = { x: sunDirX, y: sunDirY, z: sunDirZ }
  const hitPoints: Array<Point3D & { surface: 'floor' | number }> = []

  for (const corner of windowCorners) {
    let bestT = Infinity
    let bestHit: Point3D | null = null
    let bestSurface: 'floor' | number = 'floor'

    // Check floor (y=0)
    const tFloor = -corner.y / sunDirY
    if (tFloor > 0.001) {
      bestT = tFloor
      bestHit = {
        x: corner.x + tFloor * sunDirX,
        y: 0,
        z: corner.z + tFloor * sunDirZ,
      }
      bestSurface = 'floor'
    }

    // Check each wall
    for (const wall of walls) {
      const t = rayWallIntersect(corner, dir, wall, buildingHeight)
      if (t !== null && t < bestT) {
        bestT = t
        bestHit = {
          x: corner.x + t * sunDirX,
          y: corner.y + t * sunDirY,
          z: corner.z + t * sunDirZ,
        }
        bestSurface = wall.wallIndex
      }
    }

    if (bestHit) {
      hitPoints.push({ ...bestHit, surface: bestSurface })
    }
  }

  // Group by surface
  const groups: Record<string, Point3D[]> = {}
  for (const hp of hitPoints) {
    const key = String(hp.surface)
    if (!groups[key]) groups[key] = []
    groups[key].push({ x: hp.x, y: hp.y, z: hp.z })
  }

  const patches: SunRayPatch[] = []
  for (const [surface, points] of Object.entries(groups)) {
    if (points.length >= 3) {
      patches.push({
        surface: surface === 'floor' ? 'floor' : parseInt(surface),
        points,
      })
    }
  }

  return patches
}

/**
 * Check if the sun faces a wall (i.e., sunlight hits the exterior of this wall).
 * Returns true if the sun direction has a component toward the wall's normal.
 */
export function sunFacesWall(sunAzimuth: number, sunAltitude: number, wallNormal: WallNormal): boolean {
  if (sunAltitude <= 0) return false

  const azRad = sunAzimuth * DEG2RAD
  // Sun direction toward the building (reversed: where light comes from)
  const sunTowardX = -Math.sin(azRad)
  const sunTowardZ = -Math.cos(azRad)

  // Dot product of sun direction with wall outward normal
  // If negative, sunlight opposes the outward normal = hits the exterior of this wall
  const dot = sunTowardX * wallNormal.x + sunTowardZ * wallNormal.z
  return dot < 0
}

/**
 * Simple perspective projection for 3D -> 2D.
 * camera: { x, y, z, rotY (radians), rotX (radians), fov (degrees), width, height }
 */
export function projectPoint(point: Point3D, camera: Camera): ProjectedPoint | null {
  // Translate to camera space
  let dx = point.x - camera.x
  let dy = point.y - camera.y
  let dz = point.z - camera.z

  // Rotate around Y axis (horizontal rotation)
  const cosY = Math.cos(-camera.rotY)
  const sinY = Math.sin(-camera.rotY)
  const rx = dx * cosY - dz * sinY
  const rz = dx * sinY + dz * cosY

  // Rotate around X axis (vertical tilt)
  const cosX = Math.cos(-camera.rotX)
  const sinX = Math.sin(-camera.rotX)
  const ry = dy * cosX - rz * sinX
  const rz2 = dy * sinX + rz * cosX

  // Behind camera
  if (rz2 <= 0.01) return null

  // Perspective divide
  const fovRad = (camera.fov * DEG2RAD) / 2
  const scale = camera.height / (2 * Math.tan(fovRad))

  const sx = camera.width / 2 + (rx / rz2) * scale
  const sy = camera.height / 2 - (ry / rz2) * scale

  return { x: sx, y: sy, depth: rz2 }
}

/**
 * Compute camera position inside a building (at center, eye height).
 */
export function getInteriorCamera(
  localCoords: Point2D[],
  buildingHeight: number,
  viewAngle: number,
  viewPitch: number,
  canvasWidth: number,
  canvasHeight: number
): Camera {
  let cx = 0, cz = 0
  for (const p of localCoords) {
    cx += p.x
    cz += p.z
  }
  cx /= localCoords.length
  cz /= localCoords.length

  return {
    x: cx,
    y: Math.min(1.5, buildingHeight * 0.4), // eye height ~1.5m
    z: cz,
    rotY: viewAngle * DEG2RAD,
    rotX: viewPitch * DEG2RAD,
    fov: 75,
    width: canvasWidth,
    height: canvasHeight,
  }
}
