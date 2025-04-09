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
  // Add state to track which rows are being cleared
  const [clearingRows, setClearingRows] = useState([]);

  useEffect(() => {
    setRowsCleared(0);

    const sweepRows = newStage => {
      // Count the number of full rows
      let rowsCount = 0;
      let fullRows = [];
      
      // First identify which rows are full
      newStage.forEach((row, idx) => {
        // If we don't find a 0 it means that the row is full and should be cleared
        if (row.findIndex(cell => cell[0] === 0) === -1) {
          fullRows.push(idx);
          rowsCount += 1;
        }
      });
      
      // Only process if we actually have rows to clear
      if (rowsCount > 0) {
        // Mark cells in full rows as 'clearing' for animation
        const stageWithClearingRows = newStage.map((row, rowIdx) => {
          if (fullRows.includes(rowIdx)) {
            // Mark this row's cells for animation
            // Use special 'tetris-clearing' class for 4 lines cleared
            const animationClass = rowsCount === 4 ? 'tetris-clearing' : 'clearing';
            return row.map(cell => [cell[0], animationClass]);
          }
          return [...row];
        });
        
        // Update the clearingRows state to trigger animations
        setClearingRows(fullRows);
        
        // Update the stage with clearing animation
        setStage(stageWithClearingRows);
        
        // For Tetris (4 lines), show a special full-screen effect
        if (rowsCount === 4) {
          // Create a div for the tetris flash effect
          const tetrisEffect = document.createElement('div');
          tetrisEffect.className = 'super-tetris-effect';
          
          // Add it to the stage container
          const stageContainer = document.querySelector('.stage-container');
          if (stageContainer) {
            stageContainer.appendChild(tetrisEffect);
            
            // Remove it after animation completes
            setTimeout(() => {
              if (tetrisEffect.parentNode) {
                tetrisEffect.parentNode.removeChild(tetrisEffect);
              }
            }, 800); // Match the animation duration
          }
        }
        
        // Set a timeout to actually clear the rows after the animation plays
        setTimeout(() => {
          // Update the rowsCleared state for score calculation
          setRowsCleared(rowsCount);
          
          // Show debt message in the middle of the screen when rows are cleared
          setMessage(getRandomMessage());
          setShowMessage(true);
          
          // Reset clearing rows state
          setClearingRows([]);
          
          // Now actually remove the rows and add new ones at the top
          const sweptRows = newStage.reduce((ack, row, idx) => {
            if (fullRows.includes(idx)) {
              // Skip this row (it will be removed)
              return ack;
            }
            ack.push(row);
            return ack;
          }, []);
          
          // Add blank rows at the top
          for (let i = 0; i < rowsCount; i++) {
            sweptRows.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          }
          
          // Update stage with the swept rows
          setStage(sweptRows);
          
          // Hide the message after 1.5 seconds
          setTimeout(() => {
            setShowMessage(false);
          }, 1500);
        }, rowsCount === 4 ? 600 : 400); // Longer delay for Tetris to match the enhanced animation
        
        // Return the current stage with clearing animation
        return newStage;
      }
      
      // No rows to clear, return the stage as is
      return newStage;
    };

    const updateStage = prevStage => {
      // First flush the stage
      const newStage = prevStage.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );

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
        return sweepRows(newStage);
      }
      
      return newStage;
    };

    // Only update the stage if we don't have clearing rows
    if (clearingRows.length === 0) {
      setStage(prev => updateStage(prev));
    }
  }, [
    player,
    resetPlayer,
    clearingRows.length
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

  return [stage, setStage, rowsCleared, message, showMessage, interestMessage, showInterestMessage, showInterestRateMessage, clearingRows];
}; 