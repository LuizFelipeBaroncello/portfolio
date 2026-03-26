import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { formatTimeFromMinutes } from '../../lib/sun-calc-utils'
import {
  latlngToLocalMeters,
  getWallSegments,
  computeWindowRect,
  sunFacesWall,
} from '../../lib/sun-ray-utils'

const IsometricScene = dynamic(() => import('./interior/IsometricScene'), { ssr: false })

const DEFAULT_WINDOW = {
  offsetX: 0.5,
  offsetY: 1.0,
  width: 2.0,
  height: 1.5,
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
  const [selectedWallIndex, setSelectedWallIndex] = useState(null)
  const [windowConfigs, setWindowConfigs] = useState(() => building.windows || [])

  // Wall modifications: { [wallIndex]: { lengthDelta, offsetDelta } }
  const [wallMods, setWallMods] = useState({})

  // Convert building to local meters
  const { localCoords: baseLocalCoords, centroid } = latlngToLocalMeters(
    building.coordinates,
    building.coordinates[0][1]
  )

  // Apply wall modifications to get adjusted coordinates
  const localCoords = applyWallMods(baseLocalCoords, wallMods)
  const walls = getWallSegments(localCoords, building.height)

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

  const updateWallMod = useCallback((wallIndex, key, value) => {
    setWallMods((prev) => ({
      ...prev,
      [wallIndex]: { ...(prev[wallIndex] || { lengthDelta: 0, offsetDelta: 0 }), [key]: value },
    }))
  }, [])

  const handleSave = () => {
    // Convert modified local coords back to latlng and update building
    const newCoords = localMetersToLatlng(localCoords, centroid)
    onUpdateBuilding({ ...building, windows: windowConfigs, coordinates: newCoords })
  }

  const selectedWallWindows = windowConfigs
    .map((wc, i) => ({ ...wc, _idx: i }))
    .filter((wc) => wc.wallIndex === selectedWallIndex)

  const selectedMod = selectedWallIndex !== null
    ? wallMods[selectedWallIndex] || { lengthDelta: 0, offsetDelta: 0 }
    : null

  const sliderPercent = (currentMinutes / 1440) * 100

  return (
    <div className="sm-interior-modal">
      <div className="sm-interior-header">
        <span className="sm-interior-title">
          Interior &mdash; Edificio {buildingIndex + 1}
        </span>
        <div className="sm-interior-header-actions">
          <button className="sm-interior-save-btn" onClick={handleSave}>
            Salvar
          </button>
          <button className="sm-interior-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>

      <div className="sm-interior-body">
        <div className="sm-interior-canvas-wrap">
          <IsometricScene
            localCoords={localCoords}
            walls={walls}
            windowConfigs={windowConfigs}
            sunPos={sunPos}
            buildingHeight={building.height}
          />
          <div className="sm-interior-canvas-hint">
            Clique para girar 90&deg; &middot; Arraste para girar livre &middot; Scroll para zoom
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

          {selectedWallIndex !== null && (
            <div className="sm-interior-section">
              <h4 className="sm-interior-section-title">
                Ajustar &mdash; Parede {selectedWallIndex + 1}
              </h4>
              <div className="sm-interior-window-config">
                <div className="sm-interior-slider-row">
                  <label>Comprimento</label>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={selectedMod.lengthDelta}
                    onChange={(e) => updateWallMod(selectedWallIndex, 'lengthDelta', parseFloat(e.target.value))}
                  />
                  <span>{selectedMod.lengthDelta > 0 ? '+' : ''}{selectedMod.lengthDelta.toFixed(1)}m</span>
                </div>
                <div className="sm-interior-slider-row">
                  <label>Deslocar</label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={selectedMod.offsetDelta}
                    onChange={(e) => updateWallMod(selectedWallIndex, 'offsetDelta', parseFloat(e.target.value))}
                  />
                  <span>{selectedMod.offsetDelta > 0 ? '+' : ''}{selectedMod.offsetDelta.toFixed(1)}m</span>
                </div>
              </div>
            </div>
          )}

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

/**
 * Apply wall modifications (length and offset adjustments) to base coordinates.
 */
function applyWallMods(baseCoords, wallMods) {
  if (!wallMods || Object.keys(wallMods).length === 0) return baseCoords

  const coords = baseCoords.map((p) => ({ x: p.x, z: p.z }))
  const n = coords.length

  for (const [wallIndexStr, mod] of Object.entries(wallMods)) {
    const wi = parseInt(wallIndexStr)
    const i = wi
    const j = (wi + 1) % n

    const dx = coords[j].x - coords[i].x
    const dz = coords[j].z - coords[i].z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 0.001) continue

    const ux = dx / len
    const uz = dz / len

    // Length adjustment: extend/shrink symmetrically from center
    if (mod.lengthDelta) {
      const half = mod.lengthDelta / 2
      coords[i].x -= ux * half
      coords[i].z -= uz * half
      coords[j].x += ux * half
      coords[j].z += uz * half
    }

    // Offset adjustment: move wall along its normal
    if (mod.offsetDelta) {
      const nx = -uz
      const nz = ux
      coords[i].x += nx * mod.offsetDelta
      coords[i].z += nz * mod.offsetDelta
      coords[j].x += nx * mod.offsetDelta
      coords[j].z += nz * mod.offsetDelta
    }
  }

  return coords
}

/**
 * Convert local meter coordinates back to [lng, lat] arrays.
 */
function localMetersToLatlng(localCoords, centroid) {
  const DEG2RAD = Math.PI / 180
  const METERS_PER_DEG_LAT = 111320
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos(centroid.lat * DEG2RAD)

  return localCoords.map((p) => [
    centroid.lng + p.x / metersPerDegLng,
    centroid.lat + p.z / METERS_PER_DEG_LAT,
  ])
}
