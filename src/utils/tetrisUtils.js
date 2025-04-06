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

// Collision detection function with enhanced checking for top rows
export const checkCollision = (player, stage, { x: moveX, y: moveY }) => {
  // Enhanced validation to make sure all inputs are valid
  if (!player || !player.tetromino || !Array.isArray(player.tetromino) || 
      !player.pos || typeof player.pos.x !== 'number' || typeof player.pos.y !== 'number' ||
      !stage || !Array.isArray(stage)) {
    console.error('Invalid inputs to checkCollision:', { player, stage, moveX, moveY });
    return true; // Assume collision if invalid input to prevent issues
  }
  
  // ALWAYS PRIORITIZE COLLISION DETECTION
  // Check for any direct collisions regardless of position
  let hasCollision = false;
  
  // First check: direct collision detection for ALL pieces
  for (let y = 0; y < player.tetromino.length; y++) {
    for (let x = 0; x < player.tetromino[y].length; x++) {
      // Only check cells that are part of the tetromino (non-zero)
      if (player.tetromino[y][x] !== 0) {
        const targetY = y + player.pos.y + moveY;
        const targetX = x + player.pos.x + moveX;
        
        // Check if we're moving out of bounds
        if (targetY < 0 || targetY >= stage.length || 
            targetX < 0 || targetX >= stage[0].length) {
          return true; // Out of bounds collision
        }
        
        // Check if target cell is already occupied by a merged piece
        if (stage[targetY] && 
            stage[targetY][targetX] && 
            stage[targetY][targetX][1] === 'merged') {
          console.log(`COLLISION FOUND at [${targetX},${targetY}]`);
          return true; // Collision detected
        }
      }
    }
  }
  
  // No collision detected
  return false;
};

// Random debt repayment messages
export const DEBT_MESSAGES = [
  "SuperCollateral!",
  "Proof of Repayment!",
  "LFG SuperSeed!",
  "Clear your debt!",
  "Debt repaid!",
  "Debt cleared!",
  "Debt paid off!",
  "Debt settled!",
  "Debt paid in full!",
  "No debt!",
  "Debt paid!"
];

// Get random message
export const getRandomMessage = () => {
  return DEBT_MESSAGES[Math.floor(Math.random() * DEBT_MESSAGES.length)];
}; 