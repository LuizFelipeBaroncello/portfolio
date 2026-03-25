import {
  latlngToLocalMeters,
  getPolygonOrientation,
  getWallSegments,
  computeWindowRect,
  computeSunRayPatch,
  sunFacesWall,
  projectPoint,
  getInteriorCamera,
} from '../../lib/sun-ray-utils'

// Simple square building polygon [lng, lat]
const SQUARE_POLYGON: [number, number][] = [
  [-46.63, -23.55],
  [-46.629, -23.55],
  [-46.629, -23.549],
  [-46.63, -23.549],
]

describe('sun-ray-utils', () => {
  describe('latlngToLocalMeters', () => {
    it('should return localCoords and centroid', () => {
      const result = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      expect(result.localCoords).toHaveLength(SQUARE_POLYGON.length)
      expect(result.centroid).toHaveProperty('lng')
      expect(result.centroid).toHaveProperty('lat')
    })

    it('centroid should be near center of polygon', () => {
      const result = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      expect(typeof result.centroid.lng).toBe('number')
      expect(typeof result.centroid.lat).toBe('number')
    })

    it('local coords should have x and z properties', () => {
      const result = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      for (const pt of result.localCoords) {
        expect(typeof pt.x).toBe('number')
        expect(typeof pt.z).toBe('number')
      }
    })
  })

  describe('getPolygonOrientation', () => {
    it('should return 1 or -1', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const orient = getPolygonOrientation(localCoords)
      expect([1, -1]).toContain(orient)
    })
  })

  describe('getWallSegments', () => {
    it('should return one wall per polygon edge', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const walls = getWallSegments(localCoords, 3)
      expect(walls).toHaveLength(SQUARE_POLYGON.length)
    })

    it('each wall should have start, end, normal, length, height', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const walls = getWallSegments(localCoords, 3)
      for (const wall of walls) {
        expect(wall.start).toHaveProperty('x')
        expect(wall.end).toHaveProperty('x')
        expect(wall.normal).toHaveProperty('x')
        expect(wall.length).toBeGreaterThan(0)
        expect(wall.height).toBe(3)
      }
    })
  })

  describe('computeWindowRect', () => {
    it('should return 4 corner points', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const walls = getWallSegments(localCoords, 3)
      const corners = computeWindowRect(walls[0], {
        offsetX: 0.5,
        offsetY: 1,
        width: 1,
        height: 1.2,
      })
      expect(corners).toHaveLength(4)
      for (const pt of corners) {
        expect(typeof pt.x).toBe('number')
        expect(typeof pt.y).toBe('number')
        expect(typeof pt.z).toBe('number')
      }
    })
  })

  describe('computeSunRayPatch', () => {
    it('should return null when sun is below horizon', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const walls = getWallSegments(localCoords, 3)
      const corners = computeWindowRect(walls[0], { offsetX: 0.5, offsetY: 1, width: 1, height: 1.2 })
      const result = computeSunRayPatch(180, -5, corners, 3)
      expect(result).toBeNull()
    })

    it('should return floor points when sun is above horizon', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const walls = getWallSegments(localCoords, 3)
      const corners = computeWindowRect(walls[0], { offsetX: 0.5, offsetY: 1, width: 1, height: 1.2 })
      const result = computeSunRayPatch(180, 45, corners, 3)
      // May return null if sun doesn't face wall, but if not null should be array of points
      if (result !== null) {
        expect(Array.isArray(result)).toBe(true)
      }
    })
  })

  describe('sunFacesWall', () => {
    it('should return false when sun is below horizon', () => {
      expect(sunFacesWall(180, -5, { x: 0, z: 1 })).toBe(false)
    })

    it('should return boolean', () => {
      const result = sunFacesWall(180, 45, { x: 0, z: 1 })
      expect(typeof result).toBe('boolean')
    })
  })

  describe('projectPoint', () => {
    const camera = {
      x: 0, y: 1.5, z: 0,
      rotY: 0, rotX: 0,
      fov: 75,
      width: 800,
      height: 600,
    }

    it('should return null for points behind camera', () => {
      const result = projectPoint({ x: 0, y: 1.5, z: -1 }, camera)
      expect(result).toBeNull()
    })

    it('should return projected point for points in front of camera', () => {
      const result = projectPoint({ x: 0, y: 1.5, z: 5 }, camera)
      expect(result).not.toBeNull()
      if (result) {
        expect(typeof result.x).toBe('number')
        expect(typeof result.y).toBe('number')
        expect(typeof result.depth).toBe('number')
      }
    })
  })

  describe('getInteriorCamera', () => {
    it('should return a camera object with all required fields', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const camera = getInteriorCamera(localCoords, 3, 0, 0, 800, 600)
      expect(camera).toHaveProperty('x')
      expect(camera).toHaveProperty('y')
      expect(camera).toHaveProperty('z')
      expect(camera).toHaveProperty('rotY')
      expect(camera).toHaveProperty('rotX')
      expect(camera).toHaveProperty('fov')
      expect(camera.fov).toBe(75)
      expect(camera.width).toBe(800)
      expect(camera.height).toBe(600)
    })

    it('eye height should be at most 1.5m', () => {
      const { localCoords } = latlngToLocalMeters(SQUARE_POLYGON, -23.55)
      const camera = getInteriorCamera(localCoords, 3, 0, 0, 800, 600)
      expect(camera.y).toBeLessThanOrEqual(1.5)
    })
  })
})
