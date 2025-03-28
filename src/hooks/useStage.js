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

      // Then draw the tetromino
      player.tetromino.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ];
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
    setInterestMessage(`INTEREST RATE INCREASED TO ${level * 5}%!`);
    setShowInterestMessage(true);
    
    // Hide the message after 2 seconds
    setTimeout(() => {
      setShowInterestMessage(false);
    }, 2000);
  };

  return [stage, setStage, rowsCleared, message, showMessage, interestMessage, showInterestMessage, showInterestRateMessage];
}; 