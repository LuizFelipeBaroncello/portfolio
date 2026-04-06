import { useMemo } from 'react'
import * as THREE from 'three'
import { computeWindowRect, computeSunRayPatches, sunFacesWall } from '../../../lib/sun-ray-utils'

function PatchMesh({ patch, sunAltitude }) {
  const geometry = useMemo(() => {
    const pts = patch.points
    if (pts.length < 3) return null

    if (patch.surface === 'floor') {
      // Floor patch: use XZ plane
      const shape = new THREE.Shape()
      shape.moveTo(pts[0].x, -pts[0].z)
      for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i].x, -pts[i].z)
      }
      shape.closePath()
      const geo = new THREE.ShapeGeometry(shape)
      geo.rotateX(-Math.PI / 2)
      return geo
    }

    // Wall patch: arbitrary 3D polygon
    const geo = new THREE.BufferGeometry()
    if (pts.length === 3) {
      const verts = new Float32Array([
        pts[0].x, pts[0].y, pts[0].z,
        pts[1].x, pts[1].y, pts[1].z,
        pts[2].x, pts[2].y, pts[2].z,
      ])
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    } else {
      // Quad -> two triangles
      const verts = new Float32Array([
        pts[0].x, pts[0].y, pts[0].z,
        pts[1].x, pts[1].y, pts[1].z,
        pts[2].x, pts[2].y, pts[2].z,
        pts[0].x, pts[0].y, pts[0].z,
        pts[2].x, pts[2].y, pts[2].z,
        pts[3].x, pts[3].y, pts[3].z,
      ])
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    }
    geo.computeVertexNormals()
    return geo
  }, [patch])

  if (!geometry) return null

  const opacity = Math.min(0.5, (sunAltitude / 90) * 0.6 + 0.1)
  const yOffset = patch.surface === 'floor' ? 0.01 : 0

  return (
    <mesh geometry={geometry} position={[0, yOffset, 0]}>
      <meshBasicMaterial
        color="#fbbf3c"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function SunPatches({ walls, windowConfigs, sunPos, buildingHeight }) {
  const patches = useMemo(() => {
    if (sunPos.altitude <= 0) return []

    const allPatches = []
    for (const wall of walls) {
      if (!sunFacesWall(sunPos.azimuth, sunPos.altitude, wall.normal)) continue
      const wallWindows = windowConfigs.filter((wc) => wc.wallIndex === wall.wallIndex)
      for (const wc of wallWindows) {
        const rect = computeWindowRect(wall, wc)
        const p = computeSunRayPatches(sunPos.azimuth, sunPos.altitude, rect, buildingHeight, walls)
        allPatches.push(...p)
      }
    }
    return allPatches
  }, [walls, windowConfigs, sunPos, buildingHeight])

  return (
    <group>
      {patches.map((patch, i) => (
        <PatchMesh key={i} patch={patch} sunAltitude={sunPos.altitude} />
      ))}
    </group>
  )
}
