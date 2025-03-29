import Cell from './Cell';
import bgImage from '../assets/images/background.png';

const Stage = ({ stage, message, showMessage, interestMessage, showInterestMessage, onRotate }) => {
  const stageStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  const handleTapRotate = (e) => {
    // Prevent default behavior to avoid zooming and other unwanted actions
    e.preventDefault();
    
    // Call the rotation function
    if (onRotate) {
      onRotate();
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
        onTouchStart={handleTapRotate}
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