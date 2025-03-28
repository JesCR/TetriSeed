const Display = ({ gameOver, text }) => (
  <div className={`display ${gameOver ? 'game-over' : ''}`}>
    {text}
  </div>
);

export default Display; 