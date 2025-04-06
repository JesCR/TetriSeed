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
import NextPiece from './NextPiece';
import WalletInfo from './WalletInfo';

import { useStage } from '../hooks/useStage';
import { usePlayer } from '../hooks/usePlayer';
import { useGameStatus } from '../hooks/useGameStatus';
import { checkCollision, createStage } from '../utils/tetrisUtils';
import { getApiUrl } from '../utils/apiConfig';
import { initAudio, playBackgroundMusic, pauseBackgroundMusic } from '../utils/audioUtils';
import { 
  mockPayCompetitiveFee, 
  setupWalletListeners,
  checkInitialWalletConnection
} from '../utils/web3Utils';

import logoText from '../assets/images/logo_text.png';
import bgImage from '../assets/images/superseed_logo-removebg.png';

const Tetris = () => {
  const [dropTime, setDropTime] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameModal, setShowNameModal] = useState(true);
  const [showTop10Modal, setShowTop10Modal] = useState(false);
  // Add a ref to store the current drop time when pressing down
  const savedDropTimeRef = useRef(1000);
  // Add state for random game over message
  const [gameOverMessage, setGameOverMessage] = useState('LIQUIDATED!');
  
  // List of possible game over messages
  const gameOverMessages = [
    'LIQUIDATED!',
    'BANKRUPT!',
    'REKT!',
    'NO LAMBO!',
    'GAME OVER!',
    'PORTFOLIO CRASH!',
    'MARGIN CALLED!',
    'FUNDS GONE!',
    'NGMI!',
    'BAD DEBT WINS!'
  ];

  // Initialize player and stage
  const [player, updatePlayerPos, resetPlayer, playerRotate, nextTetromino] = usePlayer();
  const [stage, setStage, rowsCleared, message, showMessage, interestMessage, showInterestMessage, showInterestRateMessage] = useStage(player, resetPlayer);
  const [score, setScore, rows, setRows, level, setLevel] = useGameStatus(rowsCleared);
  const [scoreInfo, setScoreInfo] = useState({ score: 0, rank: null });

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

  // Add Refs to track the previous move time to prevent rapid movements
  const lastMoveTimeRef = useRef({
    left: 0,
    right: 0,
    down: 0,
    rotate: 0
  });
  
  const MOVE_DEBOUNCE_MS = 150; // Minimum time between moves in milliseconds

  // Ref to hold the interval ID
  const intervalRef = useRef(null);
  // Ref to hold the latest callback function to avoid stale closures
  const savedCallback = useRef();

  // Add ref to track keyboard down key interval
  const keyDownIntervalRef = useRef(null);
  const isKeyDownPressedRef = useRef(false);

  // Submit score to the leaderboard - no dependencies to avoid circular references
  const submitScore = useCallback(async (scoreValue) => {
    // Only submit if player has a name, a positive score, and is in competitive mode
    if (!playerName || scoreValue <= 0 || !isCompetitiveMode) {
      console.log('Not submitting score:', { 
        playerName, 
        score: scoreValue, 
        isCompetitive: isCompetitiveMode,
        reason: !isCompetitiveMode ? 'Casual scores are not tracked' : 'Invalid name/score'
      });
      return;
    }
    
    // Access walletAddress directly from the component scope
    console.log('Submitting competitive score:', { playerName, score: scoreValue, address: walletAddress });
    
    try {
      // Only use competitive endpoint
      const endpoint = getApiUrl('/api/competitive-score');
      
      const scoreData = {
        name: playerName.trim(),
        score: scoreValue,
        address: walletAddress
      };
      
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
      
      // Update only the rank in scoreInfo, keeping the current score
      setScoreInfo(prevInfo => ({
        ...prevInfo,
        rank: data.rank || null
      }));
      
      setShowTop10Modal(true);
      
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
  }, [playerName, isCompetitiveMode, walletAddress, setScoreInfo, setShowTop10Modal]); // Add necessary dependencies

  // Simplified move player function - just checks collision and moves if possible
  const movePlayer = useCallback((dir) => {
    // Simple collision check then move
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      console.log(`Moving ${dir === -1 ? 'left' : 'right'}`);
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  }, [player, stage, updatePlayerPos]);

  // Drop the tetromino by one row manually - only if valid
  const drop = useCallback(() => {
    // Only drop if game is active
    if (gameOver || dropTime === null) {
      return;
    }
    
    // Simple, direct collision check regardless of position
    if (player && stage && !checkCollision(player, stage, { x: 0, y: 1 })) {
      // If no collision, move down
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else if (player && stage) {
      // Collision detected - always set collided immediately
      console.log('DROP: Collision detected - setting collided flag');
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  }, [gameOver, dropTime, player, stage, checkCollision, updatePlayerPos]);

  const dropPlayer = useCallback(() => {
    console.log('Drop player called');
    drop();
  }, [drop]);
  
  // Listen for overlap events and force game over
  useEffect(() => {
    // Function to handle game over due to overlapping pieces
    const handleGameOverOverlap = () => {
      console.log('GAME OVER EVENT RECEIVED: Pieces overlapped');
      setGameOver(true);
      setDropTime(null);
      // Select a random game over message
      const randomIndex = Math.floor(Math.random() * gameOverMessages.length);
      setGameOverMessage(gameOverMessages[randomIndex]);
      
      // Update scoreInfo with current score before submission
      setScoreInfo(prevInfo => ({
        ...prevInfo,
        score: score
      }));
      
      if (playerName) {
        submitScore(score);
      }
    };
    
    // Add event listener
    document.addEventListener('tetris_game_over_overlap', handleGameOverOverlap);
    
    // Clean up
    return () => {
      document.removeEventListener('tetris_game_over_overlap', handleGameOverOverlap);
    };
  }, [gameOverMessages, playerName, score, submitScore, setGameOver, setDropTime, setGameOverMessage, setScoreInfo]);

  // Initialize audio when component mounts
  useEffect(() => {
    // Initialize music
    initAudio();
    
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      const { connected, address } = await checkInitialWalletConnection();
      console.log('Initial wallet check in Tetris:', { connected, address });
      if (connected && address) {
        setWalletAddress(address);
      } else {
        // Ensure wallet address is always cleared when not connected
        setWalletAddress('');
        setIsCompetitiveMode(false);
      }
    };
    
    // Run initial check
    checkWalletConnection();
    
    // Listen for custom wallet events
    const handleWalletStateChanged = () => {
      console.log('Wallet state changed event received in Tetris');
      checkWalletConnection();
    };
    
    const handleWalletConnected = (event) => {
      console.log('Wallet connected event received in Tetris with address:', event.detail?.address);
      if (event.detail?.address) {
        // Directly update the wallet address without going through checkWalletConnection
        setWalletAddress(event.detail.address);
      }
    };
    
    window.addEventListener('wallet_state_changed', handleWalletStateChanged);
    window.addEventListener('wallet_disconnected', handleWalletStateChanged);
    window.addEventListener('wallet_connected', handleWalletConnected);
    
    // Setup wallet connection listeners and store cleanup function
    const cleanupWalletListeners = setupWalletListeners(
      // onAccountsChanged callback
      (newAccount) => {
        console.log('Wallet account changed to:', newAccount);
        if (newAccount) {
          setWalletAddress(newAccount);
        } else {
          setWalletAddress('');
          setIsCompetitiveMode(false);
        }
      },
      // onDisconnect callback
      () => {
        console.log('Wallet disconnected');
        setWalletAddress('');
        setIsCompetitiveMode(false);
      }
    );
    
    // Also set up a periodic check for wallet connection status
    const connectionCheckInterval = setInterval(async () => {
      const { connected, address } = await checkInitialWalletConnection();
      if (!connected) {
        // Only update if we're changing from connected to disconnected
        if (walletAddress) {
          console.log('Periodic check found wallet disconnected');
          setWalletAddress('');
          setIsCompetitiveMode(false);
        }
      }
    }, 3000);
    
    return () => {
      // Clean up by pausing music if component unmounts
      pauseBackgroundMusic();
      // Clean up event listeners
      window.removeEventListener('wallet_state_changed', handleWalletStateChanged);
      window.removeEventListener('wallet_disconnected', handleWalletStateChanged);
      window.removeEventListener('wallet_connected', handleWalletConnected);
      // Clean up wallet listeners
      if (cleanupWalletListeners) {
        cleanupWalletListeners();
      }
      // Clean up connection check interval
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // Lock screen orientation to portrait on mobile
  useEffect(() => {
    if (isMobile && typeof screen.orientation?.lock === 'function') {
      screen.orientation.lock('portrait-primary')
        .then(() => {
          console.log('Screen orientation locked to portrait.');
        })
        .catch((error) => {
          console.warn('Could not lock screen orientation:', error);
        });
    }
  }, [isMobile]);

  // Handle orientation changes for the overlay message
  useEffect(() => {
    // This function needs to be simpler to avoid conflicts with CSS
    const handleOrientationChange = () => {
      // Instead of trying to hide/show elements directly,
      // just add/remove a class that our CSS can target
      if (window.matchMedia("(orientation: landscape)").matches && isMobile) {
        document.body.classList.add('landscape-mode');
      } else {
        document.body.classList.remove('landscape-mode');
      }
    };

    // Initial check
    handleOrientationChange();

    // Listen to both resize and orientationchange for better device support
    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isMobile]);

  // Make scoreInfo state track the actual score during the game
  useEffect(() => {
    if (score !== undefined && score !== null) {
      setScoreInfo(prev => ({ ...prev, score }));
    }
  }, [score]);

  // Now define handlers that use the above functions
  const handleTouchStart = useCallback((e) => {
    // Don't prevent default on mobile to allow scrolling
    if (!isMobile) {
      e.preventDefault();
    }
    
    // Only set touchStart if touching game elements
    const isGameElement = e.target.closest('.stage') || 
                          e.target.closest('.mobile-btn') ||
                          e.target.closest('.next-piece-overlay');
    
    if (isGameElement) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, [isMobile]);
  
  const handleTouchMove = useCallback((e) => {
    // Only prevent default for game elements, not for scrolling the page
    const isGameElement = e.target.closest('.stage') || 
                          e.target.closest('.mobile-btn') ||
                          e.target.closest('.next-piece-overlay');
    
    if (isGameElement) {
      e.preventDefault();
      
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    // Ignore if game over
    if (gameOver) return;
    
    // Check if touch coordinates are valid (non-zero)
    if (touchStart.x === 0 && touchStart.y === 0) return;
    
    const swipeThreshold = 75; // Increased threshold
    const verticalSwipeThreshold = 60; // Separate threshold for vertical swipes
    const maxVerticalForHorizontal = 60; // Max vertical movement allowed for horizontal swipe
    const maxHorizontalForVertical = 60; // Max horizontal movement allowed for vertical swipe
    
    const diffX = touchEnd.x - touchStart.x;
    const diffY = touchEnd.y - touchStart.y;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffY);

    // Ignore tiny movements or if touchEnd wasn't updated
    if ((absDiffX < 10 && absDiffY < 10) || (touchEnd.x === 0 && touchEnd.y === 0)) {
      setTouchStart({ x: 0, y: 0 });
      setTouchEnd({ x: 0, y: 0 });
      return;
    }
    
    // Horizontal swipe - requires significant horizontal movement and limited vertical movement
    if (absDiffX > swipeThreshold && absDiffY < maxVerticalForHorizontal) {
      const dir = diffX > 0 ? 1 : -1;
      console.log(`Swipe ${dir > 0 ? 'right' : 'left'}`);
      movePlayer(dir);
    }
    // Vertical swipe down - requires significant downward movement and limited horizontal movement
    else if (diffY > verticalSwipeThreshold && absDiffX < maxHorizontalForVertical) {
      console.log('Swipe down');
      drop();
    }
    
    // Reset touch positions after processing
    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  }, [gameOver, touchStart, touchEnd, movePlayer, drop]);

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
    // Set initial drop time based on level 1 speed (48 frames * 16.67ms)
    const initialDropTime = 48 * 16.67; // For level 1 (800ms)
    setDropTime(initialDropTime);
    savedDropTimeRef.current = initialDropTime;
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(1); // Start at level 1 instead of 0
    
    // Show initial interest rate message for level 1
    showInterestRateMessage(1);
    
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

  // Clear the key down interval when component unmounts
  useEffect(() => {
    return () => {
      if (keyDownIntervalRef.current) {
        clearInterval(keyDownIntervalRef.current);
        keyDownIntervalRef.current = null;
      }
    };
  }, []);

  // Start timer
  const keyUp = useCallback(({ keyCode }) => {
    if (!gameOver) {
      // Always restore drop time when releasing down key, regardless of current state
      if (keyCode === 40 || keyCode === 83) { // Down arrow or S
        console.log('Key up - restoring drop speed to:', savedDropTimeRef.current);
        setDropTime(savedDropTimeRef.current);
        
        // Clear the down key interval
        isKeyDownPressedRef.current = false;
        if (keyDownIntervalRef.current) {
          clearInterval(keyDownIntervalRef.current);
          keyDownIntervalRef.current = null;
        }
      }
    }
  }, [gameOver, setDropTime]);

  // Effect to handle continuous pressing for the down button
  useEffect(() => {
    if (isKeyDownPressedRef.current && keyDownIntervalRef.current) {
      // Set up interval for continuous presses, but check collision each time
      const checkDropAndCollision = () => {
        // Only process if game is active and not in game over state
        if (!gameOver && player && stage) {
          // Check if we can move down - add a more thorough collision check
          if (!checkCollision(player, stage, { x: 0, y: 1 })) {
            // Move piece down
            drop();
          } else {
            // If we hit something, stop continuous dropping
            console.log('Collision detected in interval - stopping continuous drop');
            isKeyDownPressedRef.current = false;
            if (keyDownIntervalRef.current) {
              clearInterval(keyDownIntervalRef.current);
              keyDownIntervalRef.current = null;
            }
            // Make sure we trigger the collision handling by setting collided to true
            updatePlayerPos({ x: 0, y: 0, collided: true });
          }
        } else {
          // If game is over or player/stage not available, stop the interval
          isKeyDownPressedRef.current = false;
          if (keyDownIntervalRef.current) {
            clearInterval(keyDownIntervalRef.current);
            keyDownIntervalRef.current = null;
          }
        }
      };
      
      // Replace the existing interval with our collision-checking one
      if (keyDownIntervalRef.current) {
        clearInterval(keyDownIntervalRef.current);
        keyDownIntervalRef.current = setInterval(checkDropAndCollision, 100);
      }
    }
  }, [isKeyDownPressedRef.current, player, stage, gameOver, drop, checkCollision, updatePlayerPos]);

  // User controls
  const move = useCallback((event) => {
    const { keyCode } = event;
    
    // Only process input if the game is active (has a dropTime)
    if (!gameOver && dropTime !== null) {
      // Prevent default scrolling for arrow keys
      if ([37, 38, 39, 40, 65, 68, 83, 87].includes(keyCode)) {
        event.preventDefault();
      }
      
      if (keyCode === 37 || keyCode === 65) { // Left arrow or A
        movePlayer(-1);
      } else if (keyCode === 39 || keyCode === 68) { // Right arrow or D
        movePlayer(1);
      } else if (keyCode === 40 || keyCode === 83) { // Down arrow or S
        // First immediately move down once
        drop();
        
        // If this is a new keydown press, set up interval for continuous dropping
        if (!isKeyDownPressedRef.current) {
          isKeyDownPressedRef.current = true;
          
          // Set a timeout for initial delay before rapid drops
          const initialDelay = 200; // ms
          
          setTimeout(() => {
            // Only set up the interval if the key is still being pressed and game is active
            if (isKeyDownPressedRef.current && !keyDownIntervalRef.current && !gameOver) {
              // Create an interval that checks for collision
              keyDownIntervalRef.current = setInterval(() => {
                console.log('Long keypress: down key interval triggered');
                
                // Check if we can move down - with thorough collision check
                if (!gameOver && player && stage && !checkCollision(player, stage, { x: 0, y: 1 })) {
                  drop();
                } else {
                  // Stop continuous dropping if we hit something or game is over
                  console.log('Collision detected or game over - stopping continuous drop');
                  isKeyDownPressedRef.current = false;
                  clearInterval(keyDownIntervalRef.current);
                  keyDownIntervalRef.current = null;
                  
                  // Only set collision if game is still active
                  if (!gameOver && player && stage) {
                    updatePlayerPos({ x: 0, y: 0, collided: true });
                  }
                }
              }, 100); // Repeat every 100ms for fast falling
            }
          }, initialDelay);
        }
      } else if (keyCode === 38 || keyCode === 87) { // Up arrow or W
        playerRotate(stage, 1);
      }
    }
  }, [gameOver, dropTime, movePlayer, drop, playerRotate, stage, player, checkCollision, updatePlayerPos]);

  // Focus tetris area on mount and when modals are closed
  useEffect(() => {
    if (tetrisRef.current && !showNameModal && !showTop10Modal) {
      tetrisRef.current.focus();
    }
  }, [showNameModal, showTop10Modal]);

  // Effect to update the saved callback when dependencies change
  useEffect(() => {
    // Define the function to be executed on each interval tick
    savedCallback.current = () => {
      if (!gameOver) {
        // Check if we need to level up (every 5 lines)
        const shouldLevelUp = rows >= level * 5 && level < Math.floor(rows / 5) + 1;
        if (shouldLevelUp) { 
          const newLevel = level + 1;
          console.log(`Leveling up from ${level} to ${newLevel}, rows: ${rows}, threshold: ${level * 5}`);
          setLevel(newLevel); // Update level state

          // Calculate new speed based on NES Tetris doubled speed table
          let framesPerCell;
          if (newLevel === 1) framesPerCell = 48;
          else if (newLevel === 2) framesPerCell = 40;
          else if (newLevel === 3) framesPerCell = 34;
          else if (newLevel === 4) framesPerCell = 28;
          else if (newLevel === 5) framesPerCell = 24;
          else if (newLevel === 6) framesPerCell = 18;
          else if (newLevel === 7) framesPerCell = 14;
          else if (newLevel === 8) framesPerCell = 10;
          else if (newLevel === 9) framesPerCell = 7;
          else if (newLevel === 10) framesPerCell = 6;
          else if (newLevel >= 11 && newLevel <= 13) framesPerCell = 6;
          else if (newLevel >= 14 && newLevel <= 16) framesPerCell = 4;
          else if (newLevel >= 17) framesPerCell = 2;
          else framesPerCell = 2; // Default for higher levels

          const newDropTime = framesPerCell * 16.67;
          // Ensure dropTime doesn't become too fast or zero
          const finalDropTime = Math.max(newDropTime, 50); // Minimum 50ms drop time

          setDropTime(finalDropTime); // Update dropTime state, which will restart the interval effect
          savedDropTimeRef.current = finalDropTime;
          console.log(`Showing interest rate message for level ${newLevel}`);
          showInterestRateMessage(newLevel);
          console.log(`Level up to ${newLevel}, new speed: ${finalDropTime}ms (${framesPerCell} frames)`);
          return; // Exit early as dropTime change will handle the next tick
        }

        // FIXED GAME OVER DETECTION - Check if any active cell of the player piece overlaps with a merged cell
        // This is the critical check that ensures the game ends when pieces overlap
        let hasOverlap = false;
        if (player && player.tetromino && stage) {
          for (let y = 0; y < player.tetromino.length; y++) {
            for (let x = 0; x < player.tetromino[y].length; x++) {
              if (player.tetromino[y][x] !== 0) {
                const targetY = y + player.pos.y;
                const targetX = x + player.pos.x;
                
                if (targetY >= 0 && targetY < stage.length && 
                    targetX >= 0 && targetX < stage[0].length) {
                  // If current cell in the player's tetromino is not empty AND
                  // the corresponding cell in the stage is merged, we have an overlap
                  if (stage[targetY][targetX][1] === 'merged') {
                    console.log(`GAME OVER: Overlap detected at [${targetX},${targetY}]`);
                    hasOverlap = true;
                    break;
                  }
                }
              }
            }
            if (hasOverlap) break;
          }
        }
        
        // Set game over if overlap is detected
        if (hasOverlap) {
          console.log('GAME OVER: Pieces are overlapping');
          setGameOver(true);
          setDropTime(null);
          // Select a random game over message
          const randomIndex = Math.floor(Math.random() * gameOverMessages.length);
          setGameOverMessage(gameOverMessages[randomIndex]);
          
          // Update scoreInfo with current score before submission
          setScoreInfo(prevInfo => ({
            ...prevInfo,
            score: score
          }));
          
          if (playerName) {
            submitScore(score);
          }
          return; // Exit immediately
        }

        // CRITICAL FIX: Force check collision for all pieces
        const hasCollision = checkCollision(player, stage, { x: 0, y: 1 });
        
        if (!hasCollision) {
          // No collision, move down
          updatePlayerPos({ x: 0, y: 1, collided: false });
        } else {
          // We have a collision - handle it
          console.log('GAME LOOP: Setting immediate collision');
          // Immediately update with collided=true for all pieces
          updatePlayerPos({ x: 0, y: 0, collided: true });
          
          // Run overlap check again on the next tick to catch game over condition
          setTimeout(() => {
            // This will be checked on the next tick
          }, 0);
        }
      }
    };
  }, [
      gameOver, rows, level, player, stage, setLevel, setDropTime, 
      showInterestRateMessage, checkCollision, updatePlayerPos, 
      setGameOver, playerName, score, submitScore, savedDropTimeRef,
      gameOverMessages // Add the messages array to dependencies
  ]); // Dependencies needed inside the callback

  // Interval for auto-dropping the tetromino
  useEffect(() => {
    console.log('Setting up drop interval with dropTime:', dropTime);
    
    // Clear previous interval if it exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Cleared previous interval');
    }

    if (dropTime !== null && !gameOver) {
      const tick = () => {
        savedCallback.current(); // Execute the latest callback
      };
      intervalRef.current = setInterval(tick, dropTime);
      console.log('Interval created:', intervalRef.current, 'with dropTime:', dropTime);
    } else {
      console.log('Not creating interval - dropTime is null or game is over.');
    }

    // Clean up function
    return () => {
      if (intervalRef.current) {
        console.log('Clearing interval on cleanup:', intervalRef.current);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dropTime, gameOver]); // Only re-run when dropTime or gameOver changes

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
    
    // Prevent context menu on mobile devices
    const preventContextMenu = (e) => {
      // Check if this is the game area or mobile controls
      if (e.target.closest('.mobile-controls') || 
          e.target.closest('.tetris-wrapper') ||
          e.target.closest('.stage') ||
          e.target.closest('.mobile-btn')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Add more aggressive touch handlers for mobile
    if (window.innerWidth <= 768) {
      // For iOS devices - add additional handling
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        // iOS-specific touch handling to prevent context menu
        document.body.style.webkitTouchCallout = 'none';
        document.body.style.webkitUserSelect = 'none';
      }
    }
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [showNameModal, showTop10Modal]);

  // Handle mobile control button clicks
  const handleMobileControl = useCallback((direction) => {
    // Only accept input when the game is active
    if (gameOver || dropTime === null) return;
    
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
        drop();
        break;
      case 'rotate':
        console.log('Rotating piece');
        playerRotate(stage, 1);
        break;
      default:
        break;
    }
  }, [gameOver, dropTime, movePlayer, drop, playerRotate, stage]);

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
        // Process payment for competitive mode
        const paymentResult = await mockPayCompetitiveFee(walletAddress);
        
        if (paymentResult.success) {
          // Payment successful, close modal and start game
          setShowModal(false);
          
          // Immediately refresh season info to update pot size and player count
          if (typeof window.refreshSeasonInfo === 'function') {
            console.log('Refreshing season info after payment');
            window.refreshSeasonInfo();
          }
          
          // Start the game after a short delay to allow refresh
          setTimeout(() => {
            startGame();
          }, 300);
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
      ref={tetrisRef}
      className="tetris-wrapper"
      tabIndex="0"
      onKeyDown={move}
      onKeyUp={keyUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '90%',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="tetris-content" style={{ position: 'relative', zIndex: 1 }}>
        <Modal 
          isOpen={showNameModal} 
          type="nameInput" 
          onSubmit={handleNameSubmit} 
        />
        
        <Modal 
          isOpen={showTop10Modal && !showNameModal} 
          type="top10" 
          score={scoreInfo} 
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
                <div className="rule-item">
                  <span className="rule-number">0.</span>
                  <span className="rule-text">Still in testnet, no real money is used!</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">1.</span>
                  <span className="rule-text">All <span className="crypto-amount">$SUPR</span> are collected in a smart contract</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">2.</span>
                  <span className="rule-text">Every season lasts 1 week (Monday to Sunday)</span>
                </div>
                <div className="rule-item">
                  <span className="rule-number">3.</span>
                  <span className="rule-text">At the end of each season, the top 5 competitive players get prizes:</span>
                </div>
                <div className="prizes-list">
                  <div className="prize-item-row">
                    <span className="prize-rank">1st place:</span>
                    <span className="prize-value"><span className="crypto-amount">50%</span> of the pot</span>
                  </div>
                  <div className="prize-item-row">
                    <span className="prize-rank">2nd place:</span>
                    <span className="prize-value"><span className="crypto-amount">30%</span> of the pot</span>
                  </div>
                  <div className="prize-item-row">
                    <span className="prize-rank">3rd place:</span>
                    <span className="prize-value"><span className="crypto-amount">10%</span> of the pot</span>
                  </div>
                  <div className="prize-item-row">
                    <span className="prize-rank">4th place:</span>
                    <span className="prize-value"><span className="crypto-amount">5%</span> of the pot</span>
                  </div>
                  <div className="prize-item-row">
                    <span className="prize-rank">5th place:</span>
                    <span className="prize-value"><span className="crypto-amount">5%</span> of the pot</span>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-number">5.</span>
                  <span className="rule-text">After that, a new season starts and the leaderboard is cleared</span>
                </div>
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
        
        <div className="tetris">
          <div className="game-header">
            <div className="title-row">
              <img src={logoText} alt="TetriSeed Logo" className="logo" />
              <h1 className={isMobile ? "small-title" : ""}>
                {isMobile ? "Clear your Debt!" : "\u00A0Clear your Debt!\u00A0"}
              </h1>
            </div>
            {walletAddress ? (
              <div className="header-wallet-info">
                <WalletInfo 
                  walletAddress={walletAddress} 
                  isMobile={isMobile}
                  key={`wallet-${walletAddress.substring(0, 8)}`} 
                />
                <MusicToggle />
              </div>
            ) : (
              <div className="header-wallet-info">
                <MusicToggle />
              </div>
            )}
          </div>
          
          <div className="game-content">
            {/* Conditional rendering based on mobile or desktop */}
            {isMobile ? (
              // Mobile layout with SuperSeed Facts on top
              <>
                {/* Mobile: Show SuperSeed Facts first */}
                <SuperSeedFacts isMobile={isMobile} />
                
                {/* Mobile: Game area */}
                <div className="game-area">
                  <div className="stage-container">
                    {/* Next piece is positioned as a background in stage container */}
                    {!gameOver && dropTime && (
                      <div className="next-piece-overlay">
                        <NextPiece tetromino={nextTetromino} />
                      </div>
                    )}
                    <Stage 
                      stage={stage} 
                      message={message} 
                      showMessage={showMessage} 
                      interestMessage={interestMessage}
                      showInterestMessage={showInterestMessage}
                    />
                  </div>
                  <div className="game-info">
                    {gameOver ? (
                      <div className="game-over-container">
                        <h2 className="liquidated">{gameOverMessage}</h2>
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
                    <MobileControls 
                      onControlClick={handleMobileControl} 
                      player={player}
                      stage={stage}
                      checkCollision={checkCollision}
                      updatePlayerPos={updatePlayerPos}
                    />
                  )}
                </div>
                
                {/* Mobile: Leaderboard and player info below - REORDERED */}
                <div className="sidebar mobile-sidebar">
                  {/* Leaderboard comes BEFORE player info - REMOVE for mobile */}
                  {/* <CompetitiveLeaderboard /> */}
                  <div className="player-info mobile-player-info">
                    {/* NEW: Top Row container */}
                    <div className="player-info-top-row">
                      {/* Player Name Detail */}
                      <div className="player-detail player-name-detail">
                        <span className="detail-label">Player:</span>
                        <span className="player-name">{playerName}</span>
                      </div>
                      
                      {/* Competitive Mode Component (contains buttons) */}
                      {/* Note: This includes the connect/disconnect button */}
                      <CompetitiveMode onActivation={handleCompetitiveModeActivation} isActive={isCompetitiveMode} />
                      
                      {/* Game Mode Detail */}
                      <div className="player-detail mode-detail">
                        <span className="detail-label">Mode:</span>
                        <span className={isCompetitiveMode ? "competitive-mode-active" : "casual-mode"}>
                          {isCompetitiveMode ? "Competitive" : "Casual"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Optional: Season Info remains below */}
                    {isCompetitiveMode && <SeasonInfo isDetailed={false} />}
                  </div>
                </div>
              </>
            ) : (
              // Desktop layout - reordered components
              <>
                <div className="game-area">
                  <div className="stage-container">
                    {/* Next piece is positioned as a background in stage container */}
                    {!gameOver && dropTime && (
                      <div className="next-piece-overlay">
                        <NextPiece tetromino={nextTetromino} />
                      </div>
                    )}
                    <Stage 
                      stage={stage} 
                      message={message} 
                      showMessage={showMessage} 
                      interestMessage={interestMessage}
                      showInterestMessage={showInterestMessage}
                    />
                  </div>
                  <div className="game-info">
                    {gameOver ? (
                      <div className="game-over-container">
                        <h2 className="liquidated">{gameOverMessage}</h2>
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
                
                {/* Desktop: Leaderboard and player info below - REORDERED */}
                <div className="sidebar desktop-sidebar">
                  {/* Leaderboard comes BEFORE player info - Keep for desktop */}
                  <CompetitiveLeaderboard />
                  <div className="player-info desktop-player-info">
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
                    <CompetitiveMode onActivation={handleCompetitiveModeActivation} isActive={isCompetitiveMode} />
                    {isCompetitiveMode && <SeasonInfo isDetailed={false} />}
                  </div>
                  {/* Add SuperSeedFacts back to the desktop sidebar */}
                  <SuperSeedFacts isMobile={isMobile} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris;