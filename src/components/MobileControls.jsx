import React from 'react';

const MobileControls = ({ onControlClick }) => {
  return (
    <div className="mobile-controls">
      <button 
        className="mobile-btn left" 
        onClick={() => onControlClick('left')}
        aria-label="Move Left"
      >
        ←
      </button>
      <button 
        className="mobile-btn down" 
        onClick={() => onControlClick('down')}
        aria-label="Move Down"
      >
        ↓
      </button>
      <button 
        className="mobile-btn right" 
        onClick={() => onControlClick('right')}
        aria-label="Move Right"
      >
        →
      </button>
      <button 
        className="mobile-btn rotate" 
        onClick={() => onControlClick('rotate')}
        aria-label="Rotate"
      >
        ↻
      </button>
    </div>
  );
};

export default MobileControls; 