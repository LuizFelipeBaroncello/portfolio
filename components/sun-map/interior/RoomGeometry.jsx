import { useMemo } from 'react'
import * as THREE from 'three'

function createFloorShape(localCoords) {
  const shape = new THREE.Shape()
  shape.moveTo(localCoords[0].x, localCoords[0].z)
  for (let i = 1; i < localCoords.length; i++) {
    shape.lineTo(localCoords[i].x, localCoords[i].z)
  }
  shape.closePath()
  return shape
}

function Floor({ localCoords }) {
  const geometry = useMemo(() => {
    const shape = createFloorShape(localCoords)
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [localCoords])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial color="#d4d0c8" />
    </mesh>
  )
}

function Ceiling({ localCoords, buildingHeight }) {
  const geometry = useMemo(() => {
    const shape = createFloorShape(localCoords)
    const geo = new THREE.ShapeGeometry(shape)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [localCoords])

  return (
    <mesh geometry={geometry} position={[0, buildingHeight, 0]}>
      <meshLambertMaterial color="#e8e6e0" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  )
}

function WallMesh({ wall, buildingHeight, windowConfigs, cameraAngle }) {
  const { geometry, windowHoles } = useMemo(() => {
    const dx = wall.end.x - wall.start.x
    const dz = wall.end.z - wall.start.z
    const wallLen = wall.length

    // Wall shape in 2D (along-wall-axis x height)
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(wallLen, 0)
    shape.lineTo(wallLen, buildingHeight)
    shape.lineTo(0, buildingHeight)
    shape.closePath()

    // Cut window holes
    const wallWindows = windowConfigs.filter((wc) => wc.wallIndex === wall.wallIndex)
    const holes = []
    for (const wc of wallWindows) {
      const centerAlong = wc.offsetX * wallLen
      const halfW = wc.width / 2
      const hole = new THREE.Path()
      hole.moveTo(centerAlong - halfW, wc.offsetY)
      hole.lineTo(centerAlong + halfW, wc.offsetY)
      hole.lineTo(centerAlong + halfW, wc.offsetY + wc.height)
      hole.lineTo(centerAlong - halfW, wc.offsetY + wc.height)
      hole.closePath()
      shape.holes.push(hole)
      holes.push(wc)
    }

    const geo = new THREE.ShapeGeometry(shape)
    return { geometry: geo, windowHoles: holes }
  }, [wall, buildingHeight, windowConfigs])

  // Compute wall transform: position + rotation to place it in 3D
  const { position, rotationY } = useMemo(() => {
    const angle = Math.atan2(
      wall.end.z - wall.start.z,
      wall.end.x - wall.start.x
    )
    return {
      position: [wall.start.x, 0, wall.start.z],
      rotationY: -angle,
    }
  }, [wall])

  // Cutaway: make wall transparent if it faces the camera
  const opacity = useMemo(() => {
    const camDirX = Math.sin(cameraAngle)
    const camDirZ = Math.cos(cameraAngle)
    const dot = wall.normal.x * camDirX + wall.normal.z * camDirZ
    return dot > 0.1 ? 0.08 : 0.85
  }, [wall.normal, cameraAngle])

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geometry}>
        <meshLambertMaterial
          color="#c8c4b8"
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          depthWrite={opacity > 0.5}
        />
      </mesh>
      {/* Wall edge lines */}
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#a0a0a0" transparent opacity={opacity * 0.6} />
      </lineSegments>
    </group>
  )
}

export default function RoomGeometry({ localCoords, walls, windowConfigs, buildingHeight, cameraAngle }) {
  return (
    <group>
      <Floor localCoords={localCoords} />
      <Ceiling localCoords={localCoords} buildingHeight={buildingHeight} />
      {walls.map((wall) => (
        <WallMesh
          key={wall.wallIndex}
          wall={wall}
          buildingHeight={buildingHeight}
          windowConfigs={windowConfigs}
          cameraAngle={cameraAngle}
        />
      ))}
    </group>
  )
}
