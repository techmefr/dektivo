export const actionIconPaths = {
  move: 'M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3',
  rotateLeft: 'M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10',
  rotateRight: 'M20 4v6h-6M19.5 15a8 8 0 1 1-1.9-8.3L20 10',
  pass: 'M4 16c4-8 10-10 16-8M16 4l4 4-4 4',
  shoot: 'M3 12h13M12 7l5 5-5 5M20 4v16',
  close: 'M6 6l12 12M18 6L6 18',
  square: 'M5 5h14v14H5z',
  triangle: 'M12 4l9 16H3z',
  diamond: 'M12 3l9 9-9 9-9-9z',
  unknown: 'M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4M12 18h.01',
  remove: 'M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13',
  rotate: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  log: 'M5 6h14M5 12h14M5 18h9',
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  arrow: 'M4 12h14M13 6l6 6-6 6',
} as const

export type ActionIconName = keyof typeof actionIconPaths
