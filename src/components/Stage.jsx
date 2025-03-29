import Cell from './Cell';
import bgImage from '../assets/images/background.png';

const Stage = ({ stage, message, showMessage, interestMessage, showInterestMessage, onRotate }) => {
  const stageStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  // Track if we've already handled a tap to prevent doubles
  let tapHandled = false;

  const handleTapRotate = (e) => {
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle the tap if it hasn't been handled yet
    if (!tapHandled && onRotate) {
      tapHandled = true;
      
      // Call the rotation function
      onRotate();
      
      // Reset the handled flag after a short delay
      setTimeout(() => {
        tapHandled = false;
      }, 300); // Add a small debounce time
    }
  };

  return (
    <div className="stage-container">
      {showMessage && <div className="debt-message">{message}</div>}
      {showInterestMessage && <div className="interest-message">{interestMessage}</div>}
      
      <div 
        className="stage" 
        style={stageStyle}
        onClick={handleTapRotate}
        // Use only one event handler for tap to avoid duplication
        // and remove onTouchStart to avoid double triggering
      >
        {stage.map((row, y) => 
          row.map((cell, x) => (
            <Cell key={`${y}-${x}`} type={cell[0]} />
          ))
        )}
      </div>
    </div>
  );
};

export default Stage; 