import React from 'react';
import Cell from './Cell';
import bgImage from '../assets/images/background.png';

const Stage = ({ stage, message, showMessage, interestMessage, showInterestMessage }) => {
  const stageStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="stage-container">
      {showMessage && <div className="debt-message">{message}</div>}
      {showInterestMessage && <div className="interest-message">{interestMessage}</div>}
      
      <div 
        className="stage" 
        style={stageStyle}
        onClick={(e) => e.preventDefault()}
      >
        {stage.map((row, y) => 
          row.map((cell, x) => (
            <Cell key={`${y}-${x}`} type={cell[0]} cellState={cell[1]} />
          ))
        )}
      </div>
    </div>
  );
};

export default Stage; 