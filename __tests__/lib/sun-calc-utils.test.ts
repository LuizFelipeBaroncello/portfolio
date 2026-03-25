import {
  getSunPosition,
  getSunTimes,
  timeToMinutes,
  minutesToDate,
  formatTimeFromMinutes,
  formatTime,
  mapAltitudeToIntensity,
  mapAltitudeToColor,
  dayOfYearToDate,
} from '../../lib/sun-calc-utils'

const LAT = -23.55
const LNG = -46.63
const DATE = new Date('2024-06-21T12:00:00Z')

describe('sun-calc-utils', () => {
  describe('getSunPosition', () => {
    it('should return azimuth, altitude and raw', () => {
      const pos = getSunPosition(LAT, LNG, DATE)
      expect(typeof pos.azimuth).toBe('number')
      expect(typeof pos.altitude).toBe('number')
      expect(pos.raw).toBeDefined()
    })

    it('azimuth should be between 0 and 360', () => {
      const pos = getSunPosition(LAT, LNG, DATE)
      expect(pos.azimuth).toBeGreaterThanOrEqual(0)
      expect(pos.azimuth).toBeLessThanOrEqual(360)
    })
  })

  describe('getSunTimes', () => {
    it('should return sunrise and sunset', () => {
      const times = getSunTimes(LAT, LNG, DATE)
      expect(times.sunrise).toBeInstanceOf(Date)
      expect(times.sunset).toBeInstanceOf(Date)
    })

    it('sunrise should be before sunset', () => {
      const times = getSunTimes(LAT, LNG, DATE)
      expect(times.sunrise.getTime()).toBeLessThan(times.sunset.getTime())
    })
  })

  describe('timeToMinutes', () => {
    it('should convert midnight to 0', () => {
      const d = new Date(2024, 0, 1, 0, 0, 0)
      expect(timeToMinutes(d)).toBe(0)
    })

    it('should convert 1:30 to 90', () => {
      const d = new Date(2024, 0, 1, 1, 30, 0)
      expect(timeToMinutes(d)).toBe(90)
    })

    it('should convert 23:59 to 1439', () => {
      const d = new Date(2024, 0, 1, 23, 59, 0)
      expect(timeToMinutes(d)).toBe(1439)
    })
  })

  describe('minutesToDate', () => {
    it('should set hours and minutes from total minutes', () => {
      const base = new Date(2024, 5, 1)
      const result = minutesToDate(base, 90)
      expect(result.getHours()).toBe(1)
      expect(result.getMinutes()).toBe(30)
    })

    it('should not mutate the base date', () => {
      const base = new Date(2024, 5, 1, 10, 0)
      minutesToDate(base, 90)
      expect(base.getHours()).toBe(10)
    })
  })

  describe('formatTimeFromMinutes', () => {
    it('should format 0 as 00:00', () => {
      expect(formatTimeFromMinutes(0)).toBe('00:00')
    })

    it('should format 90 as 01:30', () => {
      expect(formatTimeFromMinutes(90)).toBe('01:30')
    })

    it('should format 1439 as 23:59', () => {
      expect(formatTimeFromMinutes(1439)).toBe('23:59')
    })
  })

  describe('formatTime', () => {
    it('should return a formatted time string', () => {
      const d = new Date(2024, 0, 1, 14, 35)
      const result = formatTime(d)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('mapAltitudeToIntensity', () => {
    it('should return low intensity below -6deg', () => {
      expect(mapAltitudeToIntensity(-10)).toBe(0.05)
    })

    it('should return medium intensity between -6 and 0', () => {
      expect(mapAltitudeToIntensity(-3)).toBe(0.15)
    })

    it('should return 0.3 between 0 and 10', () => {
      expect(mapAltitudeToIntensity(5)).toBe(0.3)
    })

    it('should return higher intensity above 10deg', () => {
      expect(mapAltitudeToIntensity(45)).toBeGreaterThan(0.3)
    })
  })

  describe('mapAltitudeToColor', () => {
    it('should return dark color below -6', () => {
      expect(mapAltitudeToColor(-10)).toBe('#0a0a2e')
    })

    it('should return orange near horizon', () => {
      expect(mapAltitudeToColor(3)).toBe('#ff6b35')
    })

    it('should return white at high altitude', () => {
      expect(mapAltitudeToColor(45)).toBe('#ffffff')
    })
  })

  describe('dayOfYearToDate', () => {
    it('should return Jan 1 for day 0', () => {
      const d = dayOfYearToDate(2024, 0)
      expect(d.getMonth()).toBe(0)
      expect(d.getDate()).toBe(1)
    })

    it('should return correct date for day 31', () => {
      const d = dayOfYearToDate(2024, 31)
      expect(d.getMonth()).toBe(1) // February
    })
  })
})
