import React, { useCallback, useRef } from 'react';

const MobileControls = ({ onControlClick }) => {
  // Track last pressed button to prevent duplicate events
  const lastButtonPressedRef = useRef('');
  const lastPressTimeRef = useRef(0);
  
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
    
    // Call the control function with the direction
    onControlClick(direction);
  }, [onControlClick]);
  
  // Reset the last button pressed on touch end to allow quick alternating presses
  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear last button to allow rapid alternating presses
    lastButtonPressedRef.current = '';
  }, []);
  
  // Prevent touch move events on buttons to avoid scrolling
  const preventTouchMove = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);
  
  return (
    <div className="mobile-controls">
      <button 
        className="mobile-btn left" 
        onTouchStart={(e) => handleButtonPress(e, 'left')}
        onTouchMove={preventTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Move Left"
      >
        ←
      </button>
      <button 
        className="mobile-btn down" 
        onTouchStart={(e) => handleButtonPress(e, 'down')}
        onTouchMove={preventTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Move Down"
      >
        ↓
      </button>
      <button 
        className="mobile-btn right" 
        onTouchStart={(e) => handleButtonPress(e, 'right')}
        onTouchMove={preventTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Move Right"
      >
        →
      </button>
      <button 
        className="mobile-btn rotate" 
        onTouchStart={(e) => handleButtonPress(e, 'rotate')}
        onTouchMove={preventTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        aria-label="Rotate"
      >
        ↻
      </button>
    </div>
  );
};

export default MobileControls; 