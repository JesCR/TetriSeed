import { useState, useEffect, useCallback, useRef } from 'react';
import Stage from './Stage';
import Display from './Display';
import StartButton from './StartButton';
import Leaderboard from './Leaderboard';
import Modal from './Modal';
import SuperSeedFacts from './SuperSeedFacts';

import { useStage } from '../hooks/useStage';
import { usePlayer } from '../hooks/usePlayer';
import { useGameStatus } from '../hooks/useGameStatus';
import { checkCollision, createStage } from '../utils/tetrisUtils';
import { getApiUrl } from '../utils/apiConfig';

import logoText from '../assets/images/logo_text.png';

const Tetris = () => {
  const [dropTime, setDropTime] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [showTop10Modal, setShowTop10Modal] = useState(false);
  // Add a ref to store the current drop time when pressing down
  const savedDropTimeRef = useRef(1000);

  // Initialize player and stage
  const [player, updatePlayerPos, resetPlayer, playerRotate] = usePlayer();
  const [stage, setStage, rowsCleared, message, showMessage, interestMessage, showInterestMessage, showInterestRateMessage] = useStage(player, resetPlayer);
  const [score, setScore, rows, setRows, level, setLevel] = useGameStatus(rowsCleared);

  const tetrisRef = useRef(null);

  // Add touch controls for mobile
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  
  // Submit score to the leaderboard
  const submitScore = async (score) => {
    // Only submit if player has a name and a positive score
    if (!playerName || score <= 0) {
      console.error('Invalid score submission attempt', { playerName, score });
      return;
    }
    
    console.log('Submitting score:', { playerName, score });
    
    try {
      const response = await fetch(getApiUrl('/api/leaderboard'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName.trim(),
          score: score
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to submit score:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log('Score submission response:', data);
      
      // If in top 5, show tweet modal
      if (data.isTop5) {
        setShowTop10Modal(true);
      }
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };
  
  // Move tetromino left and right
  const movePlayer = useCallback((dir) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  }, [player, stage, updatePlayerPos]);

  // Drop the tetromino by one row
  const drop = useCallback(() => {
    // Increase level when player has cleared 5 rows (changed from 10)
    if (rows > (level) * 5) {
      setLevel(prev => prev + 1);
      
      // Calculate new speed that keeps getting faster at each level
      // Use a progressive speed formula that ensures continued speed-up past level 4
      const newLevel = level + 1;
      const newDropTime = Math.max(1000 / (1 + (newLevel * 0.25)), 50); // Minimum 50ms to keep game playable
      setDropTime(newDropTime);
      savedDropTimeRef.current = newDropTime;
      
      // Show interest rate message on level up
      showInterestRateMessage(level + 1);
      
      console.log(`Level up to ${newLevel}, new speed: ${newDropTime}ms`);
    }

    // If interest message is shown, add a small speed increase (max 20%)
    if (showInterestMessage) {
      // Reduce speed by only 10-20% max instead of 50-60%
      const speedIncreaseFactor = 0.9 - (Math.random() * 0.1); // 10-20% speed reduction
      const newDropTime = savedDropTimeRef.current * speedIncreaseFactor;
      setDropTime(newDropTime);
      savedDropTimeRef.current = newDropTime;
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game over
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        
        // Post score to leaderboard
        if (playerName) {
          submitScore(score);
        }
      }
      // Mark the piece as collided so it can be merged into the stage
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  }, [
    player, 
    stage, 
    rows, 
    level, 
    playerName, 
    score, 
    updatePlayerPos, 
    setGameOver, 
    setDropTime, 
    setLevel,
    showInterestMessage,
    showInterestRateMessage
  ]);

  const dropPlayer = useCallback(() => {
    console.log('Drop player called, current dropTime:', dropTime);
    // Don't set dropTime to null for fast drop - this causes button to appear
    // Instead use a temporary fast drop without changing the dropTime state
    drop();
  }, [drop, dropTime]);
  
  // Now define handlers that use the above functions
  const handleTouchStart = useCallback((e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    if (!gameOver) {
      const swipeThreshold = 50;
      const diffX = touchEnd.x - touchStart.x;
      const diffY = touchEnd.y - touchStart.y;
      
      // Horizontal swipe
      if (Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
          movePlayer(1); // Right
        } else {
          movePlayer(-1); // Left
        }
      }
      
      // Vertical swipe down
      if (diffY > swipeThreshold) {
        dropPlayer();
      }
      
      // Tap or vertical swipe up
      if (Math.abs(diffX) < 20 && diffY < -swipeThreshold) {
        playerRotate(stage, 1);
      }
    }
    
    // Reset touch positions
    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  }, [gameOver, touchStart, touchEnd, movePlayer, dropPlayer, playerRotate, stage]);

  // Start the game
  const startGame = () => {
    // Reset everything
    setStage(createStage());
    const initialDropTime = 1000;
    setDropTime(initialDropTime);
    savedDropTimeRef.current = initialDropTime;
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(1);
    
    // Focus the tetris container for keyboard controls
    if (tetrisRef.current) {
      tetrisRef.current.focus();
    }
  };

  // Start timer
  const keyUp = useCallback(({ keyCode }) => {
    if (!gameOver) {
      // Always restore drop time when releasing down key, regardless of current state
      if (keyCode === 40 || keyCode === 83) { // Down arrow or S
        console.log('Key up - restoring drop speed to:', savedDropTimeRef.current);
        setDropTime(savedDropTimeRef.current);
      }
    }
  }, [gameOver, setDropTime]);

  // User controls
  const move = useCallback((event) => {
    const { keyCode } = event;
    
    if (!gameOver) {
      if (keyCode === 37 || keyCode === 65) { // Left arrow or A
        movePlayer(-1);
      } else if (keyCode === 39 || keyCode === 68) { // Right arrow or D
        movePlayer(1);
      } else if (keyCode === 40 || keyCode === 83) { // Down arrow or S
        // Store current drop time before setting to null for fast drop
        if (dropTime !== null) {
          savedDropTimeRef.current = dropTime;
        }
        setDropTime(null);
        drop();
      } else if (keyCode === 38 || keyCode === 87) { // Up arrow or W
        playerRotate(stage, 1);
      }
    }
  }, [gameOver, movePlayer, drop, playerRotate, stage, dropTime, setDropTime]);

  // Focus tetris area on mount and when modals are closed
  useEffect(() => {
    if (tetrisRef.current && !showNameModal && !showTop10Modal) {
      tetrisRef.current.focus();
    }
  }, [showNameModal, showTop10Modal]);

  // Interval for auto-dropping the tetromino
  useEffect(() => {
    console.log('Drop interval effect, dropTime:', dropTime);
    let interval = null;
    
    if (dropTime !== null && !gameOver) {
      interval = setInterval(() => {
        drop();
      }, dropTime);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dropTime, drop, gameOver]);

  // Handle name submission and focus
  const handleNameSubmit = (name) => {
    setPlayerName(name);
    setShowNameModal(false);
    setDropTime(null); // Ensure dropTime is null so the start button will show
    
    // Focus after modal is closed
    setTimeout(() => {
      if (tetrisRef.current) {
        tetrisRef.current.focus();
      }
    }, 100);
  };

  // Close top 10 modal and return to main screen
  const handleTop10Close = () => {
    setShowTop10Modal(false);
    setGameOver(true); // Keep game over state
    setDropTime(null); // Ensure button is visible
    
    // Focus after modal is closed
    setTimeout(() => {
      if (tetrisRef.current) {
        tetrisRef.current.focus();
      }
    }, 100);
  };

  return (
    <div 
      className="tetris-wrapper" 
      role="button" 
      tabIndex="0" 
      onKeyDown={move} 
      onKeyUp={keyUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={tetrisRef}
    >
      <Modal 
        isOpen={showNameModal} 
        type="nameInput" 
        onSubmit={handleNameSubmit} 
      />
      
      <Modal 
        isOpen={showTop10Modal && !showNameModal} 
        type="top10" 
        score={score} 
        onClose={handleTop10Close} 
      />
      
      <div className="tetris">
        <div className="game-header">
          <img src={logoText} alt="TetriSeed Logo" className="logo" />
          <h1>&nbsp;Clear your Debt!</h1>
        </div>
        
        <div className="game-content">
          <div className="game-area">
            <Stage 
              stage={stage} 
              message={message} 
              showMessage={showMessage} 
              interestMessage={interestMessage}
              showInterestMessage={showInterestMessage}
            />
            <div className="game-info">
              {gameOver ? (
                <div className="game-over-container">
                  <h2 className="liquidated">LIQUIDATED!</h2>
                  <p>Your final score: {score}</p>
                  <StartButton callback={startGame} />
                </div>
              ) : (
                <div>
                  <Display text={`Score: ${score}`} />
                  <Display text={`Rows Cleared: ${rows}`} />
                  <Display text={`Level: ${level}`} />
                  
                  {/* Only show start button at game initialization */}
                  {!dropTime && !gameOver && (
                    <div className="start-container">
                      <StartButton callback={startGame} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="sidebar">
            <Leaderboard />
            <div className="player-info">
              <p>Current Player: <span className="player-name">{playerName}</span></p>
            </div>
            <SuperSeedFacts />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris; 