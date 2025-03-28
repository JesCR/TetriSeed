// Tetromino shapes represented with $ symbol
export const TETROMINOS = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0]
    ],
    color: '80, 227, 230', // Cyan
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0]
    ],
    color: '36, 95, 223', // Blue
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L']
    ],
    color: '223, 173, 36', // Orange
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O']
    ],
    color: '223, 217, 36', // Yellow
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0]
    ],
    color: '48, 211, 56', // Green
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0]
    ],
    color: '132, 61, 198', // Purple
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0]
    ],
    color: '227, 78, 78', // Red
  },
  '$': { shape: [[0]], color: '80, 227, 230' }, // Fallback for direct $ symbol
};

// Game stage dimensions
export const STAGE_WIDTH = 12;
export const STAGE_HEIGHT = 20;

// Create the initial game stage
export const createStage = () => 
  Array.from(Array(STAGE_HEIGHT), () => 
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

// Random tetromino generator
export const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

// Check collision
export const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
  for (let y = 0; y < player.tetromino.length; y += 1) {
    for (let x = 0; x < player.tetromino[y].length; x += 1) {
      // 1. Check that we're on an actual tetromino cell
      if (player.tetromino[y][x] !== 0) {
        if (
          // 2. Check if our move is inside the game area height (y)
          !stage[y + player.pos.y + moveY] ||
          // 3. Check if our move is inside the game area width (x)
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. Check if the cell we're moving to isn't set to clear
          stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
        ) {
          return true;
        }
      }
    }
  }
  return false;
};

// Random debt repayment messages
export const DEBT_MESSAGES = [
  "Debt repayed!",
  "Enjoy SuperCollateral",
  "Proof of repayment checked!",
  "LFG SuperSeed!",
  "Clear your Debt"
];

// Get random message
export const getRandomMessage = () => {
  return DEBT_MESSAGES[Math.floor(Math.random() * DEBT_MESSAGES.length)];
}; 