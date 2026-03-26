import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import RoomGeometry from './RoomGeometry'
import WindowMeshes from './WindowMeshes'
import SunPatches from './SunPatches'
import useIsometricControls from './useIsometricControls'

const ELEVATION_ANGLE = 30 * (Math.PI / 180) // 30 degrees from horizontal
const CAMERA_DISTANCE = 15

function CameraController({ angle, zoom, center }) {
  const { camera } = useThree()

  useFrame(() => {
    const cosElev = Math.cos(ELEVATION_ANGLE)
    const sinElev = Math.sin(ELEVATION_ANGLE)

    camera.position.set(
      center[0] + Math.sin(angle) * cosElev * CAMERA_DISTANCE,
      center[1] + sinElev * CAMERA_DISTANCE,
      center[2] + Math.cos(angle) * cosElev * CAMERA_DISTANCE
    )
    camera.lookAt(center[0], center[1], center[2])
    camera.zoom = zoom
    camera.updateProjectionMatrix()
  })

  return null
}

function SunLight({ sunPos, center }) {
  const lightRef = useRef()

  useEffect(() => {
    if (!lightRef.current || sunPos.altitude <= 0) return
    const azRad = sunPos.azimuth * (Math.PI / 180)
    const altRad = sunPos.altitude * (Math.PI / 180)
    lightRef.current.position.set(
      center[0] + Math.sin(azRad) * Math.cos(altRad) * 20,
      center[1] + Math.sin(altRad) * 20,
      center[2] + Math.cos(azRad) * Math.cos(altRad) * 20
    )
  }, [sunPos, center])

  if (sunPos.altitude <= 0) return null

  const intensity = Math.min(1.2, sunPos.altitude / 45)

  return (
    <directionalLight
      ref={lightRef}
      intensity={intensity}
      color="#fff5e0"
    />
  )
}

function Scene({ localCoords, walls, windowConfigs, sunPos, buildingHeight, cameraAngle, hideNearWalls }) {
  const center = useMemo(() => {
    let cx = 0, cz = 0
    for (const p of localCoords) {
      cx += p.x
      cz += p.z
    }
    cx /= localCoords.length
    cz /= localCoords.length
    return [cx, buildingHeight / 2, cz]
  }, [localCoords, buildingHeight])

  return (
    <>
      <ambientLight intensity={0.6} color="#ffffff" />
      <SunLight sunPos={sunPos} center={center} />

      <RoomGeometry
        localCoords={localCoords}
        walls={walls}
        windowConfigs={windowConfigs}
        buildingHeight={buildingHeight}
        cameraAngle={cameraAngle}
        hideNearWalls={hideNearWalls}
      />
      <WindowMeshes walls={walls} windowConfigs={windowConfigs} />
      <SunPatches
        walls={walls}
        windowConfigs={windowConfigs}
        sunPos={sunPos}
        buildingHeight={buildingHeight}
      />
    </>
  )
}

export default function IsometricScene({ localCoords, walls, windowConfigs, sunPos, buildingHeight, hideNearWalls }) {
  const controls = useIsometricControls(8)
  const containerRef = useRef(null)

  const center = useMemo(() => {
    let cx = 0, cz = 0
    for (const p of localCoords) {
      cx += p.x
      cz += p.z
    }
    cx /= localCoords.length
    cz /= localCoords.length
    return [cx, buildingHeight / 2, cz]
  }, [localCoords, buildingHeight])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', cursor: controls.isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={controls.handlePointerDown}
      onPointerMove={controls.handlePointerMove}
      onPointerUp={controls.handlePointerUp}
      onClick={controls.handleClick}
      onWheel={controls.handleWheel}
    >
      <Canvas
        orthographic
        camera={{
          zoom: 8,
          near: 0.1,
          far: 200,
          position: [10, 10, 10],
        }}
        style={{ background: '#f0f0f0' }}
        gl={{ antialias: true, alpha: false }}
      >
        <CameraController angle={controls.angle} zoom={controls.zoom} center={center} />
        <Scene
          localCoords={localCoords}
          walls={walls}
          windowConfigs={windowConfigs}
          sunPos={sunPos}
          buildingHeight={buildingHeight}
          cameraAngle={controls.angle}
          hideNearWalls={hideNearWalls}
        />
      </Canvas>
    </div>
  )
}
