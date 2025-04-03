import { useState, useCallback } from 'react';

import { TETROMINOS, randomTetromino, checkCollision } from '../utils/tetrisUtils';

export const usePlayer = () => {
  // Add state for the next piece
  const [nextTetromino, setNextTetromino] = useState(randomTetromino());
  
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

    // Check if the rotated piece is out of bounds
    const isWithinBounds = (playerToCheck) => {
      const stageWidth = 12; // Standard Tetris width
      const stageHeight = 20; // Standard Tetris height
      
      // For each cell in the tetromino, check if it's in bounds
      for (let row = 0; row < playerToCheck.tetromino.length; row++) {
        for (let col = 0; col < playerToCheck.tetromino[row].length; col++) {
          if (playerToCheck.tetromino[row][col] !== 0) {
            // We found a filled cell, check its absolute position
            const absoluteX = playerToCheck.pos.x + col;
            const absoluteY = playerToCheck.pos.y + row;
            
            // Check bounds
            if (absoluteX < 0 || absoluteX >= stageWidth || absoluteY >= stageHeight) {
              return false; // Out of bounds
            }
          }
        }
      }
      
      return true; // All cells are in bounds
    };

    // Adjusted collision detection for rotation
    const pos = clonedPlayer.pos.x;
    let offset = 1;
    
    // First check if out of bounds after rotation
    if (!isWithinBounds(clonedPlayer)) {
      // Try to fit by adjusting x position
      let fitsWithinBounds = false;
      
      // Try small offsets first to ensure piece stays close to original position
      const maxOffset = clonedPlayer.tetromino[0].length;
      
      for (let testOffset = 0; testOffset <= maxOffset; testOffset++) {
        // Try right
        clonedPlayer.pos.x = pos + testOffset;
        if (isWithinBounds(clonedPlayer) && !checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
          fitsWithinBounds = true;
          break;
        }
        
        // Try left
        clonedPlayer.pos.x = pos - testOffset;
        if (isWithinBounds(clonedPlayer) && !checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
          fitsWithinBounds = true;
          break;
        }
      }
      
      // If can't fit within bounds, revert rotation
      if (!fitsWithinBounds) {
        clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, -dir); // Rotate back
        clonedPlayer.pos.x = pos;
        return; // Failed to rotate
      }
    } else {
      // Regular collision check with other pieces
      while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
        // Try moving right then left with increasing distance
        clonedPlayer.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        
        // If we've tried moving further than the piece width, reset rotation
        if (Math.abs(offset) > clonedPlayer.tetromino[0].length) {
          clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, -dir); // Rotate back
          clonedPlayer.pos.x = pos;
          return; // Failed to rotate
        }
      }
    }

    // Apply the rotation
    setPlayer(clonedPlayer);
  };

  const updatePlayerPos = ({ x, y, collided }) => {
    // Simple direct update, no checks
    setPlayer(prev => ({
      ...prev,
      pos: { 
        x: prev.pos.x + x, 
        y: prev.pos.y + y 
      },
      collided,
    }));
    return true;
  };

  const resetPlayer = useCallback(() => {
    // First game start (empty tetromino)
    if (player.tetromino === TETROMINOS[0].shape) {
      // Initialize both current and next tetromino
      const firstPiece = randomTetromino();
      const secondPiece = randomTetromino();
      
      setPlayer({
        pos: { x: 5, y: 0 },
        tetromino: firstPiece.shape,
        collided: false,
      });
      
      setNextTetromino(secondPiece);
    } else {
      // Normal flow - use the next piece that was shown in preview
      setPlayer({
        pos: { x: 5, y: 0 },
        tetromino: nextTetromino.shape,
        collided: false,
      });
      
      // Generate a new next tetromino
      setNextTetromino(randomTetromino());
    }
  }, [nextTetromino, player.tetromino]);

  return [player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino];
}; 