export const CATEGORY_FILTERS = ['All', 'About', 'Projects', 'Media']

export const CARDS_DATA = [
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
    id: 'blog',
    type: 'blog',
    title: "How it started vs. how it's going",
    description:
      "A short personal history as it relates to design and development, and how I've found value in the cross-section between both disciplines.",
    accent: 'orange',
    date: 'May 5, 2021',
    tags: ['media'],
  },
  {
    id: 'social',
    type: 'social',
    tags: ['about'],
  },
]

export const GRID_LAYOUTS = {
  lg: [
    { i: 'bio', x: 0, y: 0, w: 5, h: 2 },
    { i: 'map', x: 5, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 9, y: 0, w: 3, h: 1 },
    { i: 'music', x: 0, y: 2, w: 3, h: 1 },
    { i: 'ev-stats', x: 3, y: 2, w: 6, h: 2 },
    { i: 'amortizacao', x: 9, y: 1, w: 3, h: 2 },
    { i: 'sun-map', x: 0, y: 4, w: 6, h: 2 },
    { i: 'blog', x: 6, y: 4, w: 4, h: 2 },
    { i: 'social', x: 10, y: 4, w: 2, h: 1 },
  ],
  md: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 4, y: 0, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 2, w: 2, h: 1 },
    { i: 'music', x: 2, y: 2, w: 4, h: 1 },
    { i: 'ev-stats', x: 0, y: 3, w: 4, h: 2 },
    { i: 'amortizacao', x: 4, y: 3, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 5, w: 4, h: 2 },
    { i: 'blog', x: 4, y: 5, w: 4, h: 2 },
    { i: 'social', x: 0, y: 7, w: 4, h: 1 },
  ],
  sm: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 0, y: 2, w: 4, h: 2 },
    { i: 'linkedin', x: 0, y: 4, w: 2, h: 1 },
    { i: 'music', x: 2, y: 4, w: 2, h: 1 },
    { i: 'ev-stats', x: 0, y: 5, w: 4, h: 2 },
    { i: 'amortizacao', x: 0, y: 7, w: 4, h: 2 },
    { i: 'sun-map', x: 0, y: 9, w: 4, h: 2 },
    { i: 'blog', x: 0, y: 11, w: 4, h: 2 },
    { i: 'social', x: 0, y: 13, w: 4, h: 1 },
  ],
}
