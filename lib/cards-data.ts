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

export const CATEGORY_FILTERS: string[] = ['All', 'About', 'Projects', 'Media']

export const CARDS_DATA: CardData[] = [
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
    title: 'EV Dashboard',
    description:
      'Rastreamento de custos e analise do carro eletrico com breakdown por categoria e tendencias.',
    accent: 'green',
    link: '/ev-stats',
    tags: ['projects'],
  },
  {
    id: 'amortizacao',
    type: 'project',
    title: 'Simulador Amortizacao',
    description:
      'Simulador de financiamentos com SAC/Price, planos de amortizacao extra, correcao monetaria e seguro.',
    accent: 'blue',
    link: '/amortizacao',
    tags: ['projects'],
  },
  {
    id: 'sun-map',
    type: 'project',
    title: 'Sun Position Map',
    description:
      'Mapa 3D interativo mostrando a posicao do sol, direcao da luz e sombras para qualquer local e horario.',
    accent: 'orange',
    link: '/sun-map',
    tags: ['projects'],
  },
  {
    id: 'social',
    type: 'social',
    tags: ['about'],
  },
]

export const GRID_LAYOUTS: GridLayouts = {
  lg: [
    { i: 'bio', x: 0, y: 0, w: 5, h: 2 },
    { i: 'map', x: 5, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 9, y: 0, w: 3, h: 1 },
    { i: 'music', x: 9, y: 1, w: 3, h: 1 },
    { i: 'ev-stats', x: 0, y: 2, w: 6, h: 2 },
    { i: 'amortizacao', x: 6, y: 2, w: 6, h: 2 },
    { i: 'sun-map', x: 0, y: 4, w: 6, h: 2 },
    { i: 'social', x: 6, y: 4, w: 2, h: 1 },
  ],
  md: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 4, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 2, w: 2, h: 1 },
    { i: 'music', x: 2, y: 2, w: 4, h: 1 },
    { i: 'ev-stats', x: 0, y: 3, w: 4, h: 2 },
    { i: 'amortizacao', x: 4, y: 3, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 5, w: 4, h: 2 },
    { i: 'social', x: 4, y: 5, w: 4, h: 1 },
  ],
  sm: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 0, y: 2, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 4, w: 2, h: 1 },
    { i: 'music', x: 2, y: 4, w: 2, h: 1 },
    { i: 'ev-stats', x: 0, y: 5, w: 4, h: 2 },
    { i: 'amortizacao', x: 0, y: 7, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 9, w: 4, h: 2 },
    { i: 'social', x: 0, y: 11, w: 4, h: 1 },
  ],
}
