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
    id: 'twitter',
    type: 'twitter',
    tags: ['about'],
  },
  {
    id: 'newsletter',
    type: 'newsletter',
    tags: ['media'],
  },
  {
    id: 'music',
    type: 'music',
    tags: ['media'],
  },
  {
    id: 'recroot',
    type: 'project',
    title: 'Recroot',
    description:
      'A modern recruitment platform built with React and Node.js, focusing on streamlined hiring workflows and candidate experience.',
    accent: 'blue',
    link: '#',
    tags: ['projects'],
  },
  {
    id: 'vouch',
    type: 'project',
    title: 'Vouch For',
    description:
      "Social proof platform that lets professionals vouch for each other's skills and work ethic.",
    accent: 'green',
    link: '#',
    tags: ['projects'],
  },
  {
    id: 'wrapso',
    type: 'project',
    title: 'Wrap.so',
    description:
      'Create beautiful screenshots and code snippets for social media sharing. Built with modern web technologies.',
    accent: 'purple',
    link: '#',
    tags: ['projects'],
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
    { i: 'twitter', x: 9, y: 0, w: 3, h: 1 },
    { i: 'newsletter', x: 9, y: 1, w: 3, h: 2 },
    { i: 'music', x: 0, y: 2, w: 3, h: 1 },
    { i: 'recroot', x: 3, y: 2, w: 6, h: 2 },
    { i: 'vouch', x: 0, y: 3, w: 3, h: 2 },
    { i: 'ev-stats', x: 9, y: 3, w: 3, h: 2 },
    { i: 'blog', x: 3, y: 5, w: 4, h: 2 },
    { i: 'wrapso', x: 7, y: 5, w: 5, h: 2 },
    { i: 'social', x: 0, y: 5, w: 3, h: 1 },
  ],
  md: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 4, y: 0, w: 4, h: 2 },
    { i: 'twitter', x: 0, y: 2, w: 4, h: 1 },
    { i: 'newsletter', x: 4, y: 2, w: 4, h: 2 },
    { i: 'music', x: 0, y: 3, w: 4, h: 2 },
    { i: 'recroot', x: 4, y: 4, w: 4, h: 2 },
    { i: 'vouch', x: 0, y: 5, w: 4, h: 2 },
    { i: 'wrapso', x: 4, y: 6, w: 4, h: 2 },
    { i: 'ev-stats', x: 0, y: 7, w: 4, h: 2 },
    { i: 'blog', x: 4, y: 7, w: 4, h: 2 },
    { i: 'social', x: 0, y: 9, w: 4, h: 1 },
  ],
  sm: [
    { i: 'bio', x: 0, y: 0, w: 4, h: 2 },
    { i: 'map', x: 0, y: 2, w: 4, h: 2 },
    { i: 'music', x: 0, y: 4, w: 4, h: 2 },
    { i: 'recroot', x: 0, y: 6, w: 4, h: 2 },
    { i: 'vouch', x: 0, y: 8, w: 4, h: 2 },
    { i: 'wrapso', x: 0, y: 10, w: 4, h: 2 },
    { i: 'ev-stats', x: 0, y: 12, w: 4, h: 2 },
    { i: 'blog', x: 0, y: 14, w: 4, h: 2 },
    { i: 'newsletter', x: 0, y: 16, w: 4, h: 2 },
    { i: 'twitter', x: 0, y: 18, w: 4, h: 1 },
    { i: 'social', x: 0, y: 19, w: 4, h: 1 },
  ],
}
