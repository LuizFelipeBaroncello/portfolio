import { CATEGORY_FILTERS, CARDS_DATA, GRID_LAYOUTS } from '../../lib/cards-data'

describe('cards-data', () => {
  describe('CATEGORY_FILTERS', () => {
    it('should contain expected filters', () => {
      expect(CATEGORY_FILTERS).toEqual(['All', 'About', 'Projects', 'Media'])
    })

    it('should have All as first filter', () => {
      expect(CATEGORY_FILTERS[0]).toBe('All')
    })
  })

  describe('CARDS_DATA', () => {
    it('should have unique ids', () => {
      const ids = CARDS_DATA.map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('should contain bio card', () => {
      const bio = CARDS_DATA.find((c) => c.id === 'bio')
      expect(bio).toBeDefined()
      expect(bio?.type).toBe('bio')
    })

    it('should have project cards with title, description, accent and link', () => {
      const projects = CARDS_DATA.filter((c) => c.type === 'project')
      expect(projects.length).toBeGreaterThan(0)
      for (const p of projects) {
        expect(p.title).toBeTruthy()
        expect(p.description).toBeTruthy()
        expect(p.accent).toBeTruthy()
        expect(p.link).toBeTruthy()
      }
    })

    it('should have tags on every card', () => {
      for (const card of CARDS_DATA) {
        expect(Array.isArray(card.tags)).toBe(true)
        expect(card.tags.length).toBeGreaterThan(0)
      }
    })
  })

  describe('GRID_LAYOUTS', () => {
    it('should have lg, md and sm breakpoints', () => {
      expect(GRID_LAYOUTS).toHaveProperty('lg')
      expect(GRID_LAYOUTS).toHaveProperty('md')
      expect(GRID_LAYOUTS).toHaveProperty('sm')
    })

    it('should have same number of items across breakpoints', () => {
      const lgCount = GRID_LAYOUTS.lg.length
      const mdCount = GRID_LAYOUTS.md.length
      const smCount = GRID_LAYOUTS.sm.length
      expect(lgCount).toBe(mdCount)
      expect(mdCount).toBe(smCount)
    })

    it('should have valid grid items with i, x, y, w, h', () => {
      for (const item of GRID_LAYOUTS.lg) {
        expect(typeof item.i).toBe('string')
        expect(typeof item.x).toBe('number')
        expect(typeof item.y).toBe('number')
        expect(typeof item.w).toBe('number')
        expect(typeof item.h).toBe('number')
      }
    })

    it('should have grid item for every card', () => {
      const cardIds = CARDS_DATA.map((c) => c.id)
      const lgIds = GRID_LAYOUTS.lg.map((item) => item.i)
      for (const id of cardIds) {
        expect(lgIds).toContain(id)
      }
    })
  })
})
