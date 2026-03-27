import { MutableRefObject } from 'react'
import { formatTimeFromMinutes } from '../../lib/sun-calc-utils'
import { formatDateISO, SPEEDS } from '../../lib/sun-map-config'

interface SunMapControlsProps {
  playMode: string
  setPlayMode: (mode: string) => void
  isPlaying: boolean
  setIsPlaying: (v: boolean) => void
  speed: number
  cycleSpeed: () => void
  skipNight: boolean
  setSkipNight: (fn: (v: boolean) => boolean) => void
  currentMinutes: number
  setCurrentMinutes: (v: number | ((prev: number) => number)) => void
  yearProgress: number
  setYearProgress: (v: number) => void
  yearProgressRef: MutableRefObject<number>
  selectedDate: Date
  setSelectedDate: (d: Date) => void
  startDate: Date
  setStartDate: (d: Date) => void
  endDate: Date
  setEndDate: (d: Date) => void
  currentPlayDate: Date
  setCurrentPlayDate: (d: Date) => void
  currentPlayDateRef: MutableRefObject<Date>
  fixedHour: number
  setFixedHour: (h: number) => void
  fixedMinute: number
  setFixedMinute: (m: number) => void
  effectiveDate: Date
  lat: number
  lng: number
  daylightLeft: number
  daylightWidth: number
  sliderPercent: number
  handleSearch: (e: React.FormEvent) => void
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSliderChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export default function SunMapControls({
  playMode,
  setPlayMode,
  isPlaying,
  setIsPlaying,
  speed,
  cycleSpeed,
  skipNight,
  setSkipNight,
  currentMinutes,
  setCurrentMinutes,
  yearProgress,
  setYearProgress,
  yearProgressRef,
  selectedDate,
  setSelectedDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  currentPlayDate,
  setCurrentPlayDate,
  currentPlayDateRef,
  fixedHour,
  setFixedHour,
  fixedMinute,
  setFixedMinute,
  effectiveDate,
  lat,
  lng,
  daylightLeft,
  daylightWidth,
  sliderPercent,
  handleSearch,
  handleDateChange,
  handleSliderChange,
  searchQuery,
  setSearchQuery,
}: SunMapControlsProps) {
  return (
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
                if (!isNaN(d.getTime())) {
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
                if (!isNaN(d.getTime())) setEndDate(d)
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
            const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
            const currentDay = Math.round((currentPlayDate.getTime() - startDate.getTime()) / 86400000) + 1
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
  )
}
