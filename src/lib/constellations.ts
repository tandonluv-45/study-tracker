// Real constellation silhouettes (hand-placed to resemble the actual figures).
// Coordinate space is 0..300 x, 0..320 y. `stars` are checkpoint slots in order;
// `lines` connect star indices to draw the figure.
export interface Shape { stars: [number, number][]; lines: [number, number][] }

export const CONSTELLATIONS: Record<string, Shape> = {
  // Sep — the hunter: shoulders, head, belt, legs, sword
  Orion: {
    stars: [
      [100, 72], [190, 64], [146, 34], [124, 168], [150, 178],
      [176, 188], [200, 286], [116, 290], [150, 212], [154, 246],
    ],
    lines: [[0, 1], [2, 0], [2, 1], [0, 3], [1, 5], [3, 4], [4, 5], [3, 7], [5, 6], [4, 8], [8, 9]],
  },
  // Oct — the scorpion: claws, heart (Antares), curling tail
  Scorpius: {
    stars: [
      [150, 150], [120, 118], [104, 88], [126, 62], [92, 60],
      [164, 188], [154, 224], [128, 250], [156, 276],
    ],
    lines: [[4, 3], [3, 1], [2, 1], [1, 0], [0, 5], [5, 6], [6, 7], [7, 8]],
  },
  // Nov — the lion: the sickle (head) sweeping into the hindquarters
  Leo: {
    stars: [[104, 214], [96, 176], [106, 138], [128, 116], [152, 130], [206, 150], [244, 196]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 5], [5, 6], [0, 6]],
  },
  // Dec — the swan / Northern Cross
  Cygnus: {
    stars: [[150, 44], [150, 138], [88, 150], [212, 150], [150, 262], [150, 200]],
    lines: [[0, 1], [1, 5], [5, 4], [2, 1], [1, 3]],
  },
  // Jan — the twins: two stick figures, heads Castor & Pollux
  Gemini: {
    stars: [
      [110, 48], [182, 54], [120, 112], [176, 118], [110, 178],
      [170, 184], [98, 244], [160, 250], [144, 150],
    ],
    lines: [[0, 2], [1, 3], [2, 8], [3, 8], [2, 4], [3, 5], [4, 6], [5, 7]],
  },
  // Feb — the winged horse: the Great Square + Andromeda chain + legs
  Pegasus: {
    stars: [
      [104, 108], [204, 100], [210, 204], [110, 208], [244, 74],
      [276, 52], [72, 66], [58, 96], [150, 258],
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4], [4, 5], [0, 6], [6, 7], [3, 8]],
  },
};

// Fallback positions for checkpoints beyond a shape's star count.
export function overflowPoint(i: number): [number, number] {
  return [40 + ((i * 53) % 220), 40 + ((i * 97) % 240)];
}
