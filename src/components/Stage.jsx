import Cell from './Cell';

const Stage = ({ stage, message, showMessage, interestMessage, showInterestMessage }) => (
  <div className="stage-container">
    {showMessage && <div className="debt-message">{message}</div>}
    {showInterestMessage && <div className="interest-message">{interestMessage}</div>}
    
    <div className="stage">
      {stage.map((row, y) => 
        row.map((cell, x) => (
          <Cell key={`${y}-${x}`} type={cell[0]} />
        ))
      )}
    </div>
  </div>
);

export default Stage; 