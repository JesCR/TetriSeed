import React from 'react';

const MobileControls = ({ onControlClick }) => {
  const handleButtonClick = (e, direction) => {
    // Prevent any default browser behavior
    e.preventDefault();
    e.stopPropagation();
    
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