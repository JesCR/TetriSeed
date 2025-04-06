import React, { useCallback, useRef, useState, useEffect } from 'react';

const MobileControls = ({ onControlClick, player, stage, checkCollision, updatePlayerPos }) => {
  // Track last pressed button to prevent duplicate events
  const lastButtonPressedRef = useRef('');
  const lastPressTimeRef = useRef(0);
  // Add refs for long press functionality
  const downIntervalRef = useRef(null);
  const [isDownButtonPressed, setIsDownButtonPressed] = useState(false);
  
  // Clear any active intervals when component unmounts
  useEffect(() => {
    return () => {
      if (downIntervalRef.current) {
        clearInterval(downIntervalRef.current);
      }
    };
  }, []);

  // Effect to handle continuous pressing for the down button
  useEffect(() => {
    if (isDownButtonPressed) {
      // Start with initial delay before rapid presses begin
      const initialDelay = 200; // ms
      
      // Set a timeout for the initial delay
      const initialTimeout = setTimeout(() => {
        // Then set up an interval for continuous presses with collision detection
        downIntervalRef.current = setInterval(() => {
          console.log('Long press: down button interval triggered');
          
          // Check for collision directly - simplified approach to match main game
          if (player && stage && checkCollision && 
              typeof checkCollision === 'function') {
              
            const hasCollision = checkCollision(player, stage, { x: 0, y: 1 });
            
            if (!hasCollision) {
              // No collision, safely move down
              onControlClick('down');
            } else {
              // Collision detected, stop the movement and set collided
              console.log('MOBILE: Collision detected - stopping continuous drop');
              setIsDownButtonPressed(false);
              if (downIntervalRef.current) {
                clearInterval(downIntervalRef.current);
                downIntervalRef.current = null;
              }
              
              // Set collided = true to trigger merging in the parent component
              if (updatePlayerPos && typeof updatePlayerPos === 'function') {
                console.log('MOBILE: Setting immediate collision');
                updatePlayerPos({ x: 0, y: 0, collided: true });
              }
            }
          } else {
            // Missing required data, stop the continuous pressing
            console.log('MOBILE: Missing data for collision check - stopping continuous drop');
            setIsDownButtonPressed(false);
            if (downIntervalRef.current) {
              clearInterval(downIntervalRef.current);
              downIntervalRef.current = null;
            }
          }
        }, 100); // Repeat every 100ms for fast falling
      }, initialDelay);
      
      // Clean up function
      return () => {
        clearTimeout(initialTimeout);
        if (downIntervalRef.current) {
          clearInterval(downIntervalRef.current);
          downIntervalRef.current = null;
        }
      };
    }
  }, [isDownButtonPressed, onControlClick, player, stage, checkCollision, updatePlayerPos]);
  
  // Prevent default context menu (right click or long press)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);
  
  // Handle button press with improved event handling
  const handleButtonPress = useCallback((e, direction) => {
    // Prevent any default browser behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
    
    // Get the current time to check for double presses
    const now = Date.now();
    
    // Prevent too-rapid button presses (debounce)
    if (lastButtonPressedRef.current === direction && 
        now - lastPressTimeRef.current < 80) {
      return;
    }
    
    // Update the last button pressed info
    lastButtonPressedRef.current = direction;
    lastPressTimeRef.current = now;
    
    console.log(`Button ${direction} pressed`);
    
    // For down button, set the pressing state to true
    if (direction === 'down') {
      setIsDownButtonPressed(true);
    }
    
    // Call the control function with the direction
    onControlClick(direction);
  }, [onControlClick]);
  
  // Reset the last button pressed on touch end to allow quick alternating presses
  const handleTouchEnd = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear last button to allow rapid alternating presses
    lastButtonPressedRef.current = '';
    
    // If this was the down button, stop the long press
    if (direction === 'down') {
      setIsDownButtonPressed(false);
    }
  }, []);
  
  // Prevent touch move events on buttons to avoid scrolling
  const preventTouchMove = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);
  
  // Common button styles to prevent OS contextual menus
  const buttonStyle = {
    touchAction: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  };

  // Options for touch event listeners to ensure preventDefault works
  const touchOptions = { passive: false };
  
  // Register global event listeners to prevent context menu on mobile
  useEffect(() => {
    // Function to prevent default context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };
    
    // Add listeners to control area
    const controlsArea = document.querySelector('.mobile-controls');
    if (controlsArea) {
      controlsArea.addEventListener('contextmenu', preventContextMenu);
      controlsArea.addEventListener('touchstart', (e) => e.preventDefault(), touchOptions);
      controlsArea.addEventListener('touchmove', (e) => e.preventDefault(), touchOptions);
    }
    
    return () => {
      if (controlsArea) {
        controlsArea.removeEventListener('contextmenu', preventContextMenu);
        controlsArea.removeEventListener('touchstart', (e) => e.preventDefault());
        controlsArea.removeEventListener('touchmove', (e) => e.preventDefault());
      }
    };
  }, []);
  
  return (
    <div 
      className="mobile-controls" 
      onContextMenu={handleContextMenu}
    >
      <button 
        className="mobile-btn left" 
        style={buttonStyle}
        onTouchStart={(e) => handleButtonPress(e, 'left')}
        onTouchMove={preventTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, 'left')}
        onTouchCancel={(e) => handleTouchEnd(e, 'left')}
        onContextMenu={handleContextMenu}
        aria-label="Move Left"
      >
        ←
      </button>
      <button 
        className="mobile-btn down" 
        style={buttonStyle}
        onTouchStart={(e) => handleButtonPress(e, 'down')}
        onTouchMove={preventTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, 'down')}
        onTouchCancel={(e) => handleTouchEnd(e, 'down')}
        onContextMenu={handleContextMenu}
        aria-label="Move Down"
      >
        ↓
      </button>
      <button 
        className="mobile-btn right" 
        style={buttonStyle}
        onTouchStart={(e) => handleButtonPress(e, 'right')}
        onTouchMove={preventTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, 'right')}
        onTouchCancel={(e) => handleTouchEnd(e, 'right')}
        onContextMenu={handleContextMenu}
        aria-label="Move Right"
      >
        →
      </button>
      <button 
        className="mobile-btn rotate" 
        style={buttonStyle}
        onTouchStart={(e) => handleButtonPress(e, 'rotate')}
        onTouchMove={preventTouchMove}
        onTouchEnd={(e) => handleTouchEnd(e, 'rotate')}
        onTouchCancel={(e) => handleTouchEnd(e, 'rotate')}
        onContextMenu={handleContextMenu}
        aria-label="Rotate"
      >
        ↻
      </button>
    </div>
  );
};

export default MobileControls; 