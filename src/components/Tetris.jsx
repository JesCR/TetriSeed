import { useState, useEffect, useCallback, useRef } from 'react';
import Stage from './Stage';
import Display from './Display';
import StartButton from './StartButton';
import CompetitiveLeaderboard from './CompetitiveLeaderboard';
import CompetitiveMode from './CompetitiveMode';
import Modal from './Modal';
import SuperSeedFacts from './SuperSeedFacts';
import MobileControls from './MobileControls';
import MusicToggle from './MusicToggle';
import SeasonInfo from './SeasonInfo';

import { useStage } from '../hooks/useStage';
import { usePlayer } from '../hooks/usePlayer';
import { useGameStatus } from '../hooks/useGameStatus';
import { checkCollision, createStage } from '../utils/tetrisUtils';
import { getApiUrl } from '../utils/apiConfig';
import { initAudio, playBackgroundMusic, pauseBackgroundMusic } from '../utils/audioUtils';
import { mockPayCompetitiveFee } from '../utils/web3Utils';

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
  
  // Add a state to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  // Add competitive mode and wallet address
  const [isCompetitiveMode, setIsCompetitiveMode] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Extra state for showing the competitive rules modal
  const [showModal, setShowModal] = useState(false);
  
  // Add loading and error states for competitive mode payment
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize audio when component mounts
  useEffect(() => {
    // Initialize music
    initAudio();
    
    return () => {
      // Clean up by pausing music if component unmounts
      pauseBackgroundMusic();
    };
  }, []);

  // Submit score to the leaderboard
  const submitScore = async (score) => {
    // Only submit if player has a name and a positive score
    if (!playerName || score <= 0) {
      console.error('Invalid score submission attempt', { playerName, score });
      return;
    }
    
    console.log('Submitting score:', { playerName, score, isCompetitive: isCompetitiveMode });
    
    try {
      // Choose the API endpoint based on competitive mode
      const endpoint = isCompetitiveMode ? 
        getApiUrl('/api/competitive-score') : 
        getApiUrl('/api/leaderboard');
      
      const scoreData = {
        name: playerName.trim(),
        score: score
      };
      
      // Add wallet address for competitive mode
      if (isCompetitiveMode && walletAddress) {
        scoreData.address = walletAddress;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData),
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
      
      // Trigger a refresh of the competitive leaderboard data
      if (typeof window.refreshCompetitiveLeaderboard === 'function') {
        // Small delay to ensure the server has processed the new entry
        setTimeout(() => {
          window.refreshCompetitiveLeaderboard();
        }, 500);
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
      // Base speed is now 800ms instead of 1000ms, and speed increases faster
      const newLevel = level + 1;
      // Progressive speed formula with faster increments
      const newDropTime = Math.max(800 / (1 + (newLevel * 0.3)), 50); // Minimum 50ms to keep game playable
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

  // Handle start button click
  const handleStartButtonClick = () => {
    if (isCompetitiveMode) {
      // Show competitive rules modal
      setShowModal(true);
    } else {
      // Start the game directly
      startGame();
    }
  };

  // Start the game
  const startGame = () => {
    // Reset everything
    setStage(createStage());
    // Initial speed 20% faster than before (1000ms -> 800ms)
    const initialDropTime = 800;
    setDropTime(initialDropTime);
    savedDropTimeRef.current = initialDropTime;
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(1);
    
    // Start playing background music
    playBackgroundMusic();
    
    // Focus the tetris container for keyboard controls
    if (tetrisRef.current) {
      tetrisRef.current.focus();
    }
    
    // Scroll to the top of the page to show the game header
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
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
        // Don't set dropTime to null - this prevents "Ask for a loan" button from appearing
        // Just call drop to move the piece down faster
        if (dropTime !== null) {
          drop();
        }
      } else if (keyCode === 38 || keyCode === 87) { // Up arrow or W
        playerRotate(stage, 1);
      }
    }
  }, [gameOver, movePlayer, drop, playerRotate, stage, dropTime]);

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
    if (name) {
      // iOS detection
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        console.log('iOS device detected, using special scroll handling');
      }
      
      // Update state and force focus
      setPlayerName(name);
      setShowNameModal(false);
      setDropTime(null); // Ensure dropTime is null so the start button will show
      
      // Start playing background music after user interaction
      playBackgroundMusic();
      
      // Immediate force scroll using various methods
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // For iOS, use a special technique to handle keyboard dismissal
      if (isIOS) {
        // Temporarily fix the body position to prevent content jump
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = '0';
        
        setTimeout(() => {
          // Reset the body position and force scroll again
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          window.scrollTo(0, 0);
        }, 300);
      }
      
      // Multiple aggressive scroll attempts with increasing delays
      [50, 300, 500, 800, 1200, 1500].forEach(delay => {
        setTimeout(() => {
          window.scrollTo(0, 0);
          // Focus the tetris container
          if (tetrisRef.current) {
            tetrisRef.current.focus();
          }
        }, delay);
      });
    }
  };

  // Close top 10 modal and return to main screen
  const handleTop10Close = () => {
    setShowTop10Modal(false);
    setGameOver(true); // Keep game over state
    setDropTime(null); // Ensure button is visible
    
    // Focus and scroll after modal is closed
    setTimeout(() => {
      if (tetrisRef.current) {
        tetrisRef.current.focus();
      }
      // Scroll to the top of the page to show the game header
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Check if we're on a mobile device and handle resize events
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Check on mount
    checkMobile();
    
    // Handle resize, including when mobile keyboard appears/disappears
    const handleResize = () => {
      checkMobile();
      
      // If not in a modal, try to keep the view at the top of the page
      if (!showNameModal && !showTop10Modal) {
        // Wait a bit for the resize to complete
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'auto'
          });
        }, 50);
      }
    };
    
    // Check on resize
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [showNameModal, showTop10Modal]);

  // Handle mobile control button clicks
  const handleMobileControl = useCallback((direction) => {
    if (gameOver) return;
    
    console.log('Mobile control clicked:', direction);
    
    switch (direction) {
      case 'left':
        console.log('Moving piece left');
        movePlayer(-1);
        break;
      case 'right':
        console.log('Moving piece right');
        movePlayer(1);
        break;
      case 'down':
        console.log('Moving piece down');
        // We need to make sure the dropTime doesn't get set to null here
        // to prevent the "Ask for a loan" button from showing up
        if (dropTime !== null) {
          // Just speed up the drop without changing dropTime
          drop();
        }
        break;
      case 'rotate':
        console.log('Rotating piece');
        playerRotate(stage, 1);
        break;
      default:
        break;
    }
  }, [gameOver, movePlayer, drop, playerRotate, stage, dropTime]);

  // Add a tap-to-rotate handler specifically for the stage
  const handleStageRotate = useCallback(() => {
    if (!gameOver && dropTime) {
      console.log('Stage tap rotation');
      playerRotate(stage, 1);
    }
  }, [gameOver, playerRotate, stage, dropTime]);

  // Update competitive mode status and wallet address
  const handleCompetitiveModeActivation = (status, address) => {
    setIsCompetitiveMode(status);
    setWalletAddress(address);
    console.log(`Competitive mode ${status ? 'activated' : 'deactivated'} with address: ${address}`);
  };

  // Handle close of the competitive rules modal
  const handleCompetitiveRulesClose = () => {
    setShowModal(false);
  };

  // Handle confirmation of the competitive rules
  const handleCompetitiveRulesConfirm = async () => {
    if (isCompetitiveMode) {
      setIsLoading(true);
      
      try {
        // Mock payment for competitive mode
        const paymentResult = await mockPayCompetitiveFee(walletAddress);
        
        if (paymentResult.success) {
          setShowModal(false);
          startGame();
        } else {
          setError(paymentResult.error || 'Payment failed');
        }
      } catch (error) {
        setError(error.message || 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Just start the game in casual mode
      setShowModal(false);
      startGame();
    }
  };

  return (
    <div 
      className="tetris-wrapper" 
      role="button" 
      tabIndex="0" 
      onKeyDown={move} 
      onKeyUp={keyUp}
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

      <Modal
        isOpen={showModal}
        type="custom"
        onClose={handleCompetitiveRulesClose}
        customContent={
          <div className="competitive-modal-content">
            <h2>Competitive Mode Rules</h2>
            <div className="rules-list">
              <p>0. Still in testnet, no real money is used!</p>
              <p>1. All <span className="crypto-amount">$SUPR</span> are collected in a smart contract</p>
              <p>2. Every season lasts 1 week (Monday to Sunday)</p>
              <p>3. At the end of each season, the top 5 competitive players get prizes:</p>
              <ul>
                <li>1st place: <span className="crypto-amount">50%</span> of the pot</li>
                <li>2nd place: <span className="crypto-amount">30%</span> of the pot</li>
                <li>3rd place: <span className="crypto-amount">10%</span> of the pot</li>
                <li>4th place: <span className="crypto-amount">5%</span> of the pot</li>
                <li>5th place: <span className="crypto-amount">5%</span> of the pot</li>
              </ul>
              <p>5. After that, a new season starts and the leaderboard is cleared</p>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <div className="competitive-modal-buttons">
              <button 
                className="modal-button" 
                onClick={handleCompetitiveRulesConfirm}
                disabled={isLoading}
              >
                {isCompetitiveMode 
                  ? (isLoading 
                    ? 'Processing Payment...' 
                    : <span>Pay <span className="crypto-amount">1 $SUPR</span> & Start Game</span>
                    ) 
                  : 'Start Game'}
              </button>
              <button className="modal-button secondary" onClick={handleCompetitiveRulesClose}>
                Cancel
              </button>
            </div>
          </div>
        }
      />
      
      {/* Music toggle button */}
      <MusicToggle />
      
      <div className="tetris">
        <div className="game-header">
          <img src={logoText} alt="TetriSeed Logo" className="logo" />
          <h1>&nbsp;Clear your Debt!</h1>
        </div>
        
        <div className="game-content">
          {/* Conditional rendering based on mobile or desktop */}
          {isMobile ? (
            // Mobile layout with SuperSeed Facts on top
            <>
              {/* Mobile: Show SuperSeed Facts first */}
              <SuperSeedFacts />
              
              {/* Mobile: Game area */}
              <div className="game-area">
                <Stage 
                  stage={stage} 
                  message={message} 
                  showMessage={showMessage} 
                  interestMessage={interestMessage}
                  showInterestMessage={showInterestMessage}
                  onRotate={handleStageRotate}
                />
                <div className="game-info">
                  {gameOver ? (
                    <div className="game-over-container">
                      <h2 className="liquidated">LIQUIDATED!</h2>
                      <p>Your final score: {score}</p>
                      <StartButton callback={handleStartButtonClick} isCompetitive={isCompetitiveMode} />
                    </div>
                  ) : (
                    <div className="game-info-displays">
                      <Display text={`Score: ${score}`} />
                      <Display text={isMobile ? `Rows: ${rows}` : `Rows Cleared: ${rows}`} />
                      <Display text={`Level: ${level}`} />
                      
                      {/* Only show start button at game initialization */}
                      {!dropTime && !gameOver && (
                        <div className="start-container">
                          <StartButton callback={handleStartButtonClick} isCompetitive={isCompetitiveMode} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Mobile controls */}
                {!gameOver && dropTime && (
                  <MobileControls onControlClick={handleMobileControl} />
                )}
              </div>
              
              {/* Mobile: Leaderboard and player info below */}
              <div className="sidebar mobile-sidebar">
                <CompetitiveLeaderboard /> {/* Always show competitive leaderboard */}
                <div className="player-info">
                  <div className="player-info-row">
                    <div className="player-detail">
                      <span className="detail-label">Player:</span>
                      <span className="player-name">{playerName}</span>
                    </div>
                    <div className="player-detail">
                      <span className="detail-label">Mode:</span>
                      <span className={isCompetitiveMode ? "competitive-mode-active" : "casual-mode"}>
                        {isCompetitiveMode ? "Competitive" : "Casual"}
                      </span>
                    </div>
                  </div>
                  {isCompetitiveMode && <SeasonInfo isDetailed={false} />}
                  <CompetitiveMode onActivation={handleCompetitiveModeActivation} isActive={isCompetitiveMode} />
                </div>
              </div>
            </>
          ) : (
            // Desktop layout (unchanged)
            <>
              <div className="game-area">
                <Stage 
                  stage={stage} 
                  message={message} 
                  showMessage={showMessage} 
                  interestMessage={interestMessage}
                  showInterestMessage={showInterestMessage}
                  onRotate={handleStageRotate}
                />
                <div className="game-info">
                  {gameOver ? (
                    <div className="game-over-container">
                      <h2 className="liquidated">LIQUIDATED!</h2>
                      <p>Your final score: {score}</p>
                      <StartButton callback={handleStartButtonClick} isCompetitive={isCompetitiveMode} />
                    </div>
                  ) : (
                    <div className="game-info-displays">
                      <Display text={`Score: ${score}`} />
                      <Display text={`Rows Cleared: ${rows}`} />
                      <Display text={`Level: ${level}`} />
                      
                      {/* Only show start button at game initialization */}
                      {!dropTime && !gameOver && (
                        <div className="start-container">
                          <StartButton callback={handleStartButtonClick} isCompetitive={isCompetitiveMode} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="sidebar">
                <CompetitiveLeaderboard /> {/* Always show competitive leaderboard */}
                <div className="player-info">
                  <div className="player-info-row">
                    <div className="player-detail">
                      <span className="detail-label">Player:</span>
                      <span className="player-name">{playerName}</span>
                    </div>
                    <div className="player-detail">
                      <span className="detail-label">Mode:</span>
                      <span className={isCompetitiveMode ? "competitive-mode-active" : "casual-mode"}>
                        {isCompetitiveMode ? "Competitive" : "Casual"}
                      </span>
                    </div>
                  </div>
                  {isCompetitiveMode && <SeasonInfo isDetailed={false} />}
                  <CompetitiveMode onActivation={handleCompetitiveModeActivation} isActive={isCompetitiveMode} />
                </div>
                <SuperSeedFacts />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tetris;