import React, { useRef } from 'react';

const MobileControls = ({ onControlClick }) => {
  // Track if buttons were recently clicked to prevent double actions
  const rotateDebounceRef = useRef(false);
  const leftDebounceRef = useRef(false);
  const rightDebounceRef = useRef(false);
  
  const handleButtonClick = (e, direction) => {
    // Prevent any default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Check debounce for each direction
    if (direction === 'rotate' && rotateDebounceRef.current) {
      return; // Ignore if already rotating
    }
    
    if (direction === 'left' && leftDebounceRef.current) {
      return; // Ignore if already moving left
    }
    
    if (direction === 'right' && rightDebounceRef.current) {
      return; // Ignore if already moving right
    }
    
    // Set appropriate debounce flag
    if (direction === 'rotate') {
      rotateDebounceRef.current = true;
      
      // Reset debounce after animation completes
      setTimeout(() => {
        rotateDebounceRef.current = false;
      }, 200);
    } else if (direction === 'left') {
      leftDebounceRef.current = true;
      
      // Reset debounce after animation completes
      setTimeout(() => {
        leftDebounceRef.current = false;
      }, 150); // Slightly faster than rotate
    } else if (direction === 'right') {
      rightDebounceRef.current = true;
      
      // Reset debounce after animation completes
      setTimeout(() => {
        rightDebounceRef.current = false;
      }, 150); // Slightly faster than rotate
    }
    
    // Call the control function with the direction
    onControlClick(direction);
  };
  
  return (
    <div className="mobile-controls">
      <button 
        className="mobile-btn left" 
        onClick={(e) => handleButtonClick(e, 'left')}
        onTouchStart={(e) => handleButtonClick(e, 'left')}
        aria-label="Move Left"
      >
        ←
      </button>
      <button 
        className="mobile-btn down" 
        onClick={(e) => handleButtonClick(e, 'down')}
        onTouchStart={(e) => handleButtonClick(e, 'down')}
        aria-label="Move Down"
      >
        ↓
      </button>
      <button 
        className="mobile-btn right" 
        onClick={(e) => handleButtonClick(e, 'right')}
        onTouchStart={(e) => handleButtonClick(e, 'right')}
        aria-label="Move Right"
      >
        →
      </button>
      <button 
        className="mobile-btn rotate" 
        onClick={(e) => handleButtonClick(e, 'rotate')}
        onTouchStart={(e) => handleButtonClick(e, 'rotate')}
        aria-label="Rotate"
      >
        ↻
      </button>
    </div>
  );
};

export default MobileControls; 