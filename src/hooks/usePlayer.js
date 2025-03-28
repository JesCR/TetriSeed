import { useState, useCallback } from 'react';

import { TETROMINOS, randomTetromino, checkCollision } from '../utils/tetrisUtils';

export const usePlayer = () => {
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOS[0].shape,
    collided: false,
  });

  // Rotate the tetromino
  const rotate = (matrix, dir) => {
    // Make the rows become columns (transpose)
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map(col => col[index])
    );
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map(row => row.reverse());
    return rotatedTetro.reverse();
  };

  const playerRotate = (stage, dir) => {
    // Create a deep copy of the player to avoid direct state mutation
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    // Handle collision during rotation - ensure the piece doesn't go outside the play area
    const pos = clonedPlayer.pos.x;
    let offset = 1;
    
    // Keep trying offsets until we find a valid position
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      // Try moving right then left, with increasing distance
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      
      // If we've tried moving further than the piece width, reset rotation
      if (Math.abs(offset) > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir); // Rotate back
        clonedPlayer.pos.x = pos;
        return; // Failed to rotate
      }
    }

    // Apply the rotation
    setPlayer(clonedPlayer);
  };

  const updatePlayerPos = ({ x, y, collided }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { 
        x: prev.pos.x + x, 
        y: prev.pos.y + y 
      },
      collided,
    }));
  };

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: 5, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    });
  }, []);

  return [player, updatePlayerPos, resetPlayer, playerRotate];
}; 