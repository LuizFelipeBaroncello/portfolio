import { useMemo } from 'react'
import * as THREE from 'three'
import { computeWindowRect } from '../../../lib/sun-ray-utils'

function WindowPane({ wall, windowConfig }) {
  const { geometry, position, rotationY } = useMemo(() => {
    const rect = computeWindowRect(wall, windowConfig)
    // rect: [bottomLeft, bottomRight, topRight, topLeft] in 3D

    // Build geometry in wall-local space
    const geo = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      rect[0].x, rect[0].y, rect[0].z,
      rect[1].x, rect[1].y, rect[1].z,
      rect[2].x, rect[2].y, rect[2].z,
      rect[0].x, rect[0].y, rect[0].z,
      rect[2].x, rect[2].y, rect[2].z,
      rect[3].x, rect[3].y, rect[3].z,
    ])
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geo.computeVertexNormals()

    return { geometry: geo, position: [0, 0, 0], rotationY: 0 }
  }, [wall, windowConfig])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Glass pane */}
      <mesh geometry={geometry}>
        <meshLambertMaterial
          color="#87CEFA"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Frame outline */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#5a8aaa" transparent opacity={0.5} />
      </lineSegments>
    </group>
  )
}

export default function WindowMeshes({ walls, windowConfigs }) {
  return (
    <group>
      {windowConfigs.map((wc, i) => {
        const wall = walls.find((w) => w.wallIndex === wc.wallIndex)
        if (!wall) return null
        return <WindowPane key={i} wall={wall} windowConfig={wc} />
      })}
    </group>
  )
}
