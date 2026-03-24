import SunCalc from 'suncalc'

export function getSunPosition(lat, lng, date) {
  const pos = SunCalc.getPosition(date, lat, lng)
  return {
    azimuth: pos.azimuth * 180 / Math.PI + 180,
    altitude: pos.altitude * 180 / Math.PI,
    raw: pos,
  }
}

export function getSunTimes(lat, lng, date) {
  return SunCalc.getTimes(date, lat, lng)
}

export function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function minutesToDate(baseDate, minutes) {
  const d = new Date(baseDate)
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

export function formatTimeFromMinutes(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTime(date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function mapAltitudeToIntensity(altitudeDeg) {
  if (altitudeDeg < -6) return 0.05
  if (altitudeDeg < 0) return 0.15
  if (altitudeDeg < 10) return 0.3
  return 0.3 + (altitudeDeg / 90) * 0.4
}

export function dayOfYearToDate(year, dayOfYear) {
  const d = new Date(year, 0, 1)
  d.setDate(d.getDate() + Math.floor(dayOfYear))
  return d
}

export function mapAltitudeToColor(altitudeDeg) {
  if (altitudeDeg < -6) return '#0a0a2e'
  if (altitudeDeg < 0) return '#1a1a3e'
  if (altitudeDeg < 5) return '#ff6b35'
  if (altitudeDeg < 15) return '#ffa500'
  return '#ffffff'
}
