import type { TFunction } from 'i18next'

export interface CardData {
  id: string
  type: string
  tags: string[]
  title?: string
  description?: string
  accent?: string
  link?: string
}

export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

export interface GridLayouts {
  lg: GridItem[]
  md: GridItem[]
  sm: GridItem[]
  [key: string]: GridItem[]
}

export interface CategoryFilter {
  key: FilterKey
  label: string
}

export const FILTER_KEYS = ['all', 'about', 'projects', 'media', 'config'] as const
export type FilterKey = (typeof FILTER_KEYS)[number]

export function getCategoryFilters(t: TFunction): CategoryFilter[] {
  return [
    { key: 'all', label: t('nav.filters.all') },
    { key: 'about', label: t('nav.filters.about') },
    { key: 'projects', label: t('nav.filters.projects') },
    { key: 'media', label: t('nav.filters.media') },
    { key: 'config', label: t('nav.filters.config') },
  ]
}

export function getCardsData(t: TFunction): CardData[] {
  return [
    {
      id: 'bio',
      type: 'bio',
      tags: ['about'],
    },
    {
      id: 'map',
      type: 'map',
      tags: ['about'],
    },
    {
      id: 'linkedin',
      type: 'linkedin',
      tags: ['about'],
    },
    {
      id: 'music',
      type: 'music',
      tags: ['media'],
    },
    {
      id: 'ev-stats',
      type: 'project',
      title: t('cards.ev_title'),
      description: t('cards.ev_description'),
      accent: 'green',
      link: '/ev-stats',
      tags: ['projects'],
    },
    {
      id: 'amortizacao',
      type: 'project',
      title: t('cards.amortizacao_title'),
      description: t('cards.amortizacao_description'),
      accent: 'blue',
      link: '/amortizacao',
      tags: ['projects'],
    },
    {
      id: 'sun-map',
      type: 'project',
      title: t('cards.sun_map_title'),
      description: t('cards.sun_map_description'),
      accent: 'orange',
      link: '/sun-map',
      tags: ['projects'],
    },
    {
      id: 'social',
      type: 'social',
      tags: ['about'],
    },
    {
      id: 'theme',
      type: 'theme',
      tags: ['config'],
    },
    {
      id: 'language',
      type: 'language',
      tags: ['config'],
    },
  ]
}

export const GRID_LAYOUTS: GridLayouts = {
  lg: [
    { i: 'bio', x: 0, y: 0, w: 5, h: 2 },
    { i: 'map', x: 5, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 9, y: 0, w: 3, h: 1 },
    { i: 'music', x: 9, y: 1, w: 3, h: 1 },
    { i: 'ev-stats', x: 0, y: 2, w: 4, h: 2 },
    { i: 'amortizacao', x: 4, y: 2, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 4, w: 8, h: 3 },
    { i: 'social', x: 8, y: 2, w: 4, h: 1 },
    { i: 'theme', x: 8, y: 4, w: 1, h: 1 },
    { i: 'language', x: 9, y: 4, w: 3, h: 1 },
  ],
  md: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 4, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 2, w: 2, h: 1 },
    { i: 'music', x: 2, y: 2, w: 4, h: 1 },
    { i: 'ev-stats', x: 0, y: 3, w: 4, h: 2 },
    { i: 'amortizacao', x: 4, y: 3, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 5, w: 8, h: 3 },
    { i: 'social', x: 0, y: 8, w: 4, h: 1 },
    { i: 'theme', x: 4, y: 8, w: 1, h: 1 },
    { i: 'language', x: 5, y: 8, w: 3, h: 1 },
  ],
  sm: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 0, y: 2, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 4, w: 2, h: 1 },
    { i: 'music', x: 2, y: 4, w: 2, h: 1 },
    { i: 'ev-stats', x: 0, y: 5, w: 4, h: 2 },
    { i: 'amortizacao', x: 0, y: 7, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 9, w: 4, h: 3 },
    { i: 'social', x: 0, y: 12, w: 4, h: 1 },
    { i: 'theme', x: 0, y: 13, w: 1, h: 1 },
    { i: 'language', x: 1, y: 13, w: 3, h: 1 },
  ],
}
