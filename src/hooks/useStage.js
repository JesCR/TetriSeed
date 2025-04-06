import { useState, useEffect } from 'react';
import { createStage, STAGE_WIDTH, getRandomMessage } from '../utils/tetrisUtils';

export const useStage = (player, resetPlayer) => {
  const [stage, setStage] = useState(createStage());
  const [rowsCleared, setRowsCleared] = useState(0);
  
  // Message state
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [interestMessage, setInterestMessage] = useState('');
  const [showInterestMessage, setShowInterestMessage] = useState(false);

  useEffect(() => {
    setRowsCleared(0);

    const sweepRows = newStage => {
      // Count the number of full rows
      let rowsCount = 0;
      
      const sweptRows = newStage.reduce((ack, row) => {
        // If we don't find a 0 it means that the row is full and should be cleared
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          rowsCount += 1;
          
          // Add blank row at the top
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, []);
      
      // Only show message and update rowsCleared if we actually cleared rows
      if (rowsCount > 0) {
        // Update the rowsCleared state once with the total count
        setRowsCleared(rowsCount);
        
        // Show debt message in the middle of the screen when rows are cleared
        // Use a random message from DEBT_MESSAGES
        setMessage(getRandomMessage());
        setShowMessage(true);
        
        // Hide the message after 1.5 seconds
        setTimeout(() => {
          setShowMessage(false);
        }, 1500);
      }
      
      return sweptRows;
    };

    const updateStage = prevStage => {
      // First flush the stage
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );

      // CRITICAL FIX: Check for overlapping pieces before drawing
      // This prevents the game from continuing with overlapped pieces
      let hasOverlap = false;
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const newY = y + player.pos.y;
            const newX = x + player.pos.x;
            
            // Only check if within stage bounds
            if (
              newY >= 0 && 
              newY < newStage.length && 
              newX >= 0 && 
              newX < newStage[0].length
            ) {
              // Check if this position already has a merged piece
              if (newStage[newY][newX][1] === 'merged') {
                console.error(`CRITICAL OVERLAP: Found overlap at [${newX},${newY}]`);
                hasOverlap = true;
              }
            }
          }
        });
      });
      
      // If overlap is detected, trigger a custom event to end the game
      if (hasOverlap) {
        console.error('CRITICAL ERROR: Pieces overlapped, triggering game over');
        // Use setTimeout with an arrow function to ensure this runs after the current render cycle
        setTimeout(() => {
          try {
            const gameOverEvent = new CustomEvent('tetris_game_over_overlap');
            document.dispatchEvent(gameOverEvent);
            console.log('Game over event dispatched due to overlap');
          } catch (error) {
            console.error('Error dispatching game over event:', error);
          }
        }, 0);
      }

      // Then draw the tetromino
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            // Add boundary checking to prevent index out of bounds errors
            const newY = y + player.pos.y;
            const newX = x + player.pos.x;
            
            // Only draw if within stage bounds
            if (
              newY >= 0 && 
              newY < newStage.length && 
              newX >= 0 && 
              newX < newStage[0].length
            ) {
              newStage[newY][newX] = [
                value,
                `${player.collided ? 'merged' : 'clear'}`,
              ];
            }
          }
        });
      });
      
      // Then check if we got some score if collided
      if (player.collided) {
        resetPlayer();
        const sweepedStage = sweepRows(newStage);
        return sweepedStage;
      }
      
      return newStage;
    };

    setStage(prev => updateStage(prev));
  }, [
    player,
    resetPlayer,
  ]);

  // Function to trigger interest rate change message
  // This is now called externally when level increases
  const showInterestRateMessage = (level) => {
    // For level 1, show starting message, for other levels show increase message
    const message = level === 1 
      ? `STARTING INTEREST RATE: ${level * 5}%!` 
      : `INTEREST RATE INCREASED TO ${level * 5}%!`;
    
    console.log(`Setting interest message to: "${message}"`);
    setInterestMessage(message);
    setShowInterestMessage(true);
    console.log(`Interest message display enabled, visible: ${showInterestMessage}`);
    
    // Hide the message after 2.5 seconds (extended time for better visibility)
    setTimeout(() => {
      console.log('Hiding interest rate message');
      setShowInterestMessage(false);
    }, 2500);
  };

  return [stage, setStage, rowsCleared, message, showMessage, interestMessage, showInterestMessage, showInterestRateMessage];
}; 